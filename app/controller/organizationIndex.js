'use strict';

const Err = require('../common/err');
const Controller = require('./baseController.js');

const { CLASS_MEMBER_ROLE_TEACHER } = require('../common/consts.js');

const Index = class extends Controller {
    // 更改密码
    async changepwd() {
        const {
            userId,
            organizationId,
            username,
            roleId,
        } = this.authenticated();
        const params = this.validate({
            classId: 'number',
            memberId: 'number',
            password: 'string',
        });

        const ok = await this.ctx.service.lessonOrganizationIndex.changePassword(
            params,
            { userId, organizationId, username, roleId }
        );

        return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: ok });
    }

    // 日志
    async log() {
        const { organizationId, roleId } = this.authenticated();
        if (roleId < CLASS_MEMBER_ROLE_TEACHER) {
            return this.ctx.throw(400, Err.AUTH_ERR);
        }

        const query = this.validate();
        this.formatQuery(query);

        query.organizationId = organizationId;

        const logs = await this.ctx.service.lessonOrganizationIndex.getLog(
            this.queryOptions,
            query
        );

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: logs,
        });
    }
};

module.exports = Index;
