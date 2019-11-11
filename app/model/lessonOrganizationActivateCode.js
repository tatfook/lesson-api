'use strict';

module.exports = app => {
    const { BIGINT, INTEGER, STRING, DATE } = app.Sequelize;

    const model = app.model.define(
        'lessonOrganizationActivateCodes',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            organizationId: {
                type: BIGINT,
                defaultValue: 0,
            },

            classId: {
                // 班级Id
                type: BIGINT,
                defaultValue: 0,
            },

            key: {
                // 激活码
                type: STRING,
                unique: true,
                allowNull: false,
            },

            state: {
                // 0 - 未激活 1 - 已激活
                type: INTEGER,
                defaultValue: 0,
            },

            activateUserId: {
                type: BIGINT,
                defaultValue: 0,
            },

            activateTime: {
                type: DATE,
            },

            username: {
                type: STRING,
            },

            realname: {
                type: STRING,
            },

            createdAt: {
                type: DATE,
            },

            updatedAt: {
                type: DATE,
            },
            name: { // 这个激活码是给哪个用户使用的，实际不这么用
                type: STRING,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    model.associate = () => {
        app.model.LessonOrganizationActivateCode.belongsTo(
            app.model.LessonOrganizationClass,
            {
                as: 'lessonOrganizationClasses',
                foreignKey: 'classId',
                targetKey: 'id',
                constraints: false,
            }
        );
    };

    return model;
};
