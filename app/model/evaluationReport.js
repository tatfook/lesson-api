
"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		DATE
	} = app.Sequelize;

	const model = app.model.define("evaluationReports", {
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
			allowNull: false
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
			type: DATE
		},

		updatedAt: {
			allowNull: false,
			type: DATE
		},
	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin"
	});

	model.getReportList = async function ({ classId, name, type }) {
		let condition = ` where r.classId = :classId`;
		if (name) condition += ` and r.name like concat('%',:name,'%')`;
		if (type) condition += ` and r.type = :type`;

		const sql = `SELECT
		a.id,
		a.name reportName,
		a.username,
		IF(a.type=1,'小评','阶段总结') type,
		a.createdAt,
		a.commentCount,
		a.sendCount,
		(b.count-a.commentCount) waitComment
	  FROM (
		  SELECT
		  r.id,
		  r.name,
		  u.username,
		  r.type,
		  r.createdAt,
		  r.classId,
		  COUNT(ur.id) commentCount,
		  COUNT(ur.isSend = 1 OR NULL) sendCount
		FROM
		  evaluationReports r
		  LEFT JOIN evaluationUserReports ur ON r.id = ur.reportId
		  LEFT JOIN users u ON u.id = r.userId ${condition}
		GROUP BY r.id
		) a LEFT JOIN (SELECT
			classId,
			COUNT(id) COUNT
		  FROM lessonOrganizationClassMembers  WHERE roleId &1 GROUP BY classId
		) b ON a.classId = b.classId`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				classId: classId,
				name: name,
				type: type,
			}
		});
		return list;
	};

	return model;
};