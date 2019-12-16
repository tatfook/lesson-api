'use strict';

const Service = require('../common/service.js');
const {
    CLASS_MEMBER_ROLE_ADMIN,
    FIVE,
    TWO,
    ONE,
    THREE,
    SIX,
    FIFTEEN,
} = require('../common/consts.js');
const _ = require('lodash');
const Err = require('../common/err');
const moment = require('moment');

// 各个类型激活码的过期时间
const endTimeMap = {
    1: time =>
        moment(time)
            .add(ONE, 'month')
            .format('YYYY-MM-DD'),
    2: time =>
        moment(time)
            .add(TWO, 'month')
            .format('YYYY-MM-DD'),
    5: time =>
        moment(time)
            .add(THREE, 'month')
            .format('YYYY-MM-DD'),
    6: time =>
        moment(time)
            .add(SIX, 'month')
            .format('YYYY-MM-DD'),
    7: time =>
        moment(time)
            .add(FIFTEEN, 'month')
            .format('YYYY-MM-DD'),
};

class LessonOrgActivateCodeService extends Service {
    /**
     * 创建激活码
     * @param {*} params {count,classIds?,names?,type}
     * @param {*} authParams {userId, organizationId, roleId, username}
     */
    async createActivateCode(params, authParams) {
        const { userId, organizationId, roleId, username } = authParams;
        const TEN = 10;
        const NINTYNINE = 99;
        const classIds = params.classIds;
        const type = params.type;
        const names = params.names || [];
        const count = params.count || names.length || 1;
        const formalTypes = [ '5', '6', '7' ]; // 正式邀请码类型

        // check auth
        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }

        // check class
        let classes = [];
        if (classIds && classIds.length) {
            classes = await this.ctx.service.lessonOrganizationClass.findAllByCondition(
                {
                    id: { $in: classIds },
                    organizationId,
                    status: 1,
                }
            );
            if (classes.length !== classIds.length) {
                return this.ctx.throw(400, Err.CLASS_NOT_EXIST);
            }
        }

        // check org
        const organ = await this.ctx.service.lessonOrganization.getByCondition({
            id: organizationId,
            endDate: { $gte: new Date() },
        });
        if (!organ) this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

        // check limit if need
        if (formalTypes.includes(type + '') && organ.activateCodeLimit) {
            const key = `type${type}`;
            const limit = organ.activateCodeLimit[key]; // 该机构这种激活码的上限
            const historyCount = await this.getCountByCondition({
                organizationId,
                type,
                state: {
                    $in: [ '0', '1' ],
                },
            });
            if (historyCount + count > limit) {
                this.ctx.throw(403, Err.ACTIVATE_CODE_UPPERLIMITED);
            }
        }

        const datas = [];
        for (let i = 0; i < count; i++) {
            datas.push({
                organizationId,
                classIds,
                type,
                key: `${
                    classIds ? classIds.reduce((p, c) => p + c, '') : ''
                }${i}${new Date().getTime()}${_.random(TEN, NINTYNINE)}`,
                name: names.length > i ? names[i] : '',
            });
        }

        const list = await this.ctx.model.LessonOrganizationActivateCode.bulkCreate(
            datas
        );

        // 把这些班级name聚合一起再记录log
        const name = classes.reduce((p, c) => `${p},${c.name}`, '') || '';
        await this.ctx.service.lessonOrganizationLog.classLog({
            organizationId,
            cls: { name: name.slice(1) },
            action: 'activateCode',
            count,
            handleId: userId,
            username,
        });

        return list;
    }

    /**
     * 激活码列表
     * @param {*} queryOptions 分页排序等参数 必选
     * @param {*} condition 查询条件 必选
     */
    async findAllActivateCodeAndCount(queryOptions, condition) {
        const ret = await this.ctx.model.LessonOrganizationActivateCode.findAndCountAll(
            {
                ...queryOptions,
                where: condition,
            }
        );

        const classIds = _.uniq(
            ret.rows.reduce((p, c) => p.concat(c.classIds), [])
        );

        const classes = await this.ctx.model.LessonOrganizationClass.findAll({
            where: { id: { $in: classIds } },
        });

        ret.rows.forEach(r => {
            r = r.get();
            const classIds = r.classIds;
            r.lessonOrganizationClasses = [];
            classIds.forEach(rr => {
                const index = _.findIndex(classes, o => o.id === rr);
                r.lessonOrganizationClasses.push(
                    index > -1 ? classes[index] : {}
                );
            });
            delete r.classIds;
        });
        return ret;
    }

    /**
     * 通过条件获取activateCode
     * @param {*} condition 必选,对象
     */
    async getByCondition(condition) {
        let data = await this.ctx.model.LessonOrganizationActivateCode.findOne({
            where: condition,
        });
        if (data) data = data.get({ plain: true });

        return data;
    }

    async getCountByCondition(condition) {
        const count = await this.ctx.model.LessonOrganizationActivateCode.count(
            {
                where: condition,
            }
        );
        return count;
    }

    /**
     * 根据条件更新
     * @param {*} params 更新的字段
     * @param {*} condition 条件
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.LessonOrganizationActivateCode.update(
            params,
            {
                where: condition,
            }
        );
    }

    /**
     * 学生使用激活码激活
     * @param {*} params {key, realname, organizationId,parentPhoneNum?,verifCode? }
     * @param {*} authParams {userId, username}
     */
    async useActivateCode(params, authParams) {
        const { userId, username } = authParams;
        let {
            key,
            realname,
            organizationId,
            parentPhoneNum,
            verifCode,
        } = params;

        let checkFlag = false;
        if (parentPhoneNum && verifCode) {
            const check = await this.app.redis.get(
                `verifCode:${parentPhoneNum}`
            );
            if (check !== verifCode) this.ctx.throw(400, Err.VERIFCODE_ERR);
            checkFlag = true;
        }

        const data = await this.getByCondition({ key, state: 0 });
        if (!data) return this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);

        if (organizationId && data.organizationId !== organizationId) {
            return this.ctx.throw(400, Err.ACTIVATE_CODE_NOT_MATCH_ORGAN);
        }
        organizationId = data.organizationId;

        if (data.classIds.length) {
            const classes = await this.ctx.service.lessonOrganizationClass.getByCondition(
                {
                    id: { $in: data.classIds },
                    status: 1,
                }
            );
            if (classes.length !== data.classIds.length) {
                return this.ctx.throw(400, Err.CLASS_IS_FINISH);
            }
        }

        const organ = await this.ctx.service.lessonOrganization.getByCondition({
            id: data.organizationId,
            endDate: { $gt: new Date() },
        });
        if (!organ) return this.ctx.throw(400, Err.INVALID_ORGAN);

        const ms = await this.ctx.service.lessonOrganizationClassMember.getAllByCondition(
            {
                organizationId: data.organizationId,
                memberId: userId,
            }
        );

        const members = [];
        if (data.classIds.length) {
            for (let i = 0; i < data.classIds.length; i++) {
                const obj = {
                    organizationId,
                    classId: data.classIds[i],
                    memberId: userId,
                    type: data.type >= FIVE ? TWO : 1,
                    endTime: endTimeMap[data.type](),
                    realname,
                };
                if (checkFlag) obj.parentPhoneNum = parentPhoneNum;
                obj.roleId =
                    1 |
                    (
                        _.find(
                            ms,
                            m =>
                                m.classId === data.classIds[i] &&
                                m.memberId === userId
                        ) || { roleId: 0 }
                    ).roleId;
                members.push(obj);
            }
        } else {
            const obj = {
                organizationId,
                classId: 0,
                memberId: userId,
                type: data.type >= FIVE ? TWO : 1,
                endTime: endTimeMap[data.type](),
                realname,
            };
            if (checkFlag) obj.parentPhoneNum = parentPhoneNum;
            obj.roleId =
                1 |
                (
                    _.find(ms, m => m.memberId === userId) || {
                        roleId: 0,
                    }
                ).roleId;
            members.push(obj);
        }

        // 事务操作
        let member;
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            await this.ctx.model.LessonOrganizationClassMember.destroy({
                where: {
                    id: { $in: ms.map(r => r.id) },
                },
                transaction,
            });
            member = await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
                members,
                { transaction }
            );

            await this.ctx.model.LessonOrganizationActivateCode.update(
                {
                    activateTime: new Date(),
                    activateUserId: userId,
                    state: 1,
                    username,
                    realname,
                },
                { where: { key }, transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }

        // 更新用户vip和t信息
        await this.ctx.service.lessonOrganizationClassMember.updateUserVipAndTLevel(
            userId
        );
        return member;
    }

    /**
     * 学生续费
     * @param {*} params {key, realname}
     * @param {*} authParams {userId, username,organizationId}
     */
    async studentRecharge(params, authParams) {
        const { userId, username, organizationId } = authParams;
        const { key, realname } = params;
        const currTime = new Date();
        const [ members, activeCode ] = await Promise.all([
            // 检查这学生是不是在这个机构学生
            this.ctx.model.LessonOrganizationClassMember.findAll({
                where: {
                    roleId: { $in: [ '1', '3', '65', '67' ] },
                    memberId: userId,
                    organizationId,
                    endTime: { $gt: currTime },
                },
            }),
            this.ctx.model.LessonOrganizationActivateCode.findOne({
                where: { key },
            }),
        ]);

        if (!members || !members.length) {
            this.ctx.throw(400, Err.MEMBER_NOT_EXISTS);
        }
        if (!activeCode || activeCode.state !== 0) {
            this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);
        }
        if (activeCode.organizationId !== organizationId) {
            this.ctx.throw(400, Err.ACTIVATE_CODE_NOT_MATCH_ORGAN);
        }
        if (activeCode.type < FIVE) {
            this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);
        }

        // 检查机构
        const org = await this.ctx.model.LessonOrganization.findOne({
            where: { id: activeCode.organizationId },
        });
        if (!org || new Date(org.endDate) > currTime) {
            this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);
        }

        const newMembers = [];
        if (activeCode.classIds.length) {
            const classes = await this.ctx.model.LessonOrganizationClass.findAll(
                {
                    where: {
                        id: { $in: activeCode.classIds },
                        status: 1,
                    },
                }
            );
            if (classes.length !== activeCode.classIds.length) {
                this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);
            }

            for (let i = 0; i < activeCode.classIds.length; i++) {
                const obj = {
                    organizationId,
                    classId: activeCode.classIds[i],
                    memberId: userId,
                    type: activeCode.type >= FIVE ? TWO : 1,
                    endTime: endTimeMap[activeCode.type](members[0].endTime),
                    realname,
                    parentPhoneNum: members[0].parentPhoneNum,
                };

                obj.roleId =
                    1 |
                    (
                        _.find(
                            members,
                            m =>
                                m.classId === activeCode.classIds[i] &&
                                m.memberId === userId
                        ) || { roleId: 0 }
                    ).roleId;
                newMembers.push(obj);
            }
        } else {
            const obj = {
                organizationId,
                classId: 0,
                memberId: userId,
                type: activeCode.type >= FIVE ? TWO : 1,
                endTime: endTimeMap[activeCode.type](members[0].endTime),
                realname,
                parentPhoneNum: members[0].parentPhoneNum,
            };
            newMembers.push(obj);
        }

        // 事务操作
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            await this.ctx.model.LessonOrganizationClassMember.destroy({
                where: {
                    id: { $in: members.map(r => r.id) },
                },
                transaction,
            });
            await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
                newMembers,
                { transaction }
            );

            await this.ctx.model.LessonOrganizationActivateCode.update(
                {
                    activateTime: new Date(),
                    activateUserId: userId,
                    state: 1,
                    username,
                    realname,
                },
                { where: { key }, transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }
    }

    // 激活码使用情况
    async getUsedStatus(organizationId) {
        const org = await this.ctx.service.lessonOrganization.getByCondition({
            id: organizationId,
        });
        const { type5 = 0, type6 = 0, type7 = 0 } = org.activateCodeLimit || {};
        const list = await this.ctx.model.LessonOrganizationActivateCode.getCountByTypeAndState(
            organizationId
        );
        const retObj = {
            remainder: {
                // 可生成数量
                type5: 0,
                type6: 0,
                type7: 0,
            },
            used: {
                // 已使用数量
                type1: 0,
                type2: 0,
                type5: 0,
                type6: 0,
                type7: 0,
            },
        };

        const five = 5;
        const six = 6;
        const seven = 7;
        let [ type5Count, type6Count, type7Count ] = [ 0, 0, 0 ];
        for (let i = 0; i < list.length; i++) {
            if (list[i].state === 1 && list[i].type) {
                // 已使用
                retObj.used[`type${list[i].type}`] = list[i].count;
            }
            if (list[i].type === five) type5Count += list[i].count;
            if (list[i].type === six) type6Count += list[i].count;
            if (list[i].type === seven) type7Count += list[i].count;
        }

        retObj.remainder.type5 = type5 - type5Count;
        retObj.remainder.type6 = type6 - type6Count;
        retObj.remainder.type7 = type7 - type7Count;

        return retObj;
    }

    // 激活码设为无效
    async setInvalid(ids) {
        return await this.ctx.model.LessonOrganizationActivateCode.update(
            { state: 2 },
            {
                where: { id: { $in: ids } },
            }
        );
    }
}

module.exports = LessonOrgActivateCodeService;
