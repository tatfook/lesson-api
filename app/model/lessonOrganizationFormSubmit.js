'use strict';

/* 机构表单 */

module.exports = app => {
    const { BIGINT, INTEGER, STRING, JSON, DATE } = app.Sequelize;

    const ONEK = 1024;
    const model = app.model.define(
        'lessonOrganizationFormSubmits',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                // 用户 ID
                type: BIGINT,
                defaultValue: 0,
            },

            organizationId: {
                // 机构 ID
                type: BIGINT,
                defaultValue: 0,
            },

            formId: {
                // 表单 ID
                type: BIGINT,
                defaultValue: 0,
            },

            state: {
                // 关联状态 0 - 未处理  1 - 通过  2 - 已停止
                type: INTEGER,
                defaultValue: 0,
            },

            quizzes: {
                // 包含结果的 quizzes
                type: JSON,
            },

            comment: {
                // 备注
                type: STRING(ONEK),
                defaultValue: '',
            },
            createdAt: {
                type: DATE,
            },

            updatedAt: {
                type: DATE,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    model.associate = () => {
        app.model.LessonOrganizationFormSubmit.belongsTo(
            app.model.LessonOrganizationForm,
            {
                as: 'lessonOrganizationForms',
                foreignKey: 'formId',
                targetKey: 'id',
                constraints: false,
            }
        );
    };

    return model;
};
