"use strict";

const _ = require("lodash");
const moment = require("moment");
const consts = require("../common/consts.js");
const Controller = require("./baseController.js");
const Err = require("../common/err");
const { CLASS_MEMBER_ROLE_TEACHER } = consts;
const {
	createReport, reportList,
	createUserReport, reportDetailList, userReportDetail,
	updateUserReport, sendSms, verifyCode, updateUserInfo,
	updateParentNum, updateParentNum2, evaluationStatistics
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

		const { status } = ctx.request.query;// 1.待点评，2.已点评
		this.validateCgi({ status }, reportDetailList);

		// 自己发起的点评才能查看详情列表
		const repo = await ctx.service.evaluationReport.getReportByCondition({ id });
		if (!repo) ctx.throw(400, Err.REPORT_ID_ERR);
		if (repo.userId !== userId) ctx.throw(403, Err.AUTH_ERR);

		const list = await ctx.service.evaluationReport.getUserReportList({ reportId: id, status });
		if (~~status === commentedStatus) {
			list.forEach(r => {
				r.createdAt = moment(r.createdAt).format("YYYY-MM-DD HH:mm:ss");
			});
		}

		return ctx.helper.success({ ctx, status: 200, res: list });
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
			star, spatial, collaborative,
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

		const code = _.times(6, () => _.random(0, 9, false)).join("");

		const check = await this.app.redis.get(`verifCode:${cellphone}`);
		if (check) ctx.throw(400, Err.DONT_SEND_REPEAT);

		await this.app.redis.set(`verifCode:${cellphone}`, code, "EX", 60 * 3);
		const res = await this.app.sendSms(cellphone, [code, "3分钟"]);
		if (!res) {
			await this.app.redis.del(`verifCode:${cellphone}`);
			ctx.throw(400, Err.SENDSMS_ERR);
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

		if (portrait && realname) {
			this.validateCgi({ portrait, realname }, updateUserInfo);
		}
		if (parentPhoneNum && verifCode) {
			this.validateCgi({ parentPhoneNum, verifCode }, updateParentNum);
			const check = await this.app.redis.get(`verifCode:${parentPhoneNum}`);
			if (check !== verifCode) ctx.throw(400, Err.VERIFCODE_ERR);
		}

		await ctx.service.evaluationReport.updatePortraitRealNameParentNum({
			portrait, realname, parentPhoneNum, userId, organizationId
		});

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
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
		const { userId, organizationId } = this.enauthenticated();
		const { classId } = ctx.request.query;
		this.validateCgi({ classId }, evaluationStatistics);


	}

}

module.exports = EvalReportController;