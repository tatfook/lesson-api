'use strict';

const _ = require('lodash');
const Controller = require('./baseController.js');
const {
    CLASS_MEMBER_FULL_ROLE,
    CLASS_MEMBER_ROLE_ADMIN,
    CLASS_MEMBER_ROLE_TEACHER,
} = require('../common/consts.js');
const Err = require('../common/err');

const LessonOrganization = class extends Controller {
    get modelName() {
        return 'LessonOrganization';
    }

    async token() {
        const { ctx } = this;
        const { userId, username } = this.authenticated();
        const { organizationId } = this.validate({ organizationId: 'number' });

        const [ members, org ] = await Promise.all([
            ctx.service.lessonOrganizationClassMember.getAllByCondition({
                organizationId,
                memberId: userId,
            }),
            ctx.service.lessonOrganization.getByCondition({
                id: organizationId,
            }),
        ]);
        if (!members.length) return ctx.throw(400, Err.MEMBER_NOT_EXISTS);

        // 合并这个人在这个机构中的全部角色,并且生成一个token
        const {
            token,
        } = await ctx.service.lessonOrganization.mergeRoleIdAndGenToken(
            {
                members,
                userId,
                username,
                organizationId,
                loginUrl: org.loginUrl,
            },
            this.app.config.self
        );

        await ctx.service.user.setToken(userId, token);

        return ctx.helper.success({ ctx, status: 200, res: token });
    }

    async login() {
        const { ctx } = this;
        let {
            username,
            password,
            organizationId,
            organizationName,
        } = this.validate({ username: 'string', password: 'string' });

        username = username.trim();
        password = password.trim();

        const users = await ctx.service.keepwork.getAllUserByCondition({
            $or: [
                {
                    username,
                },
                {
                    cellphone: username,
                },
                {
                    email: username,
                },
            ],
            password: ctx.helper.md5(password),
        });

        if (!users || !users.length) {
            return ctx.throw(400, Err.USERNAME_OR_PWD_ERR);
        }
        const user = users[0];

        // 找到机构
        const organ = await ctx.service.lessonOrganization.getByCondition({
            $or: [
                {
                    name: organizationName,
                },
                {
                    id: organizationId,
                },
            ],
        });
        if (!organ) ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);
        if (organizationId && organ.id !== ~~organizationId) {
            ctx.throw(400, Err.ARGS_ERR);
        }
        if (!organizationId) organizationId = organ.id;

        // 找到这个人在机构中的members
        let members = await ctx.service.lessonOrganizationClassMember.getAllAndExtraByCondition(
            [
                {
                    as: 'lessonOrganizationClasses',
                    model: this.model.LessonOrganizationClass,
                    where: {
                        status: 1,
                    },
                    required: false,
                },
            ],
            { organizationId, memberId: user.id }
        );
        members = _.filter(
            members,
            o => o.classId === 0 || o.lessonOrganizationClasses
        );

        if (!members.length) return ctx.throw(400, Err.MEMBER_NOT_EXISTS);

        // 合并这个人在这个机构中的全部角色,并且生成一个token
        const {
            token,
            roleId,
        } = await ctx.service.lessonOrganization.mergeRoleIdAndGenToken(
            {
                members,
                userId: user.id,
                username: user.username,
                organizationId,
                loginUrl: organ.loginUrl,
            },
            this.app.config.self
        );

        user.token = token;
        user.roleId = roleId;
        user.organizationId = organizationId;
        delete user.password;

        await ctx.service.user.setToken(user.id, token);

        return ctx.helper.success({ ctx, status: 200, res: user });
    }

    async index() {
        const { ctx } = this;
        const { userId } = this.authenticated();
        const list = await ctx.service.lessonOrganization.getUserOrganizations(
            userId
        );
        return ctx.helper.success({ ctx, status: 200, res: list });
    }

    async show() {
        const { ctx } = this;
        const { id } = this.validate({ id: 'number' });

        const organ = await ctx.service.lessonOrganization.getByCondition({
            id,
        });
        if (!organ) return ctx.throw(404, Err.ORGANIZATION_NOT_FOUND);

        return ctx.helper.success({ ctx, status: 200, res: organ });
    }

    async getByUrl() {
        const { ctx } = this;
        const { url } = this.validate({ url: 'string' });

        const organ = await ctx.service.lessonOrganization.getByCondition({
            loginUrl: url,
        });
        if (!organ) return ctx.throw(404, Err.ORGANIZATION_NOT_FOUND);

        return ctx.helper.success({ ctx, status: 200, res: organ });
    }

    async getByName() {
        const { ctx } = this;
        const { name } = this.validate({ name: 'string' });

        const organ = await ctx.service.lessonOrganization.getByCondition({
            name,
        });
        if (!organ) return ctx.throw(404, Err.ORGANIZATION_NOT_FOUND);

        return ctx.helper.success({ ctx, status: 200, res: organ });
    }

    async create() {
        const { ctx } = this;
        this.adminAuthenticated();
        const params = this.validate();

        const organ = await ctx.service.lessonOrganization.createOrganization(
            params
        );

        return ctx.helper.success({ ctx, status: 200, res: organ });
    }

    // 禁止更新
    async update() {
        const { ctx } = this;
        const params = this.validate({ id: 'number' });
        delete params.userId;
        const id = params.id;

        const organ = await ctx.service.lessonOrganization.getByCondition({
            id,
        });
        if (!organ) return ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);
        // 检查正式激活码上限
        const { type5 = 0, type6 = 0, type7 = 0 } = params.activateCodeLimit || {};
        await ctx.service.lessonOrganization.checkActivateCodeLimit(id, {
            type5,
            type6,
            type7,
        });

        if (this.ctx.state.admin && this.ctx.state.admin.userId) {
            await ctx.service.lessonOrganization.updateOrganization(
                params,
                organ
            );
        } else {
            const { userId, roleId = 0, username } = this.authenticated();
            if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
                return ctx.throw(403, Err.AUTH_ERR);
            }

            await ctx.service.lessonOrganization.updateOrganization(
                params,
                organ,
                {
                    userId,
                    roleId,
                    username,
                }
            );
        }

        if (params.packages) {
            await ctx.service.lessonOrganizationPackage.destroyByCondition({
                organizationId: id,
                classId: 0,
            });
            await ctx.service.lessonOrganization.createPackageForOrganization(
                params.packages,
                id
            );
            await ctx.service.lessonOrganization.fixedClassPackage(
                id,
                params.packages
            );
        }

        if (params.usernames) {
            await ctx.service.lessonOrganizationClassMember.destroyByCondition({
                classId: 0,
                organizationId: id,
            });
            await ctx.service.lessonOrganization.createAdminForOrganization(
                params.usernames,
                id
            );
        }

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    // 课程包
    async packages() {
        const { ctx } = this;
        const { userId, organizationId } = this.authenticated();
        const { classId = 0, roleId = CLASS_MEMBER_FULL_ROLE } = this.validate({
            classId: 'number_optional',
            roleId: 'number_optional',
        });

        let list = await ctx.service.lessonOrganizationPackage.findAllEntrance(
            organizationId,
            classId,
            userId,
            roleId
        );

        list = await ctx.service.lessonOrganizationPackage.dealWithPackageList(
            list,
            roleId
        );

        return ctx.helper.success({ ctx, status: 200, res: list });
    }

    // 机构课程包【代替之前的graphQL接口】
    async getPackages() {
        const { ctx } = this;
        const { organizationId } = this.validate({ organizationId: 'number' });

        const data = await this.ctx.service.lessonOrganization.getOrgPackages(
            organizationId
        );
        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    // checkUserInvalid 校验是否在教师列表中&&是否存在这个用户, 不存在这个用户或者已经是机构的老师会返回错误
    async checkUserInvalid() {
        const { username, organizationId } = this.validate({
            username: 'string',
            organizationId: 'number',
        });

        await this.ctx.service.lessonOrganization.checkUserInvalid(
            username,
            organizationId
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: 'OK',
        });
    }

    // 获取该用户在这个机构中的姓名, 一个人在一个机构中的姓名是相同的
    async getRealNameInOrg() {
        const { ctx } = this;
        const { userId, organizationId } = this.authenticated();

        const ret = await this.ctx.service.lessonOrganizationClassMember.getByCondition(
            { memberId: userId, organizationId }
        );
        if (!ret) this.ctx.throw(404, Err.USER_NOT_IN_ORG);

        return ctx.helper.success({ ctx, status: 200, res: ret.realname });
    }

    // 获取机构各角色的人数
    async getMemberCountByRole() {
        const { ctx } = this;
        const { organizationId } = this.validate({ organizationId: 'number' });

        const data = await ctx.service.lessonOrganization.getMemberCountByRoleId(
            organizationId
        );

        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    // 课程包详情页
    async packageDetail() {
        const { ctx } = this;
        const { userId, organizationId } = this.authenticated();
        const { packageId, classId, roleId = 1 } = this.validate({
            packageId: 'number',
            classId: 'number_optional',
            roleId: 'number_optional',
        });

        const pkg = await ctx.service.lessonOrganization.getPackageDetail(
            packageId,
            classId,
            roleId,
            userId,
            organizationId
        );

        return ctx.helper.success({ ctx, status: 200, res: pkg });
    }

    // 获取机构的所有班级，嵌套返回所有成员
    async getClassAndMembers() {
        const { ctx } = this;
        const { organizationId, roleId, userId } = this.authenticated();

        if (
            !(roleId & CLASS_MEMBER_ROLE_ADMIN) &&
            !(roleId & CLASS_MEMBER_ROLE_TEACHER)
        ) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }

        const { _roleId } = this.validate();

        const list = await ctx.service.lessonOrganization.getClassAndMembers(
            organizationId,
            ~~_roleId,
            userId
        );

        return ctx.helper.success({ ctx, status: 200, res: list });
    }

    // 获取学生加入的全部机构
    async getUserOrgInfo() {
        const { ctx } = this;
        const { userId } = this.authenticated();

        const list = await ctx.service.lessonOrganization.getUserOrgInfo(
            userId,
            1
        );

        const retObj = {
            showOrgId: list.length ? list[0].id : null,
            allOrgs: list,
        };

        return ctx.helper.success({ ctx, status: 200, res: retObj });
    }
};

module.exports = LessonOrganization;
