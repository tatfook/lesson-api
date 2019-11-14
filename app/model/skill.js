'use strict';

module.exports = app => {
    const { BIGINT, STRING } = app.Sequelize;
    const SIXTYFOUR = 64;

    const model = app.model.define(
        'skills',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            skillName: {
                type: STRING(SIXTYFOUR),
                unique: true,
                allowNull: false,
            },

            enSkillName: {
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
