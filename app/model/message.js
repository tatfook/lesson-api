'use strict';
const _ = require('lodash');

module.exports = app => {
    const { BIGINT, INTEGER, JSON, STRING, TEXT } = app.Sequelize;

    const model = app.model.define(
        'messages',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            sender: {
                // 0.keepwork,大于0.机构老师的id或者管理员的id
                // 消息发送者
                type: BIGINT,
            },
            roleId: {
                // 发机构消息时候的roleId，0 || 2 || 64
                type: INTEGER,
                defaultValue: 0, // keepwork发的消息为0
            },
            organizationId: {
                // 机构id,
                type: BIGINT,
                defaultValue: 0,
            },
            sendSms: {
                // 是否发送短信，0.不发送，1.发送
                type: INTEGER,
                defaultValue: 0,
            },
            sendClassIds: {
                // 发送的班级id，显示用，不代表全部的成员
                type: JSON,
            },
            type: {
                // 消息类型 0 - 系统消息,1.机构消息
                type: INTEGER,
                defaultValue: 0,
            },

            all: {
                // 0 - 非全部  1 - 全部
                type: INTEGER,
                defaultValue: 0,
            },
            /** - msg.type = 0 文本消息  msg.text为文本值(html文本格式)
                - msg.type = 1 注册消息  msg.user 为新注册的用户信息对象{id:用户Id, username:用户名}
                - msg.type = 2 纯文本消息 msg.text为纯文本 */
            msg: {
                // 消息体
                type: JSON,
                defaultValue: {},
            },

            operator: {
                // 当前登录用户名
                type: STRING,
            },

            receivers: {
                // 发送给的用户名,逗号隔开【系统消息only】
                type: TEXT,
            },

            senderName: {
                // 如果是系统消息，这里则是keepwork；如果是机构消息，这里是['管理员','XX老师']
                type: STRING,
            },

            senderPortrait: {
                // 如果是系统消息，这里则是keepwork官方头像；如果是机构消息，这里是[管理员头像,老师头像]
                type: STRING,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    // 主动合并消息
    model.mergeMessage = async function(userId) {
        const user = await app.model.User.findOne({
            where: { id: userId },
        }).then(o => o && o.toJSON());
        if (!user) return;

        const sql = `
            select 
                id, 
                createdAt 
            from messages 
            where \`all\` = :all 
            and createdAt > :createdAt 
            and id not in (
                select msgId from userMessages where userId = :userId
            )
            `;
        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                all: 1,
                userId,
                createdAt: user.createdAt,
            },
        });
        const datas = _.map(list, o => ({
            userId,
            msgId: o.id,
            status: 0,
            createdAt: o.createdAt,
        }));
        await app.model.UserMessage.bulkCreate(datas);
        return;
    };

    model.associate = () => {
        app.model.Message.hasMany(app.model.UserMessage, {
            as: 'userMessages',
            foreignKey: 'msgId',
            sourceKey: 'id',
            constraints: false,
        });

        app.model.Message.belongsTo(app.model.LessonOrganization, {
            as: 'lessonOrganizations',
            foreignKey: 'organizationId',
            targetKey: 'id',
            constraints: false,
        });
    };

    return model;
};
