'use strict';

module.exports = app => {
    const { BIGINT, INTEGER } = app.Sequelize;

    const model = app.model.define(
        'lessonRewards',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                type: BIGINT,
                allowNull: false,
            },

            packageId: {
                type: BIGINT,
                allowNull: false,
            },

            lessonId: {
                type: BIGINT,
                allowNull: false,
            },

            coin: {
                // 奖励知识币数量
                type: INTEGER,
                defaultValue: 0,
            },

            bean: {
                // 奖励知识豆数量
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
                    fields: [ 'userId', 'packageId', 'lessonId' ],
                },
            ],
        }
    );

    return model;
};
