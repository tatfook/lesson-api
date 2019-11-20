'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');
const {
    createMsg,
} = require('../common/validatorRules/message');

const Message = class extends Controller {
    // 机构发送消息
    async create() {
        const ctx = this.ctx;
        const { userId, roleId, organizationId, username } = this.authenticated();

        const { sendSms, msg, classIds = [], userIds = [] } = this.validate();

        this.validateCgi({ sendSms }, createMsg);

        await ctx.service.message.createMsg({ sendSms, msg, classIds, userIds },
            { userId, roleId, organizationId, username });

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    // 我发送的消息 || 机构所有管理员发送的消息
    async index() {

    }
};

module.exports = Message;
