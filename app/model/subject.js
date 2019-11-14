'use strict';

module.exports = app => {
    const { BIGINT, STRING } = app.Sequelize;
    const SIXTYFOUR = 64;

    const model = app.model.define(
        'subjects',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            subjectName: {
                type: STRING(SIXTYFOUR),
                unique: true,
                allowNull: false,
            },

            enSubjectName: {
                type: STRING(SIXTYFOUR),
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    return model;
};
