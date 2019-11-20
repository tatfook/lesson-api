'use strict';

const Service = require('../common/service.js');

class UserMessage extends Service {

    /**
     * 根据条件更新
     * @param {*} params params
     * @param {*} condition condition
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.UserMessage.update(params, { where: condition });
    }

    /**
     * 获取我的消息列表
     * @param {*} userId userId
     * @param {*} organizationId organizationId 机构名称
     */
    async getMyMessages(userId, organizationId) {
        await this.ctx.model.Message.mergeMessage(userId);

        return await this.ctx.model.UserMessage
            .findAndCountAll({
                ...this.queryOptions,
                include: [
                    {
                        as: 'messages',
                        model: this.model.Message,
                    },
                ],
                where: { userId, organizationId },
            })
            .then(o => {
                o.rows = o.rows.map(o => o.toJSON());
                return o;
            });
    }

    /**
     * 各个机构【包括系统】的未读消息数
     * @param {*} userId userId
     */
    async getUnReadCount(userId) {
        return await this.ctx.model.UserMessage.getUnReadCount(userId);
    }
}

module.exports = UserMessage;
