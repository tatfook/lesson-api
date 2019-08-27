const _ = require("lodash");
const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");
//const Controller = require("egg").Controller;

const {
	PACKAGE_STATE_UNAUDIT,
	PACKAGE_STATE_AUDITING,
	PACKAGE_STATE_AUDIT_SUCCESS,
	PACKAGE_SUBSCRIBE_STATE_BUY
} = consts;

class PackagesController extends Controller {
	async search() {
		const {ctx} = this;
		const query = ctx.query || {};

		if (query.state == undefined) query.state = PACKAGE_STATE_AUDIT_SUCCESS;

		const data = await ctx.model.Packages.findAndCount({...this.queryOptions, where:query});
		//const data = await ctx.model.Packages.findAndCount({where:query});
		const list = data.rows;
		for (let i = 0; i < list.length; i++) {
			let pack = list[i].get ? list[i].get({plain:true}) : list[i];
			pack.lessons = await ctx.model.Packages.lessons(pack.id);
			list[i] = pack;
		}

		return this.success(data);
	}
	
	// get
	async index() {
		const {ctx} = this;
		const query = ctx.query || {};
		//if (query.state == undefined) query.state = PACKAGE_STATE_AUDIT_SUCCESS;

		this.enauthenticated();
		const userId = this.getUser().userId;
		query.userId = userId;

		const result = await ctx.model.Packages.findAndCount({where:query});

		return this.success(result);
	}

	// 获取单一课程包
	async show() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const data = await ctx.model.Packages.getById(id);

		return this.success(data);
	}

	// 获取课程详情
	async detail() {
		const {ctx} = this;
		const userId = this.getUser().userId;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		let data = await ctx.model.Packages.getById(id);
		if (!data) ctx.throw(400, "args errors");

		data.lessons = await ctx.model.Packages.lessons(id);
		data.learnedLessons = [];
		data.teachedLessons = [];
		if (!userId) return this.success(data);

		for (let i = 0; i < data.lessons.length; i++) {
			let lesson = data.lessons[i];
			let isLearned = await ctx.model.LearnRecords.isLearned(userId, id, lesson.id);
			if (isLearned) data.learnedLessons.push(lesson.id);
			let isTeached = await ctx.model.Classrooms.isTeached(userId, id, lesson.id);
			if (isTeached) data.teachedLessons.push(lesson.id);
		}

		const subscribe = await this.model.Subscribes.findOne({where:{userId, packageId:id}}).then(o => o && o.toJSON());
		data.isSubscribe = subscribe ? true : false;
		data.isBuy = (subscribe && subscribe.state == PACKAGE_SUBSCRIBE_STATE_BUY) ? true : false;

		return this.success(data);
	}

	// 创建课程包
	async create() {
		const {ctx} = this;
		const params = ctx.request.body;
		const lessons = params.lessons;

		this.enauthenticated();
		const userId = this.getUser().userId;
		params.userId = userId;
		params.coin = (params.rmb || 0) * 10;
		params.state = 0;

		//console.log(params);
		let pack = await ctx.model.Packages.create(params);
		if (!pack) ctx.throw("500", "DB failed");
		pack = pack.get({plain:true});
		const id = pack.id;
		const records = [];
		if (!lessons || !_.isArray(lessons)) return this.success(pack);
		for (let i = 0; i < lessons.length; i++) {
			let lessonId = lessons[i];
			records.push({userId, packageId: id, lessonId, extra: {lessonNo: i + 1}});
		}
		if (records.length > 0){
			await ctx.model.PackageLessons.bulkCreate(records);
		}

		//await ctx.model.Packages.audit(pack.id, userId, pack.state);
		await this.model.Subscribes.upsert({userId, packageId:pack.id});

		this.success(pack);
	}
	
	async update() {
		const {ctx} = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;
		
		if (params.rmb != undefined) params.coin = params.rmb * 10;
		delete params.state;

		const result = await ctx.model.Packages.update(params, {where:{id}});
		const lessons = params.lessons;
		if (!lessons || !_.isArray(lessons)) return this.success(result);

		const records = [];
		for (let i = 0; i < lessons.length; i++) {
			let lessonId = lessons[i];
			records.push({userId, packageId: id, lessonId, extra: {lessonNo: i + 1}});
		}
		if (records.length > 0){
			await ctx.model.PackageLessons.destroy({where:{packageId:id}});
			await ctx.model.PackageLessons.bulkCreate(records);
		}

		//await ctx.model.Packages.audit(id, userId, params.state);

		return this.success(result);
	}

	async destroy() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await ctx.model.Packages.destroy({where:{id, userId}});

		await ctx.model.PackageLessons.destroy({where:{packageId:id, userId}});
		await ctx.keepworkModel.lessonOrganizationPackages.destroy({where:{packageId:id}});

		return this.success(result);
	}

	async applyAudit() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();

		const data = await ctx.model.Packages.getById(id);
		if (!data) ctx.throw(400, "not found");

		data.state = PACKAGE_STATE_AUDITING;

		const result = await ctx.model.Packages.update(data, {where:{id}});

		return this.success(result);
	}

	async audit() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		ctx.validate({
			//state: [PACKAGE_STATE_UNAUDIT, PACKAGE_STATE_AUDITING, PACKAGE_STATE_AUDIT_SUCCESS],
			state: [PACKAGE_STATE_UNAUDIT, PACKAGE_STATE_AUDITING],
		}, params);

		const {userId} = this.enauthenticated();

		const data = ctx.model.Packages.getById(id, userId);
		if (!data) ctx.throw(400, "not found");

		const result = await ctx.model.Packages.update({state:params.state}, {where:{id}});

		//await ctx.model.Packages.audit(id, userId, params.state);

		return this.success(result);
	}

	async subscribePackage(userId, packageId, amount = {rmb:0, coin: 0, bean:0}) {
		const data = await this.model.Subscribes.findOne({where: {userId, packageId,	state: PACKAGE_SUBSCRIBE_STATE_BUY}});
		if (data) this.throw(400, "已订阅");

		const _package = await this.model.Packages.getById(packageId);
		if (!_package) return this.throw(400, "课程包不存在");
		if (_package.userId == userId) return this.throw(400, "用户不能购买自己的课程包");

		const rmb = amount.rmb || 0;
		const coin = amount.coin || 0;
		if (rmb !== _package.rmb && coin !== _package.coin) return this.throw(400, "金额错误");
		const lockCoin = _package.rmb;

		// 购买成功  增加待解锁知识币 
		await this.app.keepworkModel.accounts.increment({lockCoin}, {where:{userId}});
		await this.model.Subscribes.upsert({userId, packageId, state: PACKAGE_SUBSCRIBE_STATE_BUY});

		return;
	}

	// 课程包订阅
	async subscribe() {
		const {id} = this.validate({id:"int"});
		const {userId} = this.enauthenticated();
		const packageId = id;

		const _package = await this.model.Packages.getById(packageId);
		if (!_package) return this.throw(400, "课程包不存在");
		if (_package.userId == userId) return this.throw(400, "用户不能购买自己的课程包");
		
		const isTeacher = await this.model.teachers.isAllowTeach(userId);
		const isFree = (_package.rmb || _package.coin) ? false : true;
		if (!isTeacher && !isFree) this.throw(400, "不支持购买");

		await this.model.Subscribes.upsert({userId, packageId});
		
		return this.success("OK");
	}
	
	// 课程包订阅  购买
	async buy() {
		const sigcontent = this.ctx.headers["x-keepwork-sigcontent"];
		const signature = this.ctx.headers["x-keepwork-signature"];
		if (!sigcontent || !signature || sigcontent !== this.app.util.rsaDecrypt(this.app.config.self.rsa.publicKey, signature)) return this.throw(400, "未知请求");

		const params = this.validate({
			packageId:"int",
			userId:"int",
		});
		const packageId = params.packageId;
		const userId = params.userId;
		const amount = params.amount || {};

		await this.subscribePackage(userId, packageId, amount);

		return this.success("OK");
	}

	async isSubscribe() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await ctx.model.Subscribes.isSubscribePackage(userId, id);

		return this.success(result);
	}

	async hots() {
		const {ctx} = this;

		const list = await ctx.model.PackageSorts.getHots();
		for (let i = 0; i < list.length; i++) {
			let pack = list[i].get ? list[i].get({plain:true}) : list[i];
			pack.lessons = await ctx.model.Packages.lessons(pack.id);
			list[i] = pack;
		}

		return this.success(list);
	}

	async teach() {
		const {ctx} = this;
		const {userId} = this.enauthenticated();
		let packages = [];
		// 获取自己创建的课程包
		//let packages = await ctx.model.Packages.findAll({where:{userId, state:PACKAGE_STATE_AUDIT_SUCCESS}});
		// 获取购买的课程包
		const subscribes = await ctx.model.Subscribes.getPackagesByUserId(userId);
		
		packages = _.uniqBy(packages.concat(subscribes), "id");

		//console.log(packages.length);
		const packageIds = [];
		for (let i = 0; i < packages.length; i++) {
			let pack = packages[i];
			pack = pack.get ? pack.get({plain:true}) : pack;
			pack.joinAt = pack.joinAt || pack.createdAt;
			let obj = await ctx.model.Classrooms.getLastTeach(userId, pack.id);
			//console.log(obj);
			pack.lastTeachDate = obj ? obj.createdAt : "";
			packageIds.push(pack.id);
			packages[i] = pack;
		}

		const lessonCount = await ctx.model.PackageLessons.getLessonCountByPackageIds(packageIds);
		_.each(packages, (o, i) => o.lessonCount = lessonCount[o.id]);

		packages = _.orderBy(packages, ["lastTeachDate", "createdAt"], ["desc", "desc"]);

		return this.success(packages);
	}
	
	// 获取课程列表
	async lessons() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		
		const list = await ctx.model.Packages.lessons(id);

		return this.success(list);
	}

	async addLesson() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.request.body;
		ctx.validate({
			lessonId: "int",
		});

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await this.ctx.model.Packages.addLesson(userId, id, params.lessonId, params.lessonNo);
		return this.success(result);
	}

	async putLesson() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.request.body;
		ctx.validate({
			lessonId: "int",
		});

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await this.ctx.model.Packages.putLesson(userId, id, params.lessonId, params.lessonNo);
		return this.success(result);
	}

	async deleteLesson() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.query || {};
		const lessonId = params.lessonId && _.toNumber(params.lessonId);
		if (!lessonId) ctx.throw(401, "args error");

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await this.ctx.model.Packages.deleteLesson(userId, id, lessonId);
		return this.success(result);

	}

}

module.exports = PackagesController;
