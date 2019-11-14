'use strict';

module.exports = app => {
    const { BIGINT, STRING, INTEGER } = app.Sequelize;
    const SIXTYFOUR = 64;

    const model = app.model.define(
        'users',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            username: {
                // keepwork username
                type: STRING(SIXTYFOUR),
                unique: true,
                allowNull: false,
            },

            nickname: {
                // lesson昵称或真是姓名
                type: STRING(SIXTYFOUR),
            },

            coin: {
                // 知识币
                type: INTEGER,
                defaultValue: 0,
            },

            lockCoin: {
                // 待解锁的知识币
                type: INTEGER,
                defaultValue: 0,
            },

            bean: {
                type: INTEGER,
                defaultValue: 0,
            },

            identify: {
                // 身份
                type: INTEGER, // 0 = 默认 1 - 学生  2 - 教师 4 - 申请老师
                defaultValue: 0,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    // 不存在则创建
    model.getById = async function(userId, username) {
        let data = await app.model.User.findOne({ where: { id: userId } });
        const amount = 0;
        if (!data && userId) {
            data = await app.model.User.create({
                id: userId,
                username: username || '',
                coin: amount,
            });
        }

        return data ? data.get() : undefined;
    };

    model.associate = () => {
        app.model.User.hasMany(app.model.LessonOrganization, {
            as: 'lessonOrganizations',
            foreignKey: 'userId',
            sourceKey: 'id',
            constraints: false,
        });
        app.model.User.hasOne(app.model.LessonOrganizationClassMember, {
            as: 'lessonOrganizationClassMembers',
            foreignKey: 'memberId',
            sourceKey: 'id',
            constraints: false,
        });

        app.model.User.hasMany(app.model.Package, {
            as: 'packages',
            foreignKey: 'userId',
            sourceKey: 'id',
            constraints: false,
        });
    };

    return model;
};
