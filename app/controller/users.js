
const _ = require("lodash");
const jwt = require("jwt-simple");
const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

const {
	USER_IDENTIFY_TEACHER,
	USER_IDENTIFY_APPLY_TEACHER,

	USER_ROLE_ALLIANCE_MEMBER,
	USER_ROLE_TUTOR,

	TEACHER_PRIVILEGE_TEACH,

	TRADE_TYPE_BEAN,
	TRADE_TYPE_COIN,
} = consts;

const ONEYEAR = 1000 * 3600 * 24 * 365;

class UsersController extends Controller {
	token() {
		const env = this.app.config.env;
		this.enauthenticated();
		const user = this.getUser();
		user.exp = Date.now() / 1000 + (env === "prod" ? 3600 * 24 * 1000 : 3600 * 24);
		const token = jwt.encode(user, this.app.config.self.secret);

		return this.success(token);
	}

	tokeninfo() {
		return this.success(this.enauthenticated());
	}

	// 获取当前用户  不存在则创建
	async index() {
		const { ctx } = this;
		this.enauthenticated();
		const user = this.getUser();

		const data = await ctx.model.Users.getById(user.userId, user.username);
		if (!data) return this.throw(404, "用户不存在");

		const userId = user.userId;
		const account = await this.app.keepworkModel.accounts.getByUserId(userId) || {};
		data.rmb = account.rmb;
		data.coin = account.coin;
		data.bean = account.bean;
		data.tutorService = await this.model.tutors.getByUserId(user.userId);
		data.teacher = await this.model.teachers.getByUserId(userId);
		data.allianceMember = await this.app.keepworkModel.roles.getAllianceMemberByUserId(userId);
		data.tutor = await this.app.keepworkModel.roles.getTutorByUserId(userId);

		return this.success(data);
	}

	// 获取用户信息
	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const data = await ctx.model.Users.getById(id);
		if (!data) return this.throw(404, "用户不存在");

		const userId = id;
		const account = await this.app.keepworkModel.accounts.getByUserId(userId) || {};
		data.rmb = account.rmb;
		data.coin = account.coin;
		data.bean = account.bean;

		data.tutorService = await this.model.tutors.getByUserId(userId);
		data.teacher = await this.model.teachers.getByUserId(userId);

		data.allianceMember = await this.app.keepworkModel.roles.getAllianceMemberByUserId(userId);
		data.tutor = await this.app.keepworkModel.roles.getTutorByUserId(userId);

		return this.success(data);
	}

	async create() {
		const { ctx } = this;
		this.enauthenticated();
		const user = this.getUser();

		const data = await ctx.model.Users.getById(user.userId, user.username);

		return this.success(data);
	}

	async update() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;

		if (~~id !== userId) ctx.throw(400, "args error");

		const params = ctx.request.body;

		delete params.lockCoin;
		delete params.coin;
		delete params.bean;
		delete params.identify;
		delete params.username;

		const result = await ctx.model.Users.update(params, { where: { id }});

		return this.success(result);
	}

	// 申请成老师
	async applyTeacher() {
		// 发送key email  使用memory 防止一个key 给了多个用户
		// 动态生成key
		//
		this.success("未实现, 空接口");
	}

	// 成为老师
	async teacher() {
		// const { ctx } = this;
		const { id, key, school } = this.validate({
			id: "int",
			key: "string",
			school: "string_optional"
		});

		const user = await this.model.Users.getById(id);
		if (!user) this.throw(400, "arg error");

		const isOk = await this.model.TeacherCDKeys.useKey(key, id);
		if (!isOk) this.throw(400, "key invalid");

		const cdKey = await this.model.TeacherCDKeys.findOne({ where: { key }}).then(o => o && o.toJSON());
		const startTime = new Date().getTime();

		user.identify = (user.identify | USER_IDENTIFY_TEACHER) & (~USER_IDENTIFY_APPLY_TEACHER);
		const teacher = await this.model.Teachers.findOne({
			where: { userId: id }
		})
			.then(o => o && o.toJSON())
			|| {
				userId: id, startTime, endTime: startTime,
				key, school, privilege: TEACHER_PRIVILEGE_TEACH
			};

		if (teacher.endTime < startTime) {
			teacher.endTime = teacher.startTime = startTime;
		}
		teacher.endTime += cdKey.expire;
		await this.model.Teachers.upsert(teacher);
		const result = await this.model.Users.update(user, { where: { id }});

		return this.success(result);
	}

	// 是否允许教课
	async isTeach() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const ok = await ctx.model.Teachers.isAllowTeach(id);

		return this.success(ok);
	}

	// 用户课程包
	async getSubscribes() {
		// const { userId } = this.enauthenticated();
		const { id, packageState } = this.validate({
			id: "int",
			packageState: "int_optional",
		});

		const list = await this.model.Subscribes.getByUserId(id, packageState);

		return this.success(list);
	}

	async isSubscribe() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.query;
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;
		if (~~id !== userId) ctx.throw(400, "args error");
		const packageId = params.packageId && _.toNumber(params.packageId);
		if (!packageId) ctx.throw(400, "args error");

		const result = await ctx.model.Subscribes.isSubscribePackage(userId, packageId);

		return this.success(result);
	}

	// // 用户订阅
	// async postSubscribes() {
	// const {ctx} = this;
	// const id = _.toNumber(ctx.params.id);
	// const params = ctx.request.body;
	// if (!id) ctx.throw(400, "id invalid");

	// this.enauthenticated();
	// const userId = this.getUser().userId;
	// if (id != userId) ctx.throw(400, "args error");

	// ctx.validate({
	// packageId: 'int',
	// }, params);

	// const packageId = params.packageId;
	// const result = await ctx.model.Subscribes.subscribePackage(userId, packageId);

	// if (result.id != 0) ctx.throw(400, result.message);

	// return this.success("OK");
	// }

	// 获取知识币变更列表
	async coins() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;
		if (~~id !== userId) ctx.throw(400, "args error");

		const list = await ctx.model.Coins.findAll({ where: { userId }});
		return this.success(list);
	}

	// 获取用户已学习的技能列表
	async skills() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const list = await ctx.model.UserLearnRecords.getSkills(id);

		this.success(list);
	}

	// 用户花费知识币和知识豆
	async expense() {
		const { userId } = this.enauthenticated();
		const { coin, bean, description } = this.validate({ coin: "int_optional", bean: "int_optional", description: "string_optional" });

		const user = await this.model.Users.getById(userId);
		if (!user) this.throw(400);
		if ((bean && bean > user.bean) || (coin && coin > user.coin)) this.throw(400, "余额不足");
		if (user.bean && bean && user.bean >= bean && bean > 0) {
			user.bean = user.bean - bean;
			await this.model.Trades.create({ userId, type: TRADE_TYPE_BEAN, amount: bean * -1, description });
		}
		if (user.coin && coin && user.coin >= coin && coin > 0) {
			user.coin = user.coin - coin;
			await this.model.Trades.create({ userId, type: TRADE_TYPE_COIN, amount: coin * -1, description });
		}

		await this.model.Users.update(user, { fields: ["coin", "bean"], where: { id: userId }});

		return this.success("OK");
	}

	// 导师服务回调
	async tutorServiceCB() {
		const sigcontent = this.ctx.headers["x-keepwork-sigcontent"];
		const signature = this.ctx.headers["x-keepwork-signature"];
		if (!sigcontent || !signature || sigcontent !== this.app.util.rsaDecrypt(this.app.config.self.rsa.publicKey, signature)) return this.throw(400, "未知请求");

		const params = this.validate({ userId: "int" });
		const userId = params.userId;
		const amount = params.amount || { rmb: 0, coin: 0, bean: 0 };
		const tutorId = params.tutorId;

		if (~~amount.rmb !== 3000) return this.throw(400, "导师金额不对");

		const tutor = await this.model.tutors.getByUserId(userId) || { userId, tutorId };
		const curtitme = new Date().getTime();


		if (tutor.endTime <= curtitme) {
			tutor.startTime = curtitme;
			tutor.endTime = curtitme + ONEYEAR;
		} else {
			tutor.startTime = tutor.startTime || curtitme;
			tutor.endTime = (tutor.endTime || curtitme) + ONEYEAR;
		}

		await this.model.tutors.upsert(tutor);

		return this.success("OK");
	}

	// 成为导师回调
	async tutorCB() {
		const sigcontent = this.ctx.headers["x-keepwork-sigcontent"];
		const signature = this.ctx.headers["x-keepwork-signature"];
		if (!sigcontent || !signature || sigcontent !== this.app.util.rsaDecrypt(this.app.config.self.rsa.publicKey, signature)) return this.throw(400, "未知请求");

		const params = this.validate({ userId: "int" });
		const userId = params.userId;
		const amount = params.amount || { rmb: 0, coin: 0, bean: 0 };
		if (amount.rmb != 100) return this.throw(400, "金额不对");

		const tutor = await this.app.keepworkModel.roles.getTutorByUserId(userId) || { userId, roleId: USER_ROLE_TUTOR };
		const curtitme = new Date().getTime();

		if (tutor.endTime <= curtitme) {
			tutor.startTime = curtitme;
			tutor.endTime = curtitme + ONEYEAR;
		} else {
			tutor.startTime = tutor.startTime || curtitme;
			tutor.endTime = (tutor.endTime || curtitme) + ONEYEAR;
		}

		await this.app.keepworkModel.roles.upsert(tutor);

		return this.success("OK");
	}

	// 共享会员
	async allianceMemberCB() {
		const sigcontent = this.ctx.headers["x-keepwork-sigcontent"];
		const signature = this.ctx.headers["x-keepwork-signature"];
		if (!sigcontent || !signature || sigcontent !== this.app.util.rsaDecrypt(this.app.config.self.rsa.publicKey, signature)) return this.throw(400, "未知请求");

		const params = this.validate({ userId: "int" });
		const userId = params.userId;
		const amount = params.amount || { rmb: 0, coin: 0, bean: 0 };
		if (amount.rmb != 100) return this.throw(400, "金额不对");

		const alliance = await this.app.keepworkModel.roles.getAllianceMemberByUserId(userId) || { userId, roleId: USER_ROLE_ALLIANCE_MEMBER };
		const curtitme = new Date().getTime();

		if (alliance.endTime <= curtitme) {
			alliance.startTime = curtitme;
			alliance.endTime = curtitme + ONEYEAR;
		} else {
			alliance.startTime = alliance.startTime || curtitme;
			alliance.endTime = (alliance.endTime || curtitme) + ONEYEAR;
		}

		await this.app.keepworkModel.roles.upsert(alliance);

		return this.success("OK");

	}
}

module.exports = UsersController;
