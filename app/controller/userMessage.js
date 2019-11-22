'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');
const _ = require('lodash');

const UserMessage = class extends Controller {

    // 获取我的消息列表
    async index() {
        const { userId } = this.authenticated();
        const { organizationId } = this.validate();

        const ret = await this.ctx.service.userMessage.getMyMessages(this.queryOptions, userId, organizationId);
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

    // 获取某个消息在列表中的位置(index从0开始)，给前端跳转用的辅助接口
    async getIndexOfMessage() {
        this.authenticated();
        const { id, organizationId } = this.validate();
        if (!_.isNumber(Number(id))) return this.ctx.throw(400, Err.ID_ERR);

        const index = await this.ctx.service.userMessage.getIndexOfMessage(id, organizationId);

        return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: index });
    }
};

module.exports = UserMessage;
