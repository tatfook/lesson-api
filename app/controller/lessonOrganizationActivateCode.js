'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');

const { CLASS_MEMBER_ROLE_ADMIN } = require('../common/consts.js');

const LessonOrganizationActivateCode = class extends Controller {
    get modelName() {
        return 'LessonOrganizationActivateCode';
    }

    get validateRules() {
        return this.app.validator.lessonOrganizationActivateCode;
    }

    async create() {
        const params = this.validate(); // params:{classIds?,type,count,names?}
        const list = await this.ctx.service.lessonOrganizationActivateCode.createActivateCode(
            params,
            this.authenticated()
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: list,
        });
    }

    async index() {
        let { organizationId, roleId, userId } = this.authenticated();
        const where = this.validate();

        if (where.organizationId && ~~where.organizationId !== organizationId) {
            organizationId = where.organizationId;
            roleId = await this.ctx.service.organization.getRoleId(
                organizationId,
                userId
            );
        }
        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            return this.throw(400, Err.AUTH_ERR);
        }

        this.formatQuery(where);

        where.organizationId = organizationId;

        const data = await this.ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount(
            this.queryOptions,
            where
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: data,
        });
    }

    // 新加参数 parentPhoneNum, verifCode，绑定家长手机号
    async activate() {
        const { userId, username } = this.authenticated();
        const {
            key,
            realname,
            organizationId,
            parentPhoneNum,
            verifCode,
        } = this.validate({ key: 'string', realname: 'string' });

        const data = await this.ctx.service.lessonOrganizationActivateCode.useActivateCode(
            {
                key,
                realname,
                organizationId,
                parentPhoneNum,
                verifCode,
            },
            { userId, username }
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: data,
        });
    }

    // 激活码使用情况
    async getUsedStatus() {
        const { organizationId } = this.authenticated();

        const ret = await this.ctx.service.lessonOrganizationActivateCode.getUsedStatus(
            organizationId
        );
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: ret,
        });
    }

    // 设为无效
    async setInvalid() {
        const { roleId } = this.authenticated();
        const { ids } = this.validate();

        if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }

        await this.ctx.validate(this.validateRules.setInvalid, this.getParams());

        await this.ctx.service.lessonOrganizationActivateCode.setInvalid(ids);
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
        });
    }
};

module.exports = LessonOrganizationActivateCode;
