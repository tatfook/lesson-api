
"use strict";

const Service = require("../common/service.js");
const Err = require("../common/err");


class EvalReportService extends Service {

	async createEvalReport({ userId, name, type, classId }) {
		return await this.ctx.model.EvaluationReport.create({ userId, name, type, classId });
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
				this.ctx.model.EvaluationUserReport.destroy({ where: { reportId: id }, transaction })
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

	async getUserReportList({ reportId, status }) {
		const list = await this.ctx.model.EvaluationUserReport.getUserReportList(reportId, status);
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
	async getUserReportDetail(userReportId, studentId) {

		const [
			userRepo,
			classmatesAvgStar,
			classmatesHistoryAvgStar,
			userSumStar,
			userHistoryStar,
			classmatesHistoryAvgStar2
		] = await Promise.all([
			this.getUserReportAndOrgInfo(userReportId),
			this.ctx.model.EvaluationUserReport.getClassmatesAvgStarById(userReportId), // 本班同学本次点评的平均能力值
			this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStar(studentId), // 本班同学历次能力值总和的平均值
			this.ctx.model.EvaluationUserReport.getUserSumStar(studentId), // 获取学生历次能力值总和
			this.ctx.model.EvaluationUserReport.getUserHistoryStar(studentId), // 获取学生历次成长
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
}

module.exports = EvalReportService;
