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

            messageId: {
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

    return model;
};
