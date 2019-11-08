'use strict';

/* 机构表单 */

module.exports = app => {
    const { BIGINT, INTEGER, STRING, TEXT, JSON, DATE } = app.Sequelize;
    const ONEK = 1024;

    const model = app.model.define(
        'lessonOrganizationForms',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                // 用户ID
                type: BIGINT,
                defaultValue: 0,
            },

            organizationId: {
                type: BIGINT,
                defaultValue: 0,
            },

            state: {
                // 发布状态 0 - 未发布  1 - 进行中  2 - 已停止
                type: INTEGER,
                defaultValue: 0,
            },

            type: {
                // 0 - 空白模板 1 - 招生通知 2 - 入学作品提交通知 3 - 报名表  4 - 入选学员通知
                type: INTEGER,
                defaultValue: 0,
            },

            name: {
                type: STRING,
                defaultValue: '',
            },

            title: {
                type: STRING,
                defaultValue: '',
            },

            description: {
                type: STRING(ONEK),
                defaultValue: '',
            },

            text: {
                type: TEXT,
            },

            quizzes: {
                type: JSON,
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

    // model.sync({force:true});

    model.associate = () => {
        app.model.LessonOrganizationForm.hasMany(
            app.model.LessonOrganizationFormSubmit,
            {
                as: 'lessonOrganizationFormSubmits',
                foreignKey: 'formId',
                sourceKey: 'id',
                constraints: false,
            }
        );
    };

    return model;
};
