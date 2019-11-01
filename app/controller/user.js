"use strict";

const _ = require("lodash");
const jwt = require("jwt-simple");
const consts = require("../common/consts.js");
const Controller = require("./baseController.js");
const Err = require("../common/err");

const {
	USER_ROLE_ALLIANCE_MEMBER,
	USER_ROLE_TUTOR,
} = consts;

const {
	sendSms, verifyCode, updateUserInfo,
	updateParentNum, updateParentNum2
} = require("../common/validatorRules/evaluationReport");

const ONEYEAR = 1000 * 3600 * 24 * 365;

class UsersController extends Controller {
	token() {
		const env = this.app.config.env;
		this.enauthenticated();
		const user = this.currentUser();
		user.exp = Date.now() / 1000 + (env === "prod" ? 3600 * 24 * 1000 : 3600 * 24);
		const token = jwt.encode(user, this.app.config.self.secret);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: token });
	}

	tokeninfo() {
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: this.enauthenticated() });
	}

	// 获取当前用户  不存在则创建
	async index() {
		const { ctx } = this;
		this.enauthenticated();
		const user = this.currentUser();

		const data = await this.ctx.service.user.getCurrentUser(user);

		return this.ctx.helper.success({ ctx, status: 200, res: data });
	}

	// 获取用户信息
	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const data = await ctx.service.user.getCurrentUser({ userId: id });

		return this.ctx.helper.success({ ctx, status: 200, res: data });
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
			const res = await ctx.service.user.sendSms(cellphone, [code, "3分钟"]);
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

	// 获取用户信息，keepwork头像，机构中的realname,和家长手机号
	async getUserInfo() {
		const { ctx } = this;
		const { userId, organizationId } = this.enauthenticated();
		const { studentId } = ctx.request.query;// 老师获取学生的信息，传该参数
		// 检查师生身份
		if (studentId) {
			const check = await ctx.service.user.checkTeacherRole(userId, organizationId, studentId);
			if (!check) ctx.throw(403, Err.AUTH_ERR);
		}

		const ret = await ctx.service.user.getPortraitRealNameParentNum(studentId ? studentId : userId, organizationId);

		return ctx.helper.success({ ctx, status: 200, res: ret });
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

		await ctx.service.user.updatePortraitRealNameParentNum({
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

		await ctx.service.user.updateParentphonenum(userId, organizationId, newParentPhoneNum);

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	async create() {
		const { ctx } = this;
		this.enauthenticated();
		const user = this.currentUser();

		const data = await ctx.service.user.getByIdOrCreate(user.userId, user.username);

		return this.ctx.helper.success({ ctx, status: 200, res: data });
	}

	async update() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		if (~~id !== userId) ctx.throw(400, Err.ARGS_ERR);

		const params = ctx.request.body;

		delete params.lockCoin;
		delete params.coin;
		delete params.bean;
		delete params.identify;
		delete params.username;

		const result = await ctx.service.user.updateUserByCondition(params, { id });

		return this.ctx.helper.success({ ctx, status: 200, res: result });
	}

	// 申请成老师
	async applyTeacher() {
		// 发送key email  使用memory 防止一个key 给了多个用户
		// 动态生成key
		//
		this.success("未实现, 空接口");
	}

	// 成为老师 废弃
	async teacher() {
		const { ctx } = this;
		const { id, key, school } = this.validate({
			id: "int",
			key: "string",
			school: "string_optional"
		});

		const result = await ctx.service.user.becomeTeacher(id, key, school);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	// 是否允许教课
	async isTeach() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const ok = await ctx.service.teacher.isAllowTeach(id);

		return ctx.helper.success({ ctx, status: 200, res: ok });
	}

	// 用户课程包
	async getSubscribes() {
		const { id, packageState } = this.validate({
			id: "int",
			packageState: "int_optional",
		});

		const list = await this.ctx.service.subscribe.getByUserId(id, packageState);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
	}

	async isSubscribe() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.query;
		if (!id) ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;
		if (~~id !== userId) ctx.throw(400, Err.ARGS_ERR);

		const packageId = params.packageId && _.toNumber(params.packageId);
		if (!packageId) ctx.throw(400, Err.ARGS_ERR);

		const result = await ctx.service.subscribe.getByCondition({ userId, packageId });

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: result ? true : false });
	}

	// 获取知识币变更列表
	async coins() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;
		if (~~id !== userId) ctx.throw(400, Err.ARGS_ERR);

		const list = await ctx.service.coin.getAllByCondition({ userId });
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
	}

	// 获取用户已学习的技能列表
	async skills() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const list = await ctx.service.learnRecord.getSkills(id);

		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	// 用户花费知识币和知识豆
	async expense() {
		const { userId } = this.enauthenticated();
		const { coin, bean, description } = this.validate({
			coin: "int_optional", bean: "int_optional", description: "string_optional"
		});

		await this.ctx.service.user.expense(userId, { coin, bean, description });

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 导师服务回调 废弃
	async tutorServiceCB() {
		const sigcontent = this.ctx.headers["x-keepwork-sigcontent"];
		const signature = this.ctx.headers["x-keepwork-signature"];
		if (!sigcontent || !signature || sigcontent !== this.ctx.helper.rsaDecrypt(
			this.app.config.self.rsa.publicKey, signature)
		) return this.ctx.throw(400, Err.UNKNOWN_REQ);

		const params = this.validate({ userId: "int" });
		const userId = params.userId;
		const amount = params.amount || { rmb: 0, coin: 0, bean: 0 };
		const tutorId = params.tutorId;

		if (~~amount.rmb !== 3000) return this.throw(400, "导师金额不对");

		const tutor = await this.model.Tutor.getByUserId(userId) || { userId, tutorId };
		const curtitme = new Date().getTime();


		if (tutor.endTime <= curtitme) {
			tutor.startTime = curtitme;
			tutor.endTime = curtitme + ONEYEAR;
		} else {
			tutor.startTime = tutor.startTime || curtitme;
			tutor.endTime = (tutor.endTime || curtitme) + ONEYEAR;
		}

		await this.model.Tutor.upsert(tutor);

		return this.success("OK");
	}
}

module.exports = UsersController;
