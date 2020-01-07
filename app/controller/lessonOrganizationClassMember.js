'use strict';

const Controller = require('./baseController.js');
const { CLASS_MEMBER_ROLE_ADMIN } = require('../common/consts');
const Err = require('../common/err');

const LessonOrganizationClassMember = class extends Controller {
    get modelName() {
        return 'LessonOrganizationClassMember';
    }

    get validateRules() {
        return this.app.validator.lessonOrganizationClassMember;
    }

    // 获取教师列表
    async teacher() {
        const { ctx } = this;
        const { organizationId } = this.authenticated();
        const { classId } = this.validate({ classId: 'number_optional' });

        const datas = await this.ctx.service.lessonOrganizationClassMember.getTeachers(
            organizationId,
            classId
        );
        return ctx.helper.success({ ctx, status: 200, res: datas });
    }

    // 获取学生列表
    async student() {
        const { ctx } = this;
        const { organizationId } = this.authenticated();

        const { classId, type, username } = this.validate({
            classId: 'number_optional',
        });

        const data = await this.ctx.service.lessonOrganizationClassMember.getStudents(
            organizationId,
            classId,
            type,
            username
        );

        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    async bulkCreate() {
        return this.success();
    }

    async create() {
        const {
            organizationId,
            roleId,
            userId,
            username,
        } = this.authenticated();
        const params = this.validate();

        const members = await this.ctx.service.lessonOrganizationClassMember.createMember(
            params,
            { organizationId, roleId, userId, username }
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: members,
        });
    }

    async destroy() {
        const {
            organizationId,
            roleId,
            userId,
            username,
        } = this.authenticated();
        const { id } = this.validate({ id: 'number' });
        const params = this.validate();

        await this.ctx.service.lessonOrganizationClassMember.destroyMember(
            params,
            { organizationId, roleId, userId, username },
            id
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: 'OK',
        });
    }

    // 试听转正式
    async toFormal() {
        const {
            roleId,
            organizationId,
            userId,
            username,
        } = this.authenticated();

        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { userIds, type, classIds } = this.validate();
        await this.ctx.service.lessonOrganizationClassMember.toFormal(
            userIds,
            type,
            classIds,
            { organizationId, userId, username }
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
        });
    }

    // 续费
    async recharge() {
        const {
            roleId,
            organizationId,
            userId,
            username,
        } = this.authenticated();
        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { userIds, type, classIds } = this.validate();
        await this.ctx.service.lessonOrganizationClassMember.recharge(
            userIds,
            type,
            classIds,
            { organizationId, userId, username }
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
        });
    }

    // 历史学生
    async historyStudents() {
        const { organizationId } = this.authenticated();

        const { classId, type, username } = this.validate();

        const ret = await this.ctx.service.lessonOrganizationClassMember.historyStudents(
            {
                classId,
                type,
                username,
                organizationId,
                queryOptions: this.queryOptions,
            }
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: ret,
        });
    }

    // 重新激活用户
    async reactivate() {
        const {
            organizationId,
            roleId,
            userId,
            username,
        } = this.authenticated();
        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { userIds, type, classIds } = this.validate();

        await this.ctx.service.lessonOrganizationClassMember.reactivate(
            userIds,
            type,
            classIds,
            { organizationId, userId, username }
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
        });
    }

    // 从机构中删除某个用户的某个身份
    async clearRoleFromOrg() {
        const { roleId, organizationId } = this.authenticated();

        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { memberId, _roleId } = this.validate();

        await this.ctx.service.lessonOrganizationClassMember.clearRoleFromOrg(
            memberId,
            _roleId,
            organizationId
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
        });
    }

    // 从班级中删除某个用户的某个身份,但不丢失在机构中的身份
    async clearRoleFromClass() {
        const ctx = this.ctx;
        const { roleId, organizationId } = this.authenticated();
        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { memberId, _roleId, classId } = this.getParams();

        await ctx.validate(this.validateRules.clearRoleFromClass, {
            memberId,
            _roleId,
            classId,
        });

        await ctx.service.lessonOrganizationClassMember.clearRoleFromClass(
            memberId,
            _roleId,
            classId,
            organizationId
        );

        return ctx.helper.success({
            ctx,
            status: 200,
        });
    }
};

module.exports = LessonOrganizationClassMember;
