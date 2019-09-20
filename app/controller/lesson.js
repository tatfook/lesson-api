
const _ = require("lodash");

const consts = require("../common/consts.js");
const Controller = require("./baseController.js");
const Err = require("../common/err");

const { PACKAGE_STATE_AUDIT_SUCCESS } = consts;

class LessonsController extends Controller {
	async index() {
		const { ctx } = this;
		const query = ctx.query || {};
		const order = [["updatedAt", "DESC"]];

		this.enauthenticated();
		const userId = this.currentUser().userId;
		query.userId = userId;

		const data = await ctx.service.lesson.getLessonByPageAndSort(query, order);
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async detail() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		let data = await ctx.service.lesson.getByCondition({ id });
		if (!data) return ctx.throw(404, Err.NOT_FOUND);

		const [skills, packages] = await Promise.all([
			ctx.service.lessonSkill.getSkillsByLessonId(id),
			ctx.service.lesson.getPackagesByLessonId(id)
		]);

		data = { ...data, skills, packages };
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async detailByUrl() {
		const { ctx } = this;
		let { url } = this.validate({ url: "string" });
		url = decodeURIComponent(url);

		let data = await ctx.service.lesson.getByCondition({ url });
		if (!data) return ctx.throw(404, Err.NOT_FOUND);

		const id = data.id;

		const [skills, packages] = await Promise.all([
			ctx.service.lessonSkill.getSkillsByLessonId(id),
			ctx.service.lesson.getPackagesByLessonId(id)
		]);

		data = { ...data, skills, packages };
		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		const data = await ctx.service.lesson.getByCondition(id);

		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	async create() {
		const { ctx } = this;
		const params = ctx.request.body;

		this.enauthenticated();
		const userId = this.currentUser().userId;
		params.userId = userId;
		params.state = PACKAGE_STATE_AUDIT_SUCCESS;

		const lesson = await ctx.service.lesson.createLesson(params);

		return ctx.helper.success({ ctx, status: 200, res: lesson });
	}

	async update() {
		const { ctx } = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;
		delete params.state;// 不能改state
		params.userId = userId;

		const result = await ctx.service.lesson.updateLesson(params, id);
		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async destroy() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		await ctx.service.lesson.destroyLesson(id, userId);
		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	async getSkills() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);
		this.enauthenticated();

		const skills = await ctx.service.lesson.getSkillsAndSkillName(id);

		return ctx.helper.success({ ctx, status: 200, res: skills });
	}

	async addSkill() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);
		const params = ctx.request.body;

		ctx.validate({
			skillId: "int",
			score: {
				type: "int",
			}
		});

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const result = await ctx.service.lesson.addSkillScore(
			userId, id, params.skillId, params.score
		);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async deleteSkill() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		const params = ctx.query || {};
		const skillId = params.skillId && _.toNumber(params.skillId);
		if (!skillId) return ctx.throw(400, Err.ARGS_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const result = await ctx.service.lessonSkill.destroyByCondition({ userId, lessonId: id, skillId });

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async release() {
		const { ctx } = this;
		const params = this.validate({
			id: "number"
		});
		const id = params.id;
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const lesson = await ctx.service.lesson.getByCondition({ id, userId });
		if (!lesson) return ctx.throw(404, Err.NOT_FOUND);

		const result = await ctx.service.lessonContent.releaseLesson(
			userId, id, params.content || null, params.courseware || null
		);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async content() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);
		const params = ctx.query || {};

		const result = await ctx.service.lessonContent.getLessonContent(id, params.version);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	// 创建自己的学习记录
	async createLearnRecords() {
		const { ctx } = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		ctx.validate({
			packageId: "int",
		}, params);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		params.userId = userId;
		params.lessonId = id;

		const data = await ctx.service.learnRecord.createLearnRecord(params);

		return ctx.helper.success({ ctx, status: 200, res: data });
	}

	// 这个更新接口没有检查课堂是否结束，暴力更新【不知为何】
	async updateLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const params = ctx.request.body || {};
		if (!params.id) return ctx.throw(400, Err.ARGS_ERR);

		params.lessonId = id;
		params.userId = userId;

		const result = await ctx.service.learnRecord.adminUpdateLearnRecord(params);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async getLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const list = await ctx.service.learnRecord.findAllByCondition({
			lessonId: id,
			userId
		});

		return ctx.helper.success({ ctx, status: 200, res: list });
	}
}

module.exports = LessonsController;
