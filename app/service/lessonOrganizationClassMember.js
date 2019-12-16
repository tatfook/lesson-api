'use strict';

const Service = require('../common/service.js');
const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_STUDENT,
    CLASS_MEMBER_ROLE_ADMIN,
    ONE,
    TWO,
    THREE,
    FIVE,
    SIX,
    TEN,
    FIFTEEN,
    NINTYNINE,
} = require('../common/consts.js');
const Err = require('../common/err');
const _ = require('lodash');
const moment = require('moment');
const formalTypes = [ '5', '6', '7' ]; // 正式邀请码类型
const allCodeTypes = [ '1', '2', '5', '6', '7' ]; // 全部邀请码类型

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

class LessonOrgClassMemberService extends Service {
    /**
     * 通过条件获取lessonOrganizationClassMember
     * @param {*} condition  必选,对象
     */
    async getByCondition(condition) {
        let data = await this.ctx.model.LessonOrganizationClassMember.findOne({
            where: condition,
        });
        if (data) data = data.get({ plain: true });

        return data;
    }

    /**
     * 根据条件查找全部的记录
     * @param {*} condition 必选 对象
     */
    async getAllByCondition(condition) {
        const list = await this.ctx.model.LessonOrganizationClassMember.findAll(
            {
                where: condition,
            }
        );
        return list ? list.map(r => r.get()) : [];
    }

    /**
     * 根据条件查找全部的记录，并且带连表查询
     * @param {*} include 关联表
     * @param {*} condition 必选 对象
     */
    async getAllAndExtraByCondition(include, condition) {
        const list = await this.ctx.model.LessonOrganizationClassMember.findAll(
            {
                include,
                where: condition,
            }
        );

        return list ? list.map(r => r.get()) : [];
    }

    /**
     * 根据条件删除机构成员
     * @param {*} condition condition
     */
    async destroyByCondition(condition) {
        return await this.ctx.model.LessonOrganizationClassMember.destroy({
            where: condition,
        });
    }

    /**
     * 根据条件更新
     * @param {*} params 更新的字段
     * @param {*} condition 条件
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.LessonOrganizationClassMember.update(
            params,
            {
                where: condition,
            }
        );
    }

    /**
     *
     * @param {*} params params
     */
    async create(params) {
        const ret = await this.ctx.model.LessonOrganizationClassMember.create(
            params
        );
        return ret ? ret.get() : undefined;
    }

    /**
     * 获取教师列表
     * @param {*} organizationId organizationId
     * @param {*} classId classId
     */
    async getTeachers(organizationId, classId) {
        const members = await this.ctx.service.lessonOrganization.getTeachers(
            organizationId,
            classId
        );
        const memberIds = members.map(o => o.memberId);
        if (memberIds.length === 0) return [];

        const list = await this.model.LessonOrganizationClassMember.findAll({
            include: [
                {
                    as: 'lessonOrganizationClasses',
                    model: this.model.LessonOrganizationClass,
                    where: {
                        status: 1,
                    },
                    required: false,
                },
            ],
            where: {
                organizationId,
                memberId: {
                    [this.model.Op.in]: memberIds,
                },
                classId: classId ? classId : { $gte: 0 },
            },
        }).then(list => list.map(o => o.toJSON()));

        const users = await this.ctx.service.keepwork.getAllUserByCondition({
            id: { $in: memberIds },
        });

        const map = {};
        _.each(list, o => {
            if (!(o.roleId & CLASS_MEMBER_ROLE_TEACHER)) return;
            map[o.memberId] = map[o.memberId] || o;
            map[o.memberId].classes = map[o.memberId].classes || [];

            if (o.lessonOrganizationClasses) {
                map[o.memberId].classes.push(o.lessonOrganizationClasses);
            }

            const index = _.findIndex(users, obj => {
                return obj.id === o.memberId;
            });
            if (index > -1) {
                map[o.memberId].username = users[index].username;
            }
            map[o.memberId].realname = map[o.memberId].realname || o.realname;
            delete o.lessonOrganizationClasses;
        });

        const datas = [];
        _.each(map, o => datas.push(o));

        return datas;
    }

    /**
     * 获取学生列表
     * @param {*} organizationId organizationId
     * @param {*} classId classId
     */
    async getStudents(organizationId, classId) {
        const members = await this.ctx.service.lessonOrganization.getMembers(
            organizationId,
            1,
            classId
        );
        const memberIds = members.map(o => o.memberId);
        if (memberIds.length === 0) return { count: 0, rows: [] };

        const [ list, users ] = await Promise.all([
            this.model.LessonOrganizationClassMember.findAll({
                include: [
                    {
                        as: 'lessonOrganizationClasses',
                        model: this.model.LessonOrganizationClass,
                        where: {
                            status: 1,
                        },
                        required: false,
                    },
                ],
                where: {
                    organizationId,
                    memberId: { $in: memberIds },
                    classId: classId ? classId : { $gt: 0 },
                },
            }),

            this.ctx.service.keepwork.getAllUserByCondition({
                id: { $in: memberIds },
            }),
        ]);

        const map = {};
        const rows = [];
        let count = 0;

        _.each(list, o => {
            o = o.get();
            if (
                !(o.roleId & CLASS_MEMBER_ROLE_STUDENT) ||
                !o.lessonOrganizationClasses
            ) {
                return;
            }
            if (!map[o.memberId]) {
                count++;
                map[o.memberId] = o;
                o.classes = [];

                const index = _.findIndex(users, obj => {
                    return obj.id === o.memberId;
                });
                if (index > -1) {
                    o.users = users[index];
                }
                rows.push(o);
            }
            map[o.memberId].realname = map[o.memberId].realname || o.realname;
            if (o.lessonOrganizationClasses) {
                map[o.memberId].classes.push(o.lessonOrganizationClasses);
            }
            delete o.lessonOrganizationClasses;
        });
        _.each(rows, o => {
            o.lessonOrganizationClasses = o.classes;
        });

        return { count, rows };
    }

    /**
     * 这个接口逻辑复杂又乱。。。先放这儿
     * @param {*} params params
     * @param {*} authParams authParams
     */
    async createMember(params, authParams) {
        let { organizationId, roleId, userId, username } = authParams;

        if (params.organizationId && params.organizationId !== organizationId) {
            organizationId = params.organizationId;
            roleId = await this.ctx.service.organization.getRoleId(
                organizationId,
                userId
            );
        }

        params.organizationId = organizationId;
        params.roleId = params.roleId || CLASS_MEMBER_ROLE_STUDENT;
        const classIds = _.uniq(params.classIds || []);

        if (!params.memberId) {
            if (!params.memberName) return this.ctx.throw(400, Err.ARGS_ERR);

            const users = await this.ctx.service.keepwork.getAllUserByCondition(
                {
                    username: params.memberName,
                }
            );
            if (!users || !users.length) {
                return this.ctx.throw(400, Err.USER_NOT_EXISTS);
            }

            params.memberId = users[0].id;
        }

        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            if (roleId <= CLASS_MEMBER_ROLE_STUDENT) {
                return this.ctx.throw(403, Err.AUTH_ERR);
            }

            const organ = await this.ctx.service.lessonOrganization.getByCondition(
                {
                    id: organizationId,
                }
            );
            if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

            if (organ.privilege && 1 === 0) {
                return this.ctx.throw(403, Err.AUTH_ERR);
            }
        }

        let oldmembers = await this.ctx.model.LessonOrganizationClassMember.findAll(
            {
                order: [[ 'id', 'desc' ]],
                include: [
                    {
                        as: 'lessonOrganizationClasses',
                        model: this.ctx.model.LessonOrganizationClass,
                        required: false,
                    },
                ],
                where: { organizationId, memberId: params.memberId },
            }
        ).then(list => list.map(o => o.toJSON()));

        oldmembers = _.filter(oldmembers, o => {
            if (
                o.roleId === CLASS_MEMBER_ROLE_STUDENT &&
                o.lessonOrganizationClasses &&
                o.lessonOrganizationClasses.status === 1
            ) {
                return false;
            }
            return true;
        });

        const ids = _.map(oldmembers, o => o.id);

        if (~~params.roleId & CLASS_MEMBER_ROLE_STUDENT) {
            const oldClassIds = _.filter(
                oldmembers,
                o => o.roleId & CLASS_MEMBER_ROLE_STUDENT
            ).map(r => r.classId);
            const delClassIds = _.difference(oldClassIds, classIds);
            // 这个人在这些班级的学生身份被删除，这里检查是否要更新评估报告的统计数据
            if (delClassIds.length) {
                await this.ctx.service.evaluationReport.checkEvaluationStatus(
                    params.memberId,
                    delClassIds
                );
            }
        }

        // ???
        const organ = await this.ctx.service.lessonOrganization.getByCondition({
            id: organizationId,
        });
        if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

        await this.ctx.service.lessonOrganizationLog.studentLog({
            ...params,
            handleId: userId,
            username,
            classIds,
            oldmembers,
            organizationId,
        });

        // 合并其它身份
        const datas = _.map(classIds, classId => ({
            ...params,
            classId,
            roleId:
                params.roleId |
                (
                    _.find(oldmembers, m => m.classId === ~~classId) || {
                        roleId: 0,
                    }
                ).roleId,
        }));

        // 删除要创建的
        if (classIds.length) {
            await this.destroyByCondition({
                organizationId,
                memberId: params.memberId,
                classId: { $in: classIds },
            });
        }
        // 取消全部班级此身份
        if (ids.length) {
            await this.model.query(
                `
			update lessonOrganizationClassMembers 
			set roleId = roleId & ~${params.roleId} 
			where id in (:ids)
			`,
                {
                    type: this.model.QueryTypes.UPDATE,
                    replacements: { ids },
                }
            );
        }
        // 删除roleId=0为0的成员
        await this.destroyByCondition({
            organizationId,
            memberId: params.memberId,
            roleId: 0,
        });

        if (datas.length === 0) {
            await this.updateUserVipAndTLevel(params.memberId);
            return [];
        }

        const members = await this.model.LessonOrganizationClassMember.bulkCreate(
            datas
        );

        if (params.realname) {
            await this.model.LessonOrganizationClassMember.update(
                {
                    realname: params.realname,
                },
                { where: { id: { $in: ids } } }
            );
        }

        // 此处update已和前端沟通过了，不修改parentPhoneNum则传旧值，修改则传新值，清空则传空串
        await this.model.LessonOrganizationClassMember.update(
            {
                parentPhoneNum: params.parentPhoneNum,
            },
            {
                where: {
                    memberId: params.memberId,
                    organizationId,
                },
            }
        );

        if (params.realname && classIds.length) {
            await this.ctx.service.lessonOrganizationActivateCode.updateByCondition(
                { realname: params.realname },
                {
                    organizationId,
                    activateUserId: params.memberId,
                    state: 1,
                    classId: { $in: classIds },
                }
            );
        }
        // 更新用户vip和t信息
        await this.updateUserVipAndTLevel(params.memberId);
        return members;
    }

    /**
     * 删除成员
     * @param {*} params params
     * @param {*} authParams authParams
     * @param {*} id memberId
     */
    async destroyMember(params, authParams, id) {
        const { organizationId, roleId, userId, username } = authParams;

        const member = await this.getByCondition({ organizationId, id });
        if (!member) return;

        if (member.roleId >= roleId) return this.ctx.throw(411, Err.AUTH_ERR);

        if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
            if (roleId <= CLASS_MEMBER_ROLE_STUDENT) {
                return this.throw(403, Err.AUTH_ERR);
            }

            const organ = await this.ctx.service.lessonOrganization.getByCondition(
                {
                    id: organizationId,
                }
            );
            if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

            if (organ.privilege & (CLASS_MEMBER_ROLE_TEACHER === 0)) {
                return this.throw(403, Err.AUTH_ERR);
            }
        }

        // 这个人在班级的学生身份被删除，这里检查是否要更新评估报告的统计数据
        if (~~params.roleId & CLASS_MEMBER_ROLE_STUDENT) {
            await this.ctx.service.evaluationReport.checkEvaluationStatus(
                member.memberId,
                [ member.classId ]
            );
        }

        if (!params.roleId || params.roleId === member.roleId) {
            await this.destroyByCondition({ id });
        } else {
            await this.updateByCondition(
                { roleId: member.roleId & ~params.roleId },
                { id }
            );
        }

        const memberRoleId = params.roleId ? params.roleId : member.roleId;
        await this.ctx.service.lessonOrganizationLog.studentLog({
            organizationId,
            handleId: userId,
            username,
            oldmembers: [ member ],
            classIds: [ -1 ],
            roleId:
                memberRoleId & CLASS_MEMBER_ROLE_TEACHER
                    ? CLASS_MEMBER_ROLE_TEACHER
                    : CLASS_MEMBER_ROLE_STUDENT,
        });
        // 更新用户vip和t信息
        await this.updateUserVipAndTLevel(member.memberId);
    }

    /**
     *
     * @param {*} members members
     */
    async bulkCreateMembers(members) {
        return await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
            members
        );
    }

    async updateUserVipAndTLevel(userId) {
        if (!userId) {
            return;
        }
        // 查出此用户所有的LessonOrganizationClassMember
        const members = await this.ctx.model.LessonOrganizationClassMember.findAll(
            {
                where: {
                    memberId: userId,
                },
            }
        );
        let isVip = 0;
        let tLevel = 0;
        members.forEach(member => {
            // 是学生那么就是vip
            if (!isVip && member.roleId & CLASS_MEMBER_ROLE_STUDENT) {
                isVip = 1;
            }
            // 是机构老师或者管理员则就是tLevel
            if (
                !tLevel &&
                (member.roleId & CLASS_MEMBER_ROLE_TEACHER ||
                    member.roleId & CLASS_MEMBER_ROLE_ADMIN)
            ) {
                tLevel = 1;
            }
        });
        const updateParam = {
            vip: isVip,
            tLevel,
        };
        if (!tLevel) {
            delete updateParam.tLevel;
        }
        await this.ctx.service.keepwork.updateUser(userId, updateParam);
    }

    // 试听转正式
    async toFormal(
        userIds,
        type,
        classIds,
        { organizationId, userId, username }
    ) {
        if (!formalTypes.includes(type + '')) {
            this.ctx.throw(400, Err.STU_TYPE_ERR);
        }
        const [ members, classes, org, historyCount ] = await Promise.all([
            // 检查这些学生是不是在这个机构试听
            this.ctx.model.LessonOrganizationClassMember.findAll({
                where: {
                    roleId: { $in: [ '1', '3', '65', '67' ] },
                    memberId: { $in: userIds },
                    organizationId,
                    type: 1,
                },
            }),
            // 检查班级
            this.ctx.model.LessonOrganizationClass.findAll({
                where: {
                    id: { $in: classIds },
                    organizationId,
                    status: 1,
                },
            }),
            // 获取机构
            this.ctx.service.lessonOrganization.getByCondition({
                id: organizationId,
                endDate: { $gte: new Date() },
            }),
            // 已经用了多少这个类型的激活码
            this.ctx.service.lessonOrganizationActivateCode.getCountByCondition(
                {
                    organizationId,
                    type,
                    state: {
                        $in: [ '0', '1' ],
                    },
                }
            ),
        ]);
        if (members.length < userIds.length) {
            this.ctx.throw(400, Err.MEMBER_NOT_EXISTS);
        }
        if (classes.length !== classIds.length) {
            this.ctx.throw(400, Err.CLASSID_ERR);
        }

        // 激活码上限检查
        const { type5 = 0, type6 = 0, type7 = 0 } = org.activateCodeLimit;
        const map = {
            5: type5,
            6: type6,
            7: type7,
        };
        if (historyCount + userIds.length > map[type]) {
            this.ctx.throw(403, Err.ACTIVATE_CODE_UPPERLIMITED);
        }

        // 激活码数据,状态是已激活
        const datas = [];
        const currTime = new Date();
        for (let i = 0; i < userIds.length; i++) {
            datas.push({
                organizationId,
                classIds,
                type,
                state: 1,
                activateUserId: userIds[i],
                activateTime: currTime,
                key: `${
                    classIds ? classIds.reduce((p, c) => p + c, '') : ''
                }${i}${currTime.getTime()}${_.random(TEN, NINTYNINE)}`,
                name: '',
            });
        }

        // 事务操作
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            // 创建激活码
            await this.ctx.model.LessonOrganizationActivateCode.bulkCreate(
                datas,
                { transaction }
            );

            // 创建成员
            const objs = [];
            for (let i = 0; i < userIds.length; i++) {
                const index = _.findIndex(
                    members,
                    o => o.memberId === userIds[i]
                );
                let realname;
                let parentPhoneNum;
                if (index > -1) {
                    realname = members[index].realname;
                    parentPhoneNum = members[index].parentPhoneNum;
                }
                if (classIds.length) {
                    for (let j = 0; j < classIds.length; j++) {
                        const obj = {
                            organizationId,
                            classId: classIds[j],
                            memberId: userIds[i],
                            type: 2,
                            endTime: endTimeMap[type](),
                            realname,
                            parentPhoneNum,
                        };
                        // 这儿给他合并一下身份，以免丢失teacher或admin身份
                        obj.roleId =
                            1 |
                            (
                                _.find(
                                    members,
                                    m =>
                                        m.classId === classIds[j] &&
                                        m.memberId === userIds[i]
                                ) || { roleId: 0 }
                            ).roleId;

                        objs.push(obj);
                    }
                } else {
                    const obj = {
                        organizationId,
                        classId: 0,
                        memberId: userIds[i],
                        type: 2,
                        endTime: endTimeMap[type](),
                        realname,
                        parentPhoneNum,
                    };
                    obj.roleId =
                        1 |
                        (
                            _.find(members, m => m.memberId === userIds[i]) || {
                                roleId: 0,
                            }
                        ).roleId;
                    objs.push(obj);
                }
            }

            // 把之前的试用身份都删了，然后再创建
            await this.ctx.model.LessonOrganizationClassMember.destroy({
                where: {
                    id: { $in: members.map(r => r.id) },
                },
                transaction,
            });
            await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
                objs,
                { transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }

        await this.activateCodeLog(
            classes,
            organizationId,
            userIds,
            userId,
            username
        );
    }

    // 续费
    async recharge(
        userIds,
        type,
        classIds,
        { organizationId, userId, username }
    ) {
        if (!formalTypes.includes(type + '')) {
            this.ctx.throw(400, Err.STU_TYPE_ERR);
        }
        const currTime = new Date();
        const [ members, classes, org, historyCount ] = await Promise.all([
            // 检查这些学生是不是在这个机构正式学生
            this.ctx.model.LessonOrganizationClassMember.findAll({
                where: {
                    roleId: { $in: [ '1', '3', '65', '67' ] },
                    memberId: { $in: userIds },
                    organizationId,
                    type: 2,
                    endTime: { $gt: currTime },
                },
            }),
            // 检查班级
            this.ctx.model.LessonOrganizationClass.findAll({
                where: {
                    id: { $in: classIds },
                    organizationId,
                    status: 1,
                },
            }),
            // 获取机构
            this.ctx.service.lessonOrganization.getByCondition({
                id: organizationId,
                endDate: { $gte: currTime },
            }),
            // 已经用了多少这个类型的激活码
            this.ctx.service.lessonOrganizationActivateCode.getCountByCondition(
                {
                    organizationId,
                    type,
                    state: {
                        $in: [ '0', '1' ],
                    },
                }
            ),
        ]);
        if (members.length < userIds.length) {
            this.ctx.throw(400, Err.MEMBER_NOT_EXISTS);
        }
        if (classes.length !== classIds.length) {
            this.ctx.throw(400, Err.CLASSID_ERR);
        }

        // 激活码上限检查
        const { type5 = 0, type6 = 0, type7 = 0 } = org.activateCodeLimit;
        const map = {
            5: type5,
            6: type6,
            7: type7,
        };
        if (historyCount + userIds.length > map[type]) {
            this.ctx.throw(403, Err.ACTIVATE_CODE_UPPERLIMITED);
        }

        // 激活码数据,状态是已激活
        const datas = [];
        for (let i = 0; i < userIds.length; i++) {
            datas.push({
                organizationId,
                classIds,
                type,
                state: 1,
                activateUserId: userIds[i],
                activateTime: currTime,
                key: `${
                    classIds ? classIds.reduce((p, c) => p + c, '') : ''
                }${i}${currTime.getTime()}${_.random(TEN, NINTYNINE)}`,
                name: '',
            });
        }

        // 事务操作
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            // 创建激活码
            await this.ctx.model.LessonOrganizationActivateCode.bulkCreate(
                datas,
                { transaction }
            );

            // 创建成员
            const objs = [];
            for (let i = 0; i < userIds.length; i++) {
                const index = _.findIndex(
                    members,
                    o => o.memberId === userIds[i]
                );
                let realname;
                let parentPhoneNum;
                let oldEndTime;
                if (index > -1) {
                    realname = members[index].realname;
                    parentPhoneNum = members[index].parentPhoneNum;
                    oldEndTime = members[index].endTime;
                }
                if (classIds.length) {
                    for (let j = 0; j < classIds.length; j++) {
                        const obj = {
                            organizationId,
                            classId: classIds[j],
                            memberId: userIds[i],
                            type: 2,
                            endTime: endTimeMap[type](oldEndTime),
                            realname,
                            parentPhoneNum,
                        };
                        // 这儿给他合并一下身份，以免丢失teacher或admin身份
                        obj.roleId =
                            1 |
                            (
                                _.find(
                                    members,
                                    m =>
                                        m.classId === classIds[j] &&
                                        m.memberId === userIds[i]
                                ) || { roleId: 0 }
                            ).roleId;

                        objs.push(obj);
                    }
                } else {
                    const obj = {
                        organizationId,
                        classId: 0,
                        memberId: userIds[i],
                        type: 2,
                        endTime: endTimeMap[type](oldEndTime),
                        realname,
                        parentPhoneNum,
                    };
                    obj.roleId =
                        1 |
                        (
                            _.find(members, m => m.memberId === userIds[i]) || {
                                roleId: 0,
                            }
                        ).roleId;
                    objs.push(obj);
                }
            }

            // 把之前的都删了，然后再创建
            await this.ctx.model.LessonOrganizationClassMember.destroy({
                where: {
                    id: { $in: members.map(r => r.id) },
                },
                transaction,
            });
            await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
                objs,
                { transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }

        await this.activateCodeLog(
            classes,
            organizationId,
            userIds,
            userId,
            username
        );
    }

    // 重新激活学生
    async reactivate(
        userIds,
        type,
        classIds,
        { organizationId, userId, username }
    ) {
        if (!allCodeTypes.includes(type + '')) {
            this.ctx.throw(400, Err.STU_TYPE_ERR);
        }

        const currTime = new Date();
        const [ members, classes, org, historyCount ] = await Promise.all([
            // 检查这些学生是不是过期了
            this.ctx.model.LessonOrganizationClassMember.findAll({
                where: {
                    roleId: { $in: [ '1', '3', '65', '67' ] },
                    memberId: { $in: userIds },
                    organizationId,
                    endTime: { $lt: currTime },
                },
            }),
            // 检查班级
            this.ctx.model.LessonOrganizationClass.findAll({
                where: {
                    id: { $in: classIds },
                    organizationId,
                    status: 1,
                },
            }),
            // 获取机构
            this.ctx.service.lessonOrganization.getByCondition({
                id: organizationId,
                endDate: { $gte: currTime },
            }),
            // 已经用了多少这个类型的激活码
            this.ctx.service.lessonOrganizationActivateCode.getCountByCondition(
                {
                    organizationId,
                    type,
                    state: {
                        $in: [ '0', '1' ],
                    },
                }
            ),
        ]);
        if (members.length < userIds.length) {
            this.ctx.throw(400, Err.MEMBER_NOT_EXISTS);
        }
        if (classes.length !== classIds.length) {
            this.ctx.throw(400, Err.CLASSID_ERR);
        }

        // 激活码上限检查
        const { type5 = 0, type6 = 0, type7 = 0 } = org.activateCodeLimit;
        const map = {
            5: type5,
            6: type6,
            7: type7,
        };
        if (map[type] && historyCount + userIds.length > map[type]) {
            this.ctx.throw(403, Err.ACTIVATE_CODE_UPPERLIMITED);
        }

        // 激活码数据,状态是已激活
        const datas = [];
        for (let i = 0; i < userIds.length; i++) {
            datas.push({
                organizationId,
                classIds,
                type,
                state: 1,
                activateUserId: userIds[i],
                activateTime: currTime,
                key: `${
                    classIds ? classIds.reduce((p, c) => p + c, '') : ''
                }${i}${currTime.getTime()}${_.random(TEN, NINTYNINE)}`,
                name: '',
            });
        }

        // 事务操作
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            // 创建激活码
            await this.ctx.model.LessonOrganizationActivateCode.bulkCreate(
                datas,
                { transaction }
            );

            // 创建成员
            const objs = [];
            for (let i = 0; i < userIds.length; i++) {
                const index = _.findIndex(
                    members,
                    o => o.memberId === userIds[i]
                );
                let realname;
                let parentPhoneNum;
                if (index > -1) {
                    realname = members[index].realname;
                    parentPhoneNum = members[index].parentPhoneNum;
                }
                if (classIds.length) {
                    for (let j = 0; j < classIds.length; j++) {
                        const obj = {
                            organizationId,
                            classId: classIds[j],
                            memberId: userIds[i],
                            type: type >= FIVE ? TWO : 1,
                            endTime: endTimeMap[type](),
                            realname,
                            parentPhoneNum,
                        };
                        // 这儿给他合并一下身份，以免丢失teacher或admin身份
                        obj.roleId =
                            1 |
                            (
                                _.find(
                                    members,
                                    m =>
                                        m.classId === classIds[j] &&
                                        m.memberId === userIds[i]
                                ) || { roleId: 0 }
                            ).roleId;

                        objs.push(obj);
                    }
                } else {
                    const obj = {
                        organizationId,
                        classId: 0,
                        memberId: userIds[i],
                        type: type >= FIVE ? TWO : 1,
                        endTime: endTimeMap[type](),
                        realname,
                        parentPhoneNum,
                    };
                    obj.roleId =
                        1 |
                        (
                            _.find(members, m => m.memberId === userIds[i]) || {
                                roleId: 0,
                            }
                        ).roleId;
                    objs.push(obj);
                }
            }
            // 把之前的都删了，然后再创建
            await this.ctx.model.LessonOrganizationClassMember.destroy({
                where: {
                    id: { $in: members.map(r => r.id) },
                },
                transaction,
            });
            await this.ctx.model.LessonOrganizationClassMember.bulkCreate(
                objs,
                { transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }

        await this.activateCodeLog(
            classes,
            organizationId,
            userIds,
            userId,
            username
        );
    }

    // 激活码log
    async activateCodeLog(classes, organizationId, userIds, userId, username) {
        const name = classes.reduce((p, c) => `${p},${c.name}`, '') || '';
        await this.ctx.service.lessonOrganizationLog.classLog({
            organizationId,
            cls: { name: name.slice(1) },
            action: 'activateCode',
            count: userIds.length,
            handleId: userId,
            username,
        });
    }

    // 历史学生
    async historyStudents(classId, type, username, organizationId) {
        const ret = await this.ctx.model.LessonOrganizationClassMember.historyStudents(
            classId,
            type,
            username,
            organizationId
        );
        return { count: ret[1][0].count, rows: ret[0] };
    }
}

module.exports = LessonOrgClassMemberService;
