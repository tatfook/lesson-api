'use strict';

const Controller = require('./baseController.js');

const Message = class extends Controller {

    // 获取我的消息列表
    async index() {
        const { userId } = this.authenticated();
        const where = this.validate();
        where.userId = userId;

        await this.model.messages.mergeMessage(userId);

        const ret = await this.model.userMessages
            .findAndCount({
                ...this.queryOptions,
                include: [
                    {
                        as: 'messages',
                        model: this.model.messages,
                    },
                ],
                where,
            })
            .then(o => {
                o.rows = o.rows.map(o => o.toJSON());
                return o;
            });

        this.success(ret);
    }

    // 设置本人某些消息【当前页】已读
    async setStatus() {
        const { userId } = this.authenticated();
        const { ids = [] } = this.validate();
        if (ids.length === 0) return this.success();

        await this.model.userMessages.update(
            {
                status: 1,
            },
            {
                where: {
                    userId,
                    id: { $in: ids },
                },
            }
        );

        return this.success();
    }

    // 各个机构和系统的未读消息数
    async unReadCount() {
        // const { userId } = this.authenticated();

    }

    // 发送
    async createMSg() {

    }
};

module.exports = Message;
