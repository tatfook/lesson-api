'use strict';
const _ = require('lodash');

const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_STUDENT,
} = require('../common/consts');

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
                // 0 -- 则为机构成员
                type: BIGINT,
                defaultValue: 0,
            },

            memberId: {
                // 成员id
                type: BIGINT,
                defaultValue: 0,
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
        const sql =
            `select 
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
    model.getUserIdsByOrganizationId = async function(organizationId, classIds, userIds) {

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
                classIds: classIds.toString(),
                userIds: userIds.toString(),
            },
        });
        return list ? list.map(r => r.memberId) : [];
    };

    // 获取这个机构的全部用户,分角色
    model.getMembersAndRoleId = async function(organizationId, classIds, userIds) {

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
                classIds: classIds.toString(),
                userIds: userIds.toString(),
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
