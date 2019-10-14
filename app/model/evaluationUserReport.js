"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		DATE,
		JSON
	} = app.Sequelize;

	const model = app.model.define("evaluationUserReports", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: BIGINT,
			defaultValue: 0,
		},

		reportId: {
			type: BIGINT,
			defaultValue: 0,
		},

		star: {
			type: INTEGER,
			defaultValue: 1,
		},

		spatial: {
			type: INTEGER,
			defaultValue: 1,
		},

		collaborative: {
			type: INTEGER,
			defaultValue: 1,
		},

		creative: {
			type: INTEGER,
			defaultValue: 1,
		},
		logical: {
			type: INTEGER,
			defaultValue: 1,
		},
		compute: {
			type: INTEGER,
			defaultValue: 1,
		},
		coordinate: {
			type: INTEGER,
			defaultValue: 1,
		},
		comment: {
			type: STRING(256),
			defaultValue: "",
		},
		mediaUrl: {
			type: JSON,
			defaultValue: [],
		},
		isSend: {
			type: INTEGER,
			defaultValue: 0
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

	model.getUserReportList = async function (reportId, status) {
		// 已点评名单sql
		const sql1 = `SELECT
		ur.id userReportId,
		ur.userId studentId,
		ur.createdAt,
		ur.isSend,
		u.username
	  FROM
		evaluationUserReports ur
		LEFT JOIN users u
		  ON ur.userId = u.id
	  WHERE ur.reportId = ${reportId}`;

		// 未点评名单sql
		const sql2 = `SELECT
		u.id userId,
		u.username
	  FROM
		lessonOrganizationClassMembers m
		JOIN users u ON m.memberId = u.id
		LEFT JOIN evaluationReports r ON m.classId = r.classId
		LEFT JOIN evaluationUserReports ur ON m.memberId= ur.userId
		WHERE r.id =${reportId} AND ur.id IS NULL `;

		const sql = ~~status === 1 ? sql2 : sql1;

		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list;
	};

	model.getTeacherByUserReportId = async function (userReportId) {
		const sql = `
		select r.userId from evaluationReports r
		left join evaluationUserReports ur on r.id = ur.reportId
		where ur.id = ${userReportId}
		`;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0] ? list[0].userId : undefined;
	};

	// 
	model.getReportAndOrgNameById = async function (userReportId) {
		const sql = `
		select 
			distinct
  			ur.*,
			o.name orgName,
			m.realname
		from
  			evaluationUserReports ur
  			left join lessonOrganizationClassMembers m on m.memberId = ur.userId
  			left join lessonOrganizations o on o.id = m.organizationId
		where ur.id = ${userReportId}
		`;

		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0] ? list[0] : undefined;
	};

	// 获取本班同学本次点评的平均能力值
	model.getClassmatesAvgStarById = async function (userReportId) {
		const sql = `
		SELECT
			ROUND(AVG(ur2.star),2) starAvg,
			ROUND(AVG(ur2.\`spatial\`),2) spatialAvg,
			ROUND(AVG(ur2.collaborative),2) collaborativeAvg,
			ROUND(AVG(ur2.creative),2) creativeAvg,
			ROUND(AVG(ur2.logical),2) logicalAvg,
			ROUND(AVG(ur2.compute),2) computeAvg,
			ROUND(AVG(ur2.coordinate),2) coordinateAvg
		FROM
  			evaluationUserReports ur
  			LEFT JOIN evaluationReports r ON r.id = ur.reportId
  			LEFT JOIN lessonOrganizationClassMembers m ON m.classId = r.classId
  			LEFT JOIN evaluationUserReports ur2 ON ur2.userId=m.memberId AND ur2.reportId = r.id
		WHERE ur.id = ${userReportId} 
		 `;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0] ? list[0] : undefined;
	};

	// 本班历次能力值总和的平均值
	model.getClassmatesHistoryAvgStar = async function (studentId) {
		const sql = `
		SELECT
			ROUND(AVG(ur2.star),2) starAvg,
			ROUND(AVG(ur2.\`spatial\`),2) spatialAvg,
			ROUND(AVG(ur2.collaborative),2) collaborativeAvg,
			ROUND(AVG(ur2.creative),2) creativeAvg,
			ROUND(AVG(ur2.logical),2) logicalAvg,
			ROUND(AVG(ur2.compute),2) computeAvg,
			ROUND(AVG(ur2.coordinate),2) coordinateAvg
		FROM
  			evaluationUserReports ur
  			LEFT JOIN evaluationReports r ON r.id = ur.reportId
  			LEFT JOIN lessonOrganizationClassMembers m ON m.classId = r.classId
  			LEFT JOIN evaluationUserReports ur2 ON ur2.userId=m.memberId 
		WHERE ur.userId = ${studentId} 
		 `;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0] ? list[0] : undefined;
	};

	// 获取学生在这个班历次能力值总和
	model.getUserSumStar = async function (studentId, classId) {
		const sql = `
		SELECT 
			SUM(ur.star) starCount,
			SUM(ur.\`spatial\`) spatialCount,
			SUM(ur.collaborative) collaborativeCount,
			SUM(ur.creative) creativeCount,
			SUM(ur.logical) logicalCount,
			SUM(ur.compute) computeCount,
			SUM(ur.coordinate) coordinateCount
		FROM evaluationUserReports ur
			JOIN evaluationReports r ON r.id = ur.reportId
		WHERE ur.userId = ${studentId} AND r.classId = ${classId}
		`;

		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0] ? list[0] : undefined;
	};

	// 获取学生在这个班的历次成长
	model.getUserHistoryStar = async function (studentId, classId) {
		const sql = `
		SELECT
			ur.reportId,
			ur.star,
			ur.\`spatial\`,
			ur.collaborative,
			ur.creative,
			ur.logical,
			ur.compute,
			ur.coordinate
		FROM evaluationUserReports ur
			JOIN evaluationReports r ON r.id = ur.reportId
		WHERE ur.userId = ${studentId} AND r.classId = ${classId}
		ORDER BY ur.reportId
		`;

		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list;
	};

	// 获取同学历次成长的平均值
	model.getClassmatesHistoryAvgStarGroupByReportId = async function (studentId) {
		const sql = `
		SELECT 
			reportId,
			ROUND(AVG(star),2) starAvg,
			ROUND(AVG(\`spatial\`),2) spatialAvg,
			ROUND(AVG(collaborative),2) collaborativeAvg,
			ROUND(AVG(creative),2) creativeAvg,
			ROUND(AVG(logical),2) logicalAvg,
			ROUND(AVG(compute),2) computeAvg,
			ROUND(AVG(coordinate),2) coordinateAvg
		FROM (
			SELECT
	   			DISTINCT ur2.*
	  		FROM evaluationUserReports ur
				LEFT JOIN evaluationReports r ON r.id = ur.reportId
				LEFT JOIN lessonOrganizationClassMembers m ON m.classId = r.classId
				LEFT JOIN evaluationUserReports ur2 ON ur2.userId = m.memberId
			WHERE ur.userId=${studentId} AND ur2.reportId IS NOT NULL
		) a GROUP BY a.reportId ORDER BY a.reportId
		`;

		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list;
	};

	return model;
};