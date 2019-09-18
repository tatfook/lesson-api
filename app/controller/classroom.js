
const _ = require("lodash");
const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

const { CLASSROOM_STATE_USING } = consts;
const Err = require("../core/err");

class ClassroomsController extends Controller {
	async ensureTeacher() {
		this.enauthenticated();
	}

	async index() {
		const { ctx } = this;
		const query = ctx.query || {};

		this.enauthenticated();
		const userId = this.getUser().userId;
		query.userId = userId;

		const data = await this.ctx.service.classroom.findAndCount(query);

		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const data = await this.ctx.service.classroom.getByCondition({ id });

		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async create() {
		const { ctx } = this;
		const { userId, username, organizationId } = this.enauthenticated();
		const params = { ...ctx.request.body, userId, username, organizationId };

		ctx.validate({
			packageId: "int",
			lessonId: "int",
		});

		const data = await this.ctx.service.classroom.checkAndCreateClassroom(params);

		if (data.errMsg)
			return ctx.helper.fail({ ctx, status: 400, errMsg: data.errMsg });
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async update() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		const userId = this.getUser().userId;
		params.userId = userId;

		const data = await this.ctx.service.classroom.updateClassroom(params, id, userId);

		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async valid() {
		const { ctx } = this;
		const { key } = this.validate({ key: "string" });

		let data = await ctx.service.classroom.getByCondition({ key });
		if (!data)
			return ctx.helper.success({ ctx, status: 200, res: false });

		data = data.state & CLASSROOM_STATE_USING ? true : false;
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async getByKey() {
		const { ctx } = this;
		const { key } = this.validate({ key: "string" });
		const classroom = await this.ctx.service.classroom.getByCondition({ key });
		if (!classroom)
			return this.ctx.helper.fail({ ctx, status: 400, errMsg: Err.CLASSROOM_NOT_EXISTS });

		return this.ctx.helper.success({ ctx, status: 200, res: classroom });
	}

	async join() {
		const { ctx } = this;
		let params = this.validate({ key: "string" });
		const { userId = 0, organizationId, username } = this.getUser();
		params = { ...params, userId, organizationId, username };

		const data = await this.ctx.service.classroom.joinClassroom(params);

		if (data.errMsg)
			return ctx.helper.fail({ ctx, status: 400, errMsg: data.errMsg });
		return this.ctx.helper.success({ ctx, status: 200, res: data });
	}

	async quit() {
		const { ctx } = this;
		const { userId, username } = this.enauthenticated();

		await this.ctx.service.classroom.quitClassroom(userId, username);

		return this.ctx.helper.success({ ctx, status: 200, res: "ok" });
	}

	async current() {
		const { ctx } = this;
		this.enauthenticated();
		const userId = this.getUser().userId;

		const data = await ctx.service.classroom.currentClassroom(userId);

		if (data.errMsg)
			return ctx.helper.fail({ ctx, status: 400, errMsg: data.errMsg });
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async getLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		this.enauthenticated();

		const list = await ctx.service.learnRecord.getAllByCondition({ classroomId: id });

		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	// 创建课堂学习记录
	async createLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		const params = ctx.request.body;
		if (!params.userId) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		await this.ensureTeacher();
		const userId = this.getUser().userId;

		const classroom = await ctx.service.classroom.getByCondition({ id, userId });
		if (!classroom) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		params.classroomId = id;
		params.packageId = classroom.packageId;
		params.lessonId = classroom.lessonId;

		const lr = await ctx.service.learnRecord.createLearnRecord(params);

		return ctx.helper.success({ ctx, status: 200, res: lr });
	}

	// 更新课堂学习记录
	async updateLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		await this.ensureTeacher();
		const userId = this.getUser().userId;

		const classroom = await ctx.service.classroom.getByCondition({ id, userId });
		if (!classroom) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		const params = ctx.request.body;
		const learnRecords = _.isArray(params) ? params : [params];

		await ctx.service.learnRecord.batchUpdateLearnRecord(learnRecords, id);

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	// 下课
	async dismiss() {
		const { ctx } = this;
		const { userId, username } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });

		const result = await ctx.service.classroom.dismiss(userId, id, username);
		return ctx.helper.success({ ctx, status: 200, res: result });
	}
}

module.exports = ClassroomsController;
