'use strict';
module.exports = app => {
    const { BIGINT, INTEGER } = app.Sequelize;

    const model = app.model.define(
        'userMessages',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                type: BIGINT,
            },

            msgId: {
                type: BIGINT,
            },

            status: {
                // 0 - 未读  1 - 已读
                type: INTEGER,
                defaultValue: 0,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',

            indexes: [
                {
                    unique: true,
                    fields: [ 'userId', 'messageId' ],
                },
            ],
        }
    );

    // 各个机构【包括系统】的未读消息数
    model.getUnReadCount = async function(userId) {
        const sql = `
        select 
            m.organizationId,ifnull(o.name,'系统') name,count(um.id) unReadCount
            from userMessages um 
            join messages m on m.id = um.msgId 
            left join lessonOrganizations o on o.id = m.organizationId
        where 
            um.status = 0 and um.userId = :userId 
        group by m.organizationId`;

        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                userId,
            },
        });

        return list;
    };

    model.associate = () => {
        app.model.UserMessage.belongsTo(app.model.Message, {
            as: 'messages',
            foreignKey: 'messageId',
            targetKey: 'id',
            constraints: false,
        });
    };

    return model;
};
