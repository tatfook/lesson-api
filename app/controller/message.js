'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');
const { createMsg } = require('../common/validatorRules/message');
const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_ADMIN,
} = require('../common/consts');

const Message = class extends Controller {
    // 机构发送消息
    async create() {
        const ctx = this.ctx;
        const {
            userId,
            roleId,
            organizationId,
            username,
        } = this.authenticated();

        const {
            sendSms,
            _roleId,
            msg = {},
            classIds = [],
            userIds = [],
        } = this.validate();

        this.validateCgi(
            { sendSms, type: msg.type, text: msg.text },
            createMsg
        );

        await ctx.service.message.createMsg(
            { sendSms, msg, classIds, userIds },
            { userId, roleId, organizationId, username },
            _roleId
        );

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    // 我发送的消息 || 机构所有管理员发送的消息
    async index() {
        const ctx = this.ctx;
        const { userId, organizationId } = this.authenticated();
        const { roleId } = this.validate();

        if (
            !(CLASS_MEMBER_ROLE_TEACHER & roleId) &&
            !(CLASS_MEMBER_ROLE_ADMIN & roleId)
        ) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }

        const list = await ctx.service.message.getMessages(
            this.queryOptions,
            userId,
            roleId,
            organizationId
        );

        return ctx.helper.success({ ctx, status: 200, res: list });
    }
};

module.exports = Message;
