'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');

const Message = class extends Controller {

    // 获取我的消息列表
    async index() {
        const { userId } = this.authenticated();
        const where = this.validate();
        where.userId = userId;

        const ret = await this.ctx.service.userMessage.getMyMessages(userId, where);
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: ret,
        });
    }

    // 设置本人某些消息【当前页】已读
    async setStatus() {
        const { userId } = this.authenticated();
        const { ids = [] } = this.validate();
        if (ids.length === 0) return this.ctx.throw(400, Err.ARGS_ERR);

        await this.ctx.service.userMessage.updateByCondition({ status: 1 }, { userId, id: { $in: ids } });

        return this.ctx.helper.success({ ctx: this.ctx, status: 200 });
    }

    // 各个机构和系统的未读消息数
    async unReadCount() {
        const { userId } = this.authenticated();
        const list = await this.ctx.service.userMessage.getUnReadCount(userId);
        return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
    }

    // 发送
    async createMSg() {

    }
};

module.exports = Message;
