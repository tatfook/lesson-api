"use strict";

const _ = require("lodash");
const moment = require("moment");
const consts = require("../common/consts.js");
const Controller = require("./baseController.js");
const Err = require("../common/err");
const { CLASS_MEMBER_ROLE_TEACHER } = consts;
const {
	createReport, updateReport, reportList, reportToParent,
	createUserReport, reportDetailList, userReportDetail,
	updateUserReport, sendSms, verifyCode, updateUserInfo,
	updateParentNum, updateParentNum2, evaluationStatistics,
	adminGetReport
} = require("../common/validatorRules/evaluationReport");

const commentedStatus = 2;
// 评估报告
class EvalReportController extends Controller {
	// 发起点评,teacher only
	async create() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const { name, type, classId } = ctx.request.body;

		this.validateCgi({ name, type, classId }, createReport);

		const member = await ctx.service.lessonOrganizationClassMember.getByCondition({ classId, memberId: userId });
		if (!member || !(member.roleId & CLASS_MEMBER_ROLE_TEACHER)) return ctx.throw(403, Err.AUTH_ERR);

		const ret = await ctx.service.evaluationReport.createEvalReport({ userId, name, type, classId });
		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 报告列表【就是创建的点评列表】,admin && teacher
	async index() {
		const { ctx } = this;
		this.enauthenticated();
		const { name, type, classId, roleId } = ctx.request.query;

		this.validateCgi({ classId }, reportList);
		if (!["2", "64"].includes(roleId)) {
			ctx.throw(403, Err.AUTH_ERR);
		}

		const list = await ctx.service.evaluationReport.getReportList({ roleId, classId, name, type });

		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	// 删除发起的点评 teacher only
	async destroy() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		// 自己发起的点评才能删除
		const repo = await ctx.service.evaluationReport.getReportByCondition({ id });
		if (!repo) ctx.throw(400, Err.REPORT_ID_ERR);
		if (repo.userId !== userId) ctx.throw(403, Err.AUTH_ERR);

		await ctx.service.evaluationReport.destroyReportById(id);
		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 点评详情列表 teacher only
	async show() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		/** status 1.待点评，2.已点评, isSend 0.未发送，1.已发送，realname名字过滤 */
		const { status, isSend = undefined, realname = undefined } = ctx.request.query;
		this.validateCgi({ status }, reportDetailList);

		// 自己发起的点评才能查看详情列表
		const repo = await ctx.service.evaluationReport.getReportByCondition({ id });
		if (!repo) ctx.throw(400, Err.REPORT_ID_ERR);
		if (repo.userId !== userId) ctx.throw(403, Err.AUTH_ERR);

		const list = await ctx.service.evaluationReport.getUserReportList({ reportId: id, status, isSend, realname });
		if (~~status === commentedStatus) {
			list.forEach(r => {
				r.createdAt = moment(r.createdAt).format("YYYY-MM-DD HH:mm:ss");
			});
		}

		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	// 修改发起的点评
	async update() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		const { name, type } = ctx.request.body;
		this.validateCgi({ name, type }, updateReport);

		// 自己发起的点评才能修改
		const repo = await ctx.service.evaluationReport.getReportByCondition({ id });
		if (!repo) ctx.throw(400, Err.REPORT_ID_ERR);
		if (repo.userId !== userId) ctx.throw(403, Err.AUTH_ERR);

		await ctx.service.evaluationReport.updateEvalReport({
			name, type, updatedAt: moment().format("YYYY-MM-DD HH:mm:ss")
		}, { id });

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 点评学生 teacher only
	async createUserReport() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();

		const {
			studentId, reportId, star, spatial, collaborative,
			creative, logical, compute, coordinate, comment, mediaUrl = []
		} = ctx.request.body;

		this.validateCgi({
			studentId, reportId, star, spatial, collaborative,
			creative, logical, compute, coordinate, comment, mediaUrl
		}, createUserReport);

		// 自己发起的点评才能点评学生
		const repo = await ctx.service.evaluationReport.getReportByCondition({ id: reportId });
		if (!repo) ctx.throw(400, Err.REPORT_ID_ERR);
		if (repo.userId !== userId) ctx.throw(403, Err.AUTH_ERR);

		const [member, userReport] = await Promise.all([
			// 检查这个studentId在不在这个班级做学生
			ctx.service.lessonOrganizationClassMember.getByCondition({
				classId: repo.classId,
				memberId: studentId,
				roleId: { "$in": [1, 3, 65, 67] }
			}),
			// 不能重复点评
			ctx.service.evaluationReport.getUserReportByCondition({ userId: studentId, reportId })
		]);
		if (!member) ctx.throw(403, Err.USER_NOT_STUDENT_IN_CLASS);
		if (userReport) ctx.throw(400, Err.CANT_COMMENT_AGAIN);

		const ret = await ctx.service.evaluationReport.createUserReport({
			userId: studentId, reportId, star, spatial, collaborative,
			creative, logical, compute, coordinate, comment, mediaUrl
		});

		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 删除对学生的点评 teacher only
	async destroyUserReport() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		// 自己写的点评才能删除
		const teacherId = await this.ctx.service.evaluationReport.getTeacherByUserReportId(id);
		if (teacherId !== userId) ctx.throw(403, Err.AUTH_ERR);

		await ctx.service.evaluationReport.destroyUserReportByCondition({ id });
		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 学生获得的点评详情 teacher parent
	async getUserReportDetail() {
		const { ctx } = this;
		// const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		const { studentId, classId, type } = ctx.request.query;
		this.validateCgi({
			studentId, classId, type
		}, userReportDetail);

		// 自己写的点评才能查看详情，学生那儿看到的是历次统计
		// const teacherId = await this.ctx.service.evaluationReport.getTeacherByUserReportId(id);
		// if (teacherId !== userId) ctx.throw(403, Err.AUTH_ERR);

		const ret = await ctx.service.evaluationReport.getUserReportDetail(id, studentId, classId, type);
		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 修改对学生的点评
	async updateUserReport() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ARGS_ERR);

		const {
			star, spatial, collaborative,
			creative, logical, compute, coordinate, comment, mediaUrl = []
		} = ctx.request.body;

		this.validateCgi({
			userReportId: id, star, spatial, collaborative,
			creative, logical, compute, coordinate, comment, mediaUrl
		}, updateUserReport);

		// 自己写的点评才能修改
		const teacherId = await this.ctx.service.evaluationReport.getTeacherByUserReportId(id);
		if (teacherId !== userId) ctx.throw(403, Err.AUTH_ERR);

		await ctx.service.evaluationReport.updateUserReportByCondition({
			star, spatial, collaborative, updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
			creative, logical, compute, coordinate, comment, mediaUrl
		}, { id });

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 发送短信验证码
	async sendSms() {
		const { ctx } = this;
		this.enauthenticated();

		const { cellphone } = ctx.request.body;
		this.validateCgi({ cellphone }, sendSms);

		const env = this.app.config.self.env;
		const code = env === "unittest" ? "123456" : _.times(6, () => _.random(0, 9, false)).join("");

		const check = await this.app.redis.get(`verifCode:${cellphone}`);
		if (check) ctx.throw(400, Err.DONT_SEND_REPEAT);

		await this.app.redis.set(`verifCode:${cellphone}`, code, "EX", 60 * 3);
		if (env !== "unittest") {
			const res = await this.app.sendSms(cellphone, [code, "3分钟"]);
			if (!res) {
				await this.app.redis.del(`verifCode:${cellphone}`);
				ctx.throw(400, Err.SENDSMS_ERR);
			}
		}

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 校验验证码
	async verifyCode() {
		const { ctx } = this;
		this.enauthenticated();

		const { cellphone, verifCode } = ctx.request.body;
		this.validateCgi({ cellphone, verifCode }, verifyCode);

		const check = await this.app.redis.get(`verifCode:${cellphone}`);

		return ctx.helper.success({ ctx, status: 200, res: check === verifCode });
	}

	// 修改keepwork头像，在机构中的realname和家长手机号【也可不传parentPhoneNum, verifCode】
	async updateUserInfo() {
		const { ctx } = this;
		const { userId, organizationId } = this.enauthenticated();

		const { portrait, realname, parentPhoneNum = undefined, verifCode = undefined } = ctx.request.body;

		this.validateCgi({ portrait, realname }, updateUserInfo);

		if (parentPhoneNum) {
			this.validateCgi({ parentPhoneNum, verifCode }, updateParentNum);
			const check = await this.app.redis.get(`verifCode:${parentPhoneNum}`);
			if (check !== verifCode) ctx.throw(400, Err.VERIFCODE_ERR);
		}

		await ctx.service.evaluationReport.updatePortraitRealNameParentNum({
			portrait, realname, parentPhoneNum, userId, organizationId
		});

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 获取用户信息，keepwork头像，机构中的realname,和家长手机号
	async getUserInfo() {
		const { ctx } = this;
		const { userId, organizationId } = this.enauthenticated();
		const { studentId } = ctx.request.query;// 老师获取学生的信息，传该参数
		// 检查师生身份
		if (studentId) {
			const check = await ctx.service.evaluationReport.checkTeacherRole(userId, organizationId, studentId);
			if (!check) ctx.throw(403, Err.AUTH_ERR);
		}

		const ret = await ctx.service.evaluationReport.getPortraitRealNameParentNum(studentId ? studentId : userId, organizationId);

		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 修改家长手机号【第二步】
	async updateParentphonenum() {
		const { ctx } = this;
		const { userId, organizationId } = this.enauthenticated();

		const { parentPhoneNum, verifCode, newParentPhoneNum, newVerifCode } = ctx.request.body;
		this.validateCgi({ parentPhoneNum, verifCode, newParentPhoneNum, newVerifCode }, updateParentNum2);

		const [check1, check2] = await Promise.all([
			this.app.redis.get(`verifCode:${parentPhoneNum}`),
			this.app.redis.get(`verifCode:${newParentPhoneNum}`)
		]);
		if (check1 !== verifCode || check2 !== newVerifCode) ctx.throw(400, Err.VERIFCODE_ERR);

		await ctx.service.evaluationReport.updateParentphonenum(userId, organizationId, newParentPhoneNum);

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 我的评估报告-数据统计,本班所有任课老师对该学生的点评数据分析
	async evaluationStatistics() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const { classId } = ctx.request.query;
		this.validateCgi({ classId }, evaluationStatistics);

		const ret = await ctx.service.evaluationReport.getUserReportStatisticsInClass(classId, userId);

		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 我的评估报告-历次点评列表
	async getEvaluationCommentList() {
		const { ctx } = this;
		const { userId } = this.enauthenticated();
		const { classId } = ctx.request.query;
		this.validateCgi({ classId }, evaluationStatistics);

		const list = await ctx.service.evaluationReport.getEvaluationCommentList(classId, userId);
		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	// 发送给家长
	async reportToParent() {
		const { ctx } = this;
		this.enauthenticated();
		// dataArr 结构：[{baseUrl,reportName,studentId,realname, orgName,star,classId, type, userReportId,parentPhoneNum}]
		let { dataArr } = ctx.request.body;
		dataArr = typeof dataArr === "string" ? JSON.parse(dataArr) : dataArr;

		for (let i = 0; i < dataArr.length; i++) {
			const element = dataArr[i];
			this.validateCgi(element, reportToParent);
			element.star = element.star > 3 ? "棒极了" : "还不错";
		}

		const ret = await ctx.service.evaluationReport.reportToParent(dataArr);
		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 管理员查看报告
	async adminGetReport() {
		const { ctx } = this;
		const { organizationId } = this.enauthenticated();
		const { days } = ctx.request.query;

		if (days) this.validateCgi({ days }, adminGetReport);

		const ret = await ctx.service.evaluationReport.adminGetReport(organizationId, days);
		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

	// 管理员查看班级报告
	async getClassReport() {
		const { ctx } = this;
		this.enauthenticated();
		const { classId, days } = ctx.request.query;
		this.validateCgi({ classId }, evaluationStatistics);

		const ret = await ctx.service.evaluationReport.adminGetClassReport(classId, days);
		return ctx.helper.success({ ctx, status: 200, res: ret });
	}

}

module.exports = EvalReportController;