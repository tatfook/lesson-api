"use strict";

const moment = require("moment");
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

	model.getUserReportList = async function ({ reportId, status, isSend, realname }) {
		let cond = ``;
		if (isSend) cond += ` and ur.isSend =:isSend`;
		if (realname) cond += ` and m.realname like concat('%',:realname,'%')`;

		// 已点评名单sql
		const sql1 = `SELECT
		ur.id userReportId,
		ur.userId studentId,
		ur.createdAt,
		ur.isSend,
		ur.star,
		m.realname,
		m.parentPhoneNum
	  FROM
		evaluationUserReports ur
		LEFT JOIN evaluationReports r ON r.id = ur.reportId
		LEFT JOIN lessonOrganizationClassMembers m
		  ON ur.userId = m.memberId and m.roleId & 1 and m.classId = r.classId
	  WHERE ur.reportId = :reportId ${cond}`;

		// 未点评名单sql
		const sql2 = `SELECT
		m.memberId studentId,
		m.realname
	  FROM
		lessonOrganizationClassMembers m
		LEFT JOIN evaluationReports r ON m.classId = r.classId
		LEFT JOIN evaluationUserReports ur ON m.memberId= ur.userId AND ur.reportId=r.id
		WHERE r.id =:reportId AND ur.id IS NULL AND m.roleId &1`;

		const sql = ~~status === 1 ? sql2 : sql1;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				isSend, realname, reportId
			}
		});
		return list;
	};

	model.getTeacherByUserReportId = async function (userReportId) {
		const sql = `
		select 
			r.userId teacherId,
			ur.userId studentId,
			r.id reportId,
			r.classId
		from evaluationReports r
		left join evaluationUserReports ur on r.id = ur.reportId
		where ur.id = :userReportId
		`;
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				userReportId
			}
		});
		return list[0] ? list[0] : undefined;
	};

	// 获取这个报告中已经点评了的学生id
	model.getStudentIdsByReportId = async function (reportId) {
		const sql = `
		select 
			ur.userId studentId
		from evaluationUserReports ur 
			left join evaluationReports r on r.id = ur.reportId
		where r.id = :reportId
		`;
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				reportId
			}
		});
		return list;
	};

	// 
	model.getByUserIdAndClassIds = async function (studentId, classIds) {
		const sql = `
		select
			  ur.*,
			  r.classId
		from
  			evaluationUserReports ur
  			left join evaluationReports r on r.id = ur.reportId
    	where r.classId in (:classIds) and ur.userId =:studentId 
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				studentId, classIds: classIds.toString()
			}
		});
		return list ? list : [];
	};

	// 
	model.getReportAndOrgNameById = async function (userReportId) {
		const sql = `
		select 
			distinct
  			ur.*,
			o.name orgName,
			o.QRCode,
			o.propaganda,
			m.realname,
			tm.realname teacherName
		from
			evaluationUserReports ur
			left join evaluationReports r on r.id = ur.reportId
			left join lessonOrganizationClassMembers m on m.memberId = ur.userId
			  and m.roleId&1 AND m.classId = r.classId
			left join lessonOrganizations o on o.id = m.organizationId
			left join lessonOrganizationClassMembers tm on tm.memberId = r.userId and tm.roleId&2
		where ur.id = :userReportId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				userReportId
			}
		});
		return list[0] ? list[0] : undefined;
	};

	// 获取本班同学本次点评的平均能力值
	model.getClassmatesAvgStarById = async function (reportId) {
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
  			evaluationReports r 
  			LEFT JOIN lessonOrganizationClassMembers m ON m.classId = r.classId
  			LEFT JOIN evaluationUserReports ur2 ON ur2.userId=m.memberId AND ur2.reportId = r.id
		WHERE r.id = :reportId
		`;
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				reportId
			}
		});
		return list[0] ? list[0] : undefined;
	};

	// 本班历次能力值总和的平均值
	model.getClassmatesHistoryAvgStar = async function (classId) {
		const sql = `
		SELECT
			ROUND(SUM(star) /COUNT(DISTINCT userId),2) starAvg,
			ROUND(SUM(\`spatial\`)/COUNT(DISTINCT userId),2) spatialAvg,
			ROUND(SUM(collaborative)/COUNT(DISTINCT userId),2) collaborativeAvg,
			ROUND(SUM(creative) /COUNT(DISTINCT userId),2) creativeAvg,
			ROUND(SUM(logical) /COUNT(DISTINCT userId),2) logicalAvg,
			ROUND(SUM(compute) /COUNT(DISTINCT userId),2) computeAvg,
			ROUND(SUM(coordinate) /COUNT(DISTINCT userId),2) coordinateAvg
 		FROM (
			SELECT
				DISTINCT ur2.*
			FROM
				evaluationUserReports ur
  				LEFT JOIN evaluationReports r ON r.id = ur.reportId
  				LEFT JOIN lessonOrganizationClassMembers m ON m.classId = r.classId
  				LEFT JOIN evaluationUserReports ur2 ON ur2.userId=m.memberId AND ur2.reportId= ur.reportId
			WHERE r.classId = :classId AND ur2.id IS NOT NULL) a
		`;
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				classId
			}
		});
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
		WHERE ur.userId = :studentId AND r.classId = :classId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				studentId, classId
			}
		});
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
		WHERE ur.userId = :studentId AND r.classId = :classId
		ORDER BY ur.reportId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				studentId, classId
			}
		});
		return list;
	};

	// 获取同学历次成长的平均值
	model.getClassmatesHistoryAvgStarGroupByReportId = async function (classId) {
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
				LEFT JOIN evaluationUserReports ur2 ON ur2.userId = m.memberId and ur.reportId = ur2.reportId
			WHERE ur2.reportId IS NOT NULL AND r.classId = :classId
		) a GROUP BY a.reportId ORDER BY a.reportId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				classId
			}
		});
		return list;
	};

	// 学生获得的历次点评列表
	model.getEvaluationCommentListSql = async function (userId, classId) {
		const sql = `
		SELECT
			distinct
			ur.id,
  			ur.createdAt,
  			m.realname teacherName,
  			r.name reportName,
  			r.type,
  			ur.star
		from
  			evaluationUserReports ur
  			join evaluationReports r on r.id = ur.reportId 
			left join lessonOrganizationClassMembers m on m.memberId=r.userId
			  and m.roleId&2 and m.classId = r.classId
  			where ur.userId=:userId and r.classId = :classId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				userId, classId
			}
		});
		return list;
	};

	// 机构的班级列表，以及它们的评估状态
	model.getClassAndEvalStatus = async function (organizationId, days) {
		let cond = ``;
		if (days) cond += ` where r.createdAt>='${moment().subtract(days, "days").format("YYYY-MM-DD HH:mm:ss")}'`;
		// status 1.发送给家长,2.未点评,3.待发送
		const sql = `
		select
			a.*,
			b.sendCount,
			b.commentCount,
			if (b.sendCount > 0, 1,if (b.commentCount > 0, 3, 2)) status
		from(
			select
		  		c.id classId,
				c.name,
				group_concat(m.realname) teacherNames
			from
		  		lessonOrganizationClasses c
		  		left join lessonOrganizationClassMembers m on m.classId = c.id and m.roleId & 2
			where c.organizationId = :organizationId and c.end > '${moment().format("YYYY-MM-DD HH:mm:ss")}'
			group by c.id
		) a
		left join(
			select
				r.classId,
				count(ur.isSend = 1 or null) sendCount,
				count(ur.id) commentCount
		  	from evaluationReports r
			left join evaluationUserReports ur on ur.reportId = r.id ${cond}
			group by r.classId
		) b on a.classId = b.classId`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				organizationId
			}
		});
		return list;
	};

	// 班级各个老师的点评情况
	model.getTeacherCommentStatistics = async function (classId, days) {
		let cond = ``;
		if (days) cond += ` and r.createdAt>='${moment().subtract(days, "days").format("YYYY-MM-DD HH:mm:ss")}'`;

		const sql = `
		SELECT
			a.*,
			b.commentCount,
			b.sendCount
	  	FROM (
			SELECT
		  		r.userId,
		  		r.type,
		  		m.realname,
		  		c.name className
		 	FROM
		  		evaluationReports r
		  		LEFT JOIN lessonOrganizationClassMembers m
					ON m.memberId = r.userId AND m.roleId & 2 
		   		LEFT JOIN lessonOrganizationClasses c ON c.id = r.classId
			WHERE r.classId = :classId ${cond} GROUP BY r.userId, r.type
		) a
		LEFT JOIN(  
			SELECT
				userId,
				type,
				SUM(IF(commented = 1, 1, 0)) commentCount,
				SUM(IF(send = 1, 1, 0)) sendCount
		  	FROM (
				  SELECT
			  		r.userId,
			  		r.type,
			  		IF(COUNT(ur.id) > 0, 1, 0) commented,
			  		IF(COUNT(ur.isSend = 1 OR NULL) > 0, 1, 0) send
				  FROM
			  		evaluationReports r
			  		LEFT JOIN evaluationUserReports ur ON ur.reportId = r.id
					WHERE r.classId = :classId ${cond} GROUP BY r.id
				) c GROUP BY userId,type
		) b ON a.userId = b.userId AND a.type = b.type
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT, replacements: {
				classId
			}
		});
		return list.map(r => {
			r.commentCount = parseInt(r.commentCount, 10);
			r.sendCount = parseInt(r.sendCount, 10);
			return r;
		});
	};

	return model;
};