
"use strict";

const Service = require("../common/service.js");
const Err = require("../common/err");
const moment = require("moment");

class EvalReportService extends Service {

	async createEvalReport({ userId, name, type, classId }) {
		return await this.ctx.model.EvaluationReport.create({ userId, name, type, classId });
	}

	async updateEvalReport(params, condition) {
		return await this.ctx.model.EvaluationReport.update(params, { where: condition });
	}

	async createUserReport(params) {
		return await this.ctx.model.EvaluationUserReport.create(params);
	}

	async getReportList({ classId, name = undefined, type = undefined }) {
		const list = await this.ctx.model.EvaluationReport.getReportList({ classId, name, type });
		return list;
	}

	// 删除发起的点评，那么已经点评过的记录也要删除
	async destroyReportById(reportId) {
		let transaction;
		try {
			transaction = await this.ctx.model.transaction();
			await Promise.all([
				this.ctx.model.EvaluationReport.destroy({ where: { id: reportId }, transaction }),
				this.ctx.model.EvaluationUserReport.destroy({ where: { reportId }, transaction })
			]);

			await transaction.commit();
		} catch (e) {
			await transaction.rollback();
			this.ctx.throw(500, Err.DB_ERR);
		}
	}

	async getUserReportByCondition(condition) {
		const ret = await this.ctx.model.EvaluationUserReport.findOne({ where: condition });
		return ret ? ret.get() : undefined;
	}


	async getUserReportAndOrgInfo(userReportId) {
		const repo = await this.ctx.model.EvaluationUserReport.getReportAndOrgNameById(userReportId);
		const user = await this.ctx.keepworkModel.Users.findOne({ attributes: ["portrait"], where: { id: repo.userId } });
		return { ...repo, portrait: user.portrait };
	}

	async getReportByCondition(condition) {
		const ret = await this.ctx.model.EvaluationReport.findOne({ where: condition });
		return ret ? ret.get() : undefined;
	}

	async getUserReportList({ reportId, status, isSend, realname }) {
		const list = await this.ctx.model.EvaluationUserReport.getUserReportList({ reportId, status, isSend, realname });
		return list;
	}

	async getTeacherByUserReportId(userReportId) {
		const teacherId = await this.ctx.model.EvaluationUserReport.getTeacherByUserReportId(userReportId);
		return teacherId;
	}

	async destroyUserReportByCondition(condition) {
		return await this.ctx.model.EvaluationUserReport.destroy({ where: condition });
	}

	// 学生获得的点评详情
	async getUserReportDetail(userReportId, studentId, classId, type) {

		const taskArr = ~~type === 1 ?
			[// 小评
				this.getUserReportAndOrgInfo(userReportId),
				this.ctx.model.EvaluationUserReport.getClassmatesAvgStarById(userReportId)
			] : [// 阶段点评
				this.getUserReportAndOrgInfo(userReportId),
				this.ctx.model.EvaluationUserReport.getClassmatesAvgStarById(userReportId), // 本班同学本次点评的平均能力值
				this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStar(studentId), // 本班同学历次能力值总和的平均值
				this.ctx.model.EvaluationUserReport.getUserSumStar(studentId, classId), // 获取学生在这个班历次能力值总和
				this.ctx.model.EvaluationUserReport.getUserHistoryStar(studentId, classId), // 获取学生在这个班历次成长
				this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStarGroupByReportId(studentId)// 获取同学历次成长的平均值
			];

		const [
			userRepo,
			classmatesAvgStar,
			classmatesHistoryAvgStar = [],
			userSumStar = [],
			userHistoryStar = [],
			classmatesHistoryAvgStar2 = []
		] = await Promise.all(taskArr);

		const userHistoryStarArr = [];
		for (let i = 0; i < userHistoryStar.length; i++) {
			const element = userHistoryStar[i];
			let star = 0, spatial = 0, collaborative = 0, creative = 0, logical = 0, compute = 0, coordinate = 0;
			for (let j = 0; j <= i; j++) {
				star += userHistoryStar[j].star;
				spatial += userHistoryStar[j].spatial;
				collaborative += userHistoryStar[j].collaborative;
				creative += userHistoryStar[j].creative;
				logical += userHistoryStar[j].logical;
				compute += userHistoryStar[j].compute;
				coordinate += userHistoryStar[j].coordinate;
			}

			userHistoryStarArr.push({ ...element, star, spatial, collaborative, creative, logical, compute, coordinate });
		}

		const classmatesHistoryAvgStar2Arr = [];
		for (let i = 0; i < classmatesHistoryAvgStar2.length; i++) {
			const element = classmatesHistoryAvgStar2[i];
			let starAvg = 0, spatialAvg = 0, collaborativeAvg = 0, creativeAvg = 0, logicalAvg = 0, computeAvg = 0, coordinateAvg = 0;
			for (let j = 0; j <= i; j++) {
				starAvg += parseFloat(classmatesHistoryAvgStar2[j].starAvg);
				spatialAvg += parseFloat(classmatesHistoryAvgStar2[j].spatialAvg);
				collaborativeAvg += parseFloat(classmatesHistoryAvgStar2[j].collaborativeAvg);
				creativeAvg += parseFloat(classmatesHistoryAvgStar2[j].creativeAvg);
				logicalAvg += parseFloat(classmatesHistoryAvgStar2[j].logicalAvg);
				computeAvg += parseFloat(classmatesHistoryAvgStar2[j].computeAvg);
				coordinateAvg += parseFloat(classmatesHistoryAvgStar2[j].coordinateAvg);
			}

			classmatesHistoryAvgStar2Arr.push({ ...element, starAvg, spatialAvg, collaborativeAvg, creativeAvg, logicalAvg, computeAvg, coordinateAvg })
		}

		const retObj = {
			userRepo,
			classmatesAvgStar,// 班级本次平均能力值
			historyStarStatistics: { // 历次能力值统计
				classmatesHistoryAvgStar,
				userSumStar
			},
			growthTrack: {// 成长轨迹
				userHistoryStar: userHistoryStarArr,
				classmatesHistoryAvgStar2: classmatesHistoryAvgStar2Arr
			}
		};
		return retObj;
	}

	// 修改对学生的点评
	async updateUserReportByCondition(params, condition) {
		const ret = await this.ctx.model.EvaluationUserReport.update(params, { where: condition });
		return ret;
	}

	// 修改keepwork头像，在机构中的realname和家长手机号
	async updatePortraitRealNameParentNum({ portrait, realname, parentPhoneNum, userId, organizationId }) {
		if (parentPhoneNum) {
			const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition({ memberId: userId });
			if (member.parentPhoneNum) {// 家长手机号已经绑定，再修改的话不应该用这个接口
				this.ctx.throw(400, Err.UNKNOWN_ERR);
			}
		}

		await Promise.all([
			this.ctx.keepworkModel.Users.update({ portrait }, { where: { id: userId } }),
			this.ctx.service.lessonOrganizationClassMember.updateByCondition({ realname, parentPhoneNum }, { memberId: userId, organizationId })
		]);
	}

	// 获取keepwork头像，在机构中的realname和家长手机号
	async getPortraitRealNameParentNum(userId, organizationId) {

		const [user, member] = await Promise.all([
			this.ctx.keepworkModel.Users.findOne({ where: { id: userId } }),
			this.ctx.service.lessonOrganizationClassMember.getByCondition({ organizationId, memberId: userId })
		]);

		return {
			portrait: user ? user.portrait : '',
			realname: member ? member.realname : '',
			parentPhoneNum: member ? member.parentPhoneNum : ''
		}
	}

	// 修改家长手机号【第二步】
	async updateParentphonenum(userId, organizationId, parentPhoneNum) {
		return await this.ctx.service.lessonOrganizationClassMember.updateByCondition({ parentPhoneNum }, { memberId: userId, organizationId });
	}

	// 本班所有任课老师对该学生的点评数据分析
	async getUserReportStatisticsInClass(classId, studentId) {
		const [
			classmatesHistoryAvgStar,
			userSumStar,
			userHistoryStar,
			classmatesHistoryAvgStar2
		] = await Promise.all([
			this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStar(studentId), // 本班同学历次能力值总和的平均值
			this.ctx.model.EvaluationUserReport.getUserSumStar(studentId, classId), // 获取学生在这个班历次能力值总和
			this.ctx.model.EvaluationUserReport.getUserHistoryStar(studentId, classId), // 获取学生在这个班历次成长
			this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStarGroupByReportId(studentId)// 获取同学历次成长的平均值
		]);

		const userHistoryStarArr = [];
		for (let i = 0; i < userHistoryStar.length; i++) {
			const element = userHistoryStar[i];
			let star = 0, spatial = 0, collaborative = 0, creative = 0, logical = 0, compute = 0, coordinate = 0;
			for (let j = 0; j <= i; j++) {
				star += userHistoryStar[j].star;
				spatial += userHistoryStar[j].spatial;
				collaborative += userHistoryStar[j].collaborative;
				creative += userHistoryStar[j].creative;
				logical += userHistoryStar[j].logical;
				compute += userHistoryStar[j].compute;
				coordinate += userHistoryStar[j].coordinate;
			}

			userHistoryStarArr.push({ ...element, star, spatial, collaborative, creative, logical, compute, coordinate });
		}

		const classmatesHistoryAvgStar2Arr = [];
		for (let i = 0; i < classmatesHistoryAvgStar2.length; i++) {
			const element = classmatesHistoryAvgStar2[i];
			let starAvg = 0, spatialAvg = 0, collaborativeAvg = 0, creativeAvg = 0, logicalAvg = 0, computeAvg = 0, coordinateAvg = 0;
			for (let j = 0; j <= i; j++) {
				starAvg += parseFloat(classmatesHistoryAvgStar2[j].starAvg);
				spatialAvg += parseFloat(classmatesHistoryAvgStar2[j].spatialAvg);
				collaborativeAvg += parseFloat(classmatesHistoryAvgStar2[j].collaborativeAvg);
				creativeAvg += parseFloat(classmatesHistoryAvgStar2[j].creativeAvg);
				logicalAvg += parseFloat(classmatesHistoryAvgStar2[j].logicalAvg);
				computeAvg += parseFloat(classmatesHistoryAvgStar2[j].computeAvg);
				coordinateAvg += parseFloat(classmatesHistoryAvgStar2[j].coordinateAvg);
			}

			classmatesHistoryAvgStar2Arr.push({ ...element, starAvg, spatialAvg, collaborativeAvg, creativeAvg, logicalAvg, computeAvg, coordinateAvg })
		}

		const retObj = {
			historyStarStatistics: { // 历次能力值统计
				classmatesHistoryAvgStar,
				userSumStar
			},
			growthTrack: {// 成长轨迹
				userHistoryStar: userHistoryStarArr,
				classmatesHistoryAvgStar2: classmatesHistoryAvgStar2Arr
			}
		};

		return retObj;
	}

	// 学生获得的历次点评列表
	async getEvaluationCommentList(classId, userId) {
		const list = await this.ctx.model.EvaluationUserReport.getEvaluationCommentListSql(userId, classId);
		list.forEach(r => {
			r.createdAt = moment(r.createdAt).format("YYYY-MM-DD HH:mm:ss");
			r.teacherName = `${r.teacherName}老师`;
		});
		return list;
	}

	// 发送给家长  dataArr 结构：[{baseUrl,reportName,studentId,realname, orgName,star,classId, type, userReportId,parentPhoneNum}]
	async reportToParent(dataArr) {
		const tasksArr = [];
		const userReportIds = [];

		// 发短信任务
		for (let i = 0; i < dataArr.length; i++) {
			const { baseUrl, reportName, studentId, realname, orgName, star, classId, type, userReportId, parentPhoneNum } = dataArr[i];
			tasksArr.push(this.app.sendSms(parentPhoneNum, [
				reportName,
				realname,
				realname,
				orgName,
				star,
				`${baseUrl}evaluationReports/userReport/${userReportId}?studentId=${studentId}&classId=${classId}&type=${type}`
			], "479638"));

			userReportIds.push(userReportId);
		}

		// 修改isSend标识
		tasksArr.push(this.updateUserReportByCondition({ isSend: 1 }, { id: { "$in": userReportIds } }));

		await Promise.all(tasksArr);
	}

	// 查看机构的全部班级的报告
	async adminGetReport(organizationId, days) {
		return await this.ctx.model.EvaluationUserReport.getClassAndEvalStatus(organizationId, days)
	}

	// 管理员查看班级报告
	async adminGetClassReport(classId, days) {
		return await this.ctx.model.EvaluationUserReport.getTeacherCommentStatistics(classId, days);
	}
}

module.exports = EvalReportService;