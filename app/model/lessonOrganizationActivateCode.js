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

            classIds: {
                // 班级id数组
                // 班级Id
                type: JSON,
                defaultValue: [],
            },
            type: {
                // 1.试听一个月，2.试听两个月，
                // 5.正式三个月，6.正式六个月，7.正式一年(送三个月)
                type: INTEGER,
                defaultValue: 0,
            },

            key: {
                // 激活码
                type: STRING,
                unique: true,
                allowNull: false,
            },

            state: {
                // 0.未激活,1.已激活,2.已无效
                type: INTEGER,
                defaultValue: 0,
            },

            activateUserId: {
                // 激活了谁
                type: BIGINT,
                defaultValue: 0,
            },

            activateTime: {
                // 激活时间
                type: DATE,
            },

            username: {
                // 激活的username
                type: STRING,
            },

            realname: {
                // 激活的realname
                type: STRING,
            },

            createdAt: {
                type: DATE,
            },

            updatedAt: {
                type: DATE,
            },
            name: {
                // 这个激活码是给哪个用户使用的，实际不这么用
                type: STRING,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    // 这个机构各个类型的激活码的已使用和已生成情况
    model.getCountByTypeAndState = async function(organizationId) {
        const sql = `
        select 
            type,
            state,
            count(id) count
        from lessonOrganizationActivateCodes 
        where organizationId=:organizationId
        and state != 2 group by type,state
        `;

        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                organizationId,
            },
        });
        return list;
    };

    // 机构正式邀请码使用情况
    model.activateCodeUseStatus = async function(organizationIds) {
        const sql = `
        select 
            organizationId,
            type,
            count(id) usedCount
        from lessonOrganizationActivateCodes 
        where organizationId in (:organizationIds) and type>=5 and state=1
        group by organizationId,type
        `;
        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                organizationIds,
            },
        });
        return list;
    };

    model.associate = () => {
        app.model.LessonOrganizationActivateCode.belongsTo(
            app.model.LessonOrganization,
            {
                as: 'lessonOrganizations',
                foreignKey: 'organizationId',
                targetKey: 'id',
                constraints: false,
            }
        );
    };

    return model;
};
