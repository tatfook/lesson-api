'use strict';
const _ = require('lodash');

module.exports = app => {
    const { BIGINT, INTEGER, STRING, DATE } = app.Sequelize;

    const model = app.model.define(
        'lessonOrganizationClassMembers',
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
                // 0.则为机构成员,或者未加入班级的学生
                type: BIGINT,
                defaultValue: 0,
            },

            memberId: {
                // 成员id
                type: BIGINT,
                defaultValue: 0,
            },
            type: {
                // 用户类型，1.试听，2.正式
                type: INTEGER,
                defaultValue: 0,
            },
            endTime: {
                // 到期时间
                type: DATE,
            },
            realname: {
                // 真实姓名
                type: STRING,
            },

            roleId: {
                // 角色  1 -- 学生  2 -- 教师  64 -- 管理员
                type: INTEGER,
                defaultValue: 0,
            },

            privilege: {
                // 权限
                type: INTEGER,
                defaultValue: 0,
            },

            createdAt: {
                type: DATE,
            },

            updatedAt: {
                type: DATE,
            },
            parentPhoneNum: {
                type: STRING,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',

            indexes: [
                {
                    name: 'organizationId-classId-memberId',
                    unique: true,
                    fields: [ 'organizationId', 'classId', 'memberId' ],
                },
            ],
        }
    );

    model.getAllClassIds = async function({
        memberId,
        roleId,
        organizationId,
    }) {
        const sql = `select 
                classId 
            from lessonOrganizationClassMembers 
            where organizationId = :organizationId 
            and memberId = :memberId and roleId & :roleId`;
        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                organizationId,
                memberId,
                roleId,
            },
        });
        const classIds = _.uniq(_.map(list, o => o.classId));

        return classIds;
    };

    // 获取这个机构的全部用户id,去重
    model.getUserIdsByOrganizationId = async function(
        organizationId,
        classIds,
        userIds
    ) {
        let cond = '';
        if (classIds.length) cond += ' and classId in (:classIds)';
        if (userIds.length) cond += ' and memberId in (:userIds)';

        const sql = `
        select distinct memberId from 
        lessonOrganizationClassMembers
        where organizationId=:organizationId and classId>0 
        and (roleId &1 or roleId&2)${cond}`;

        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                organizationId,
                classIds,
                userIds,
            },
        });
        return list ? list.map(r => r.memberId) : [];
    };

    // 获取这个机构的学生用户,分角色
    model.getMembersAndRoleId = async function(
        organizationId,
        classIds,
        userIds
    ) {
        let cond = '';
        if (classIds.length) cond += ' and classId in (:classIds)';
        if (userIds.length) cond += ' and memberId in (:userIds)';

        const sql = `
        select memberId,roleId&1 roleId from 
        lessonOrganizationClassMembers
        where organizationId=:organizationId and classId>0 
        and roleId &1  ${cond}`;

        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                organizationId,
                classIds,
                userIds,
            },
        });

        return list;
    };

    // 检查师生身份
    model.checkTeacherRoleSql = async function(
        teacherId,
        organizationId,
        studentId
    ) {
        const sql = `
		select
  			s.id
		from
  			lessonOrganizationClassMembers t
  			left join lessonOrganizationClassMembers s on s.classId = t.classId and s.roleId &1
		where t.memberId = :teacherId
  			  and t.roleId & 2
  			  and t.organizationId = :organizationId
  			  and s.memberId = :studentId
		`;
        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                teacherId,
                organizationId,
                studentId,
            },
        });

        return !!list.length;
    };

    model.historyStudents = async function(
        classId,
        type,
        username,
        organizationId
    ) {
        let condition = '';
        if (classId) condition += ' and m.classId=:classId';
        if (type) condition += ' and m.type=:type';
        if (username) {
            condition += ` and (m.realname like '%${username}%' or u.username like '%${username}%')`;
        }

        const sql1 = `
        SELECT 
            m.memberId,
            m.realname,
            u.username,
            m.type,
            m.parentPhoneNum,
            GROUP_CONCAT(c.name) classNames
        FROM
            lessonOrganizationClassMembers m
        JOIN users u ON m.memberId = u.id
        LEFT JOIN lessonOrganizationClasses c ON m.classId = c.id
            AND c.organizationId = m.organizationId
        WHERE m.organizationId = :organizationId and m.roleId&1 and endTime<now() 
        ${condition} GROUP BY m.memberId
        `;

        const sql2 = `
        SELECT 
            count(distinct memberId) count
        FROM
            lessonOrganizationClassMembers m
        JOIN users u ON m.memberId = u.id
        LEFT JOIN lessonOrganizationClasses c ON m.classId = c.id
            AND c.organizationId = m.organizationId
        WHERE m.organizationId = :organizationId and m.roleId&1 and endTime<now() 
        ${condition} 
        `;
        return await Promise.all([
            app.model.query(sql1, {
                type: app.model.QueryTypes.SELECT,
                replacements: {
                    classId,
                    type,
                    username,
                    organizationId,
                },
            }),
            app.model.query(sql2, {
                type: app.model.QueryTypes.SELECT,
                replacements: {
                    classId,
                    type,
                    username,
                    organizationId,
                },
            }),
        ]);
    };

    model.associate = () => {
        app.model.LessonOrganizationClassMember.belongsTo(
            app.model.LessonOrganization,
            {
                as: 'lessonOrganizations',
                foreignKey: 'organizationId',
                targetKey: 'id',
                constraints: false,
            }
        );

        app.model.LessonOrganizationClassMember.belongsTo(
            app.model.LessonOrganizationClass,
            {
                as: 'lessonOrganizationClasses',
                foreignKey: 'classId',
                targetKey: 'id',
                constraints: false,
            }
        );

        app.model.LessonOrganizationClassMember.belongsTo(app.model.User, {
            as: 'users',
            foreignKey: 'memberId',
            targetKey: 'id',
            constraints: false,
        });

        app.model.LessonOrganizationClassMember.hasMany(
            app.model.LessonOrganizationPackage,
            {
                as: 'lessonOrganizationPackages',
                foreignKey: 'classId',
                sourceKey: 'classId',
                constraints: false,
            }
        );
    };

    return model;
};
