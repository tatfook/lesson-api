'use strict';

const Service = require('../common/service.js');
const { CLASS_MEMBER_ROLE_ADMIN } = require('../common/consts.js');
const Err = require('../common/err');
const _ = require('lodash');

class LessonOrgClassService extends Service {
    /**
     * 通过条件获取class
     * @param {*} condition 必选,对象
     */
    async getByCondition(condition) {
        let data = await this.ctx.model.LessonOrganizationClass.findOne({
            where: condition,
        });
        if (data) data = data.get({ plain: true });

        return data;
    }

    /**
     * 根据条件更新
     * @param {*} params params
     * @param {*} condition condition
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.LessonOrganizationClass.update(params, {
            where: condition,
        });
    }

    async historyClass(queryOptions, organizationId) {
        const [count, rows] = await Promise.all([
            this.ctx.model.LessonOrganizationClass.count({
                where: { organizationId, status: 2 },
            }),
            this.ctx.model.LessonOrganizationClass.findAll({
                ...queryOptions,
                where: {
                    organizationId,
                    status: 2,
                },
                include: [
                    {
                        as: 'lessonOrganizationClassMembers',
                        model: this.model.LessonOrganizationClassMember,
                    },
                ],
            }),
        ]);

        const userIds = rows
            .map(r => r.lessonOrganizationClassMembers)
            .map(r => r.map(rr => rr.get().memberId))
            .join()
            .split(',');

        const users = await this.ctx.service.keepwork.getAllUserByCondition({
            id: {
                $in: userIds,
            },
        });

        for (let i = 0; i < rows.length; i++) {
            rows[i] = rows[i].get();
            const members = rows[i].lessonOrganizationClassMembers;
            for (let j = 0; j < members.length; j++) {
                members[j] = members[j].get();
                const index = _.findIndex(
                    users,
                    obj => obj.id === members[j].memberId
                );
                if (index > -1) members[j].users = users[index];
            }
        }

        return { count, rows };
    }

    /**
     * 获取当前生效中的加入的班级
     * @param {*} params {userId, organizationId,roleId }
     */
    async findByUserIdRoleIdAndOrganizationId(params) {
        return await this.ctx.model.LessonOrganizationClass.findByUserIdRoleIdAndOrganizationIdSql(
            params
        );
    }

    /**
     * 根据条件查找全部的班级
     * @param {*} condition condition
     * @param {*} include include
     */
    async findAllByCondition(condition, include) {
        const ret = await this.ctx.model.LessonOrganizationClass.findAll({
            include,
            where: condition,
        });
        return ret ? ret.map(r => r.get()) : [];
    }

    /**
     * 创建班级
     * @param {*} params params
     * @param {*} authParams authParams
     */
    async createClass(params, authParams) {
        const { roleId, organizationId, userId, username } = authParams;

        if (!organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
        if (roleId & (CLASS_MEMBER_ROLE_ADMIN === 0)) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }

        params.organizationId = organizationId;
        const packages = params.packages || [];

        const cls = await this.ctx.model.LessonOrganizationClass.create(
            params
        ).then(o => o && o.toJSON());
        if (!cls) return this.ctx.throw(500, Err.DB_ERR);

        const datas = [];
        _.each(packages, pkg => {
            datas.push({
                organizationId,
                classId: cls.id,
                packageId: pkg.packageId,
                lessons: pkg.lessons,
            });
        });

        await this.ctx.service.lessonOrganizationPackage.bulkCreate(datas);

        this.ctx.service.lessonOrganizationLog.classLog({
            organizationId,
            cls,
            params,
            action: 'createClass',
            handleId: userId,
            username,
        });
        return cls;
    }

    /**
     * 更新班级
     * @param {*} params params
     * @param {*} authParams authParams
     */
    async updateClass(params, authParams) {
        const { roleId, organizationId, userId, username } = authParams;
        if (!organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
        if (roleId & (CLASS_MEMBER_ROLE_ADMIN === 0)) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }

        delete params.organizationId;

        const cls = await this.getByCondition({ id: params.id });
        if (!cls) return this.ctx.throw(400, Err.CLASS_NOT_EXISTS);

        // 针对过期班级做检查
        const now = new Date().getTime();
        if (
            new Date(cls.end).getTime() < now &&
            new Date(cls.end).getTime() < new Date(params.end).getTime() &&
            new Date(params.end).getTime() > now
        ) {
            const [organ, studentCount, clsStudentCount] = await Promise.all([
                this.ctx.service.lessonOrganization.getByCondition({
                    id: cls.organizationId,
                }),
                this.ctx.service.lessonOrganization.getStudentCount(
                    cls.organizationId
                ),
                this.ctx.model.LessonOrganization.memberCount(
                    cls.organizationId,
                    1,
                    cls.id
                ),
            ]);

            if (studentCount + clsStudentCount > organ.count) {
                return this.ctx.throw(400, Err.MEMBERS_UPPER_LIMIT);
            }
        }

        await this.model.LessonOrganizationClass.update(params, {
            where: { id: params.id },
        });

        if (params.packages) {
            const datas = [];
            _.each(params.packages, pkg => {
                datas.push({
                    organizationId,
                    classId: params.id,
                    packageId: pkg.packageId,
                    lessons: pkg.lessons,
                });
            });
            await this.ctx.service.lessonOrganizationPackage.destroyByCondition(
                {
                    classId: params.id,
                    organizationId,
                }
            );
            await this.ctx.service.lessonOrganizationPackage.bulkCreate(datas);
        }

        this.ctx.service.lessonOrganizationLog.classLog({
            organizationId,
            cls,
            params,
            action: 'updateClass',
            handleId: userId,
            username,
        });
    }

    /**
     *
     * @param {*} classId classId
     * @param {*} organizationId organizationId
     */
    async destroyClass(classId, organizationId) {
        await Promise.all([
            this.ctx.model.LessonOrganizationClass.destroy({
                where: { id: classId, organizationId },
            }),
            this.ctx.service.lessonOrganizationPackage.destroyByCondition({
                classId,
                organizationId,
            }),
        ]);
    }

    /**
     * 班级最近项目
     * @param {*} classId classId
     * @param {*} organizationId organizationId
     */
    async classLastestProject(classId, organizationId) {
        const TWO = 2;
        const members = await this.ctx.service.lessonOrganizationClassMember.getAllByCondition(
            { organizationId, classId }
        );
        if (members.length === 0) return [];

        const userIds = members.map(o => o.memberId);

        const [projects, users] = await Promise.all([
            this.ctx.service.keepwork.getAllProjectByCondition(
                {
                    userId: { $in: userIds },
                },
                [['updatedAt', 'desc']]
            ),

            this.ctx.service.keepwork.getAllUserByCondition({
                id: { $in: userIds },
            }),
        ]);

        _.each(members, m => {
            m.projects = projects
                .filter(o => o.userId === m.memberId)
                .slice(0, TWO);
            m.users = users.filter(o => o.id === m.memberId);
        });
        return members;
    }

    // 关闭班级
    async closeClass(classId) {
        return await this.ctx.model.LessonOrganizationClass.update(
            {
                status: 2,
            },
            {
                where: { id: classId },
            }
        );
    }
}

module.exports = LessonOrgClassService;
