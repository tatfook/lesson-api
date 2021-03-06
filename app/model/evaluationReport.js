'use strict';
const moment = require('moment');
const { CLASS_MEMBER_ROLE_ADMIN } = require('../common/consts');

module.exports = app => {
    const { BIGINT, STRING, INTEGER, DATE } = app.Sequelize;

    const model = app.model.define(
        'evaluationReports',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                type: BIGINT,
                defaultValue: 0,
            },

            name: {
                type: STRING,
                allowNull: false,
            },

            type: {
                type: INTEGER,
                defaultValue: 1,
            },

            classId: {
                type: BIGINT,
                defaultValue: 0,
            },

            createdAt: {
                allowNull: false,
                type: DATE,
            },

            updatedAt: {
                allowNull: false,
                type: DATE,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    model.getReportList = async function({
        classId,
        roleId,
        userId,
        name,
        type,
        days,
    }) {
        let condition = ' where r.classId = :classId ';
        if (~~roleId !== CLASS_MEMBER_ROLE_ADMIN) {
            condition += ' and r.userId = :userId';
        }
        if (name) condition += " and r.name like concat('%',:name,'%')";
        if (type) condition += ' and r.type = :type';
        if (days) {
            condition += ` and r.createdAt>='${moment()
                .subtract(days, 'days')
                .format('YYYY-MM-DD HH:mm:ss')}'`;
        }

        const sql = `SELECT
		a.id,
		a.name reportName,
		a.username,
		a.realname teacherName,
		a.type,
		a.createdAt,
		a.commentCount,
		a.sendCount,
		(b.count-a.commentCount) waitComment
	  FROM (
		  SELECT
		  r.id,
		  r.name,
		  u.username,
		  m.realname,
		  r.type,
		  r.createdAt,
		  r.classId,
		  COUNT(distinct ur.id) commentCount,
		  COUNT(distinct ur.id,ur.isSend = 1 OR NULL) sendCount
		FROM
		  evaluationReports r
		  LEFT JOIN (
            select 
                ur.* 
            from evaluationUserReports ur 
            join lessonOrganizationClassMembers m on ur.userId= m.memberId and m.roleId&1 
            where m.classId=:classId
          ) ur ON r.id = ur.reportId
		  LEFT JOIN lessonOrganizationClassMembers m 
			  ON m.memberId = r.userId and m.roleId &2 and m.classId = r.classId
		  LEFT JOIN users u ON u.id = r.userId ${condition}
		GROUP BY r.id
		) a LEFT JOIN (SELECT
			classId,
			COUNT(id) COUNT
		  FROM lessonOrganizationClassMembers  WHERE roleId &1 GROUP BY classId
		) b ON a.classId = b.classId `;

        const list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: {
                classId,
                userId,
                name,
                type,
            },
        });
        return list;
    };

    return model;
};
