'use strict';

const Service = require('../common/service.js');
const _ = require('lodash');

class UserMessage extends Service {
    /**
     * 根据条件更新
     * @param {*} params params
     * @param {*} condition condition
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.UserMessage.update(params, {
            where: condition,
        });
    }

    /**
     * 获取我的消息列表
     * @param {*} queryOptions queryOptions
     * @param {*} userId userId
     * @param {*} organizationId organizationId 机构名称
     */
    async getMyMessages(queryOptions, userId, organizationId) {
        await this.ctx.model.Message.mergeMessage(userId);

        let condition = {};
        if (organizationId) {
            condition = { organizationId };
        }
        const seq = this.app.model.Sequelize;
        const userMsg = await this.ctx.model.UserMessage.findAndCountAll({
            ...queryOptions,
            include: [
                {
                    as: 'messages',
                    attributes: [
                        'id',
                        'sender',
                        'msg',
                        'senderName',
                        'senderPortrait',
                    ],
                    model: this.model.Message,
                    where: condition,
                    include: [
                        {
                            as: 'lessonOrganizations',
                            attributes: [
                                [
                                    seq.literal(
                                        'ifnull(`messages->lessonOrganizations`.`id`, 0)'
                                    ),
                                    'id',
                                ],
                                [
                                    seq.fn('ifnull', seq.col('name'), '系统'),
                                    'name',
                                ],
                            ],
                            model: this.model.LessonOrganization,
                        },
                    ],
                },
            ],
            where: { userId },
        }).then(o => {
            o.rows = o.rows.map(o => o.toJSON());
            return o;
        });

        // 老师的id,要找他们的tLevel
        const senders = _.filter(
            userMsg.rows.map(r => r.messages.sender),
            o => o > 0
        );
        const teachersInfo = await this.ctx.service.keepwork.getAllUserByCondition(
            { id: { $in: senders } }
        );
        userMsg.rows.forEach(r => {
            const index = _.findIndex(
                teachersInfo,
                o => o.id === r.messages.sender
            );
            r.messages.tLevel = index > -1 ? teachersInfo[index].tLevel : 0;
        });

        return userMsg;
    }

    /**
     * 各个机构【包括系统】的未读消息数
     * @param {*} userId userId
     */
    async getUnReadCount(userId) {
        return await this.ctx.model.UserMessage.getUnReadCount(userId);
    }

    //
    async getIndexOfMessage(messageId, organizationId) {
        const seq = this.app.model.Sequelize;
        return await this.ctx.model.Message.count({
            where: {
                organizationId,
                createdAt: {
                    $gt: seq.literal(
                        `(select createdAt from messages where id = ${messageId})`
                    ),
                },
            },
        });
    }
}

module.exports = UserMessage;
