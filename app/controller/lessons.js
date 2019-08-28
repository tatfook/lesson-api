
const _ = require("lodash");

const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

const { PACKAGE_STATE_AUDIT_SUCCESS } = consts;

class LessonsController extends Controller {
	async index() {
		const { ctx } = this;
		const query = ctx.query || {};
		const order = [["updatedAt", "DESC"]];

		this.enauthenticated();
		const userId = this.getUser().userId;
		query.userId = userId;

		const data = await ctx.model.Lessons.findAndCount({ where: query, order });
		const lessons = [];
		for (let i = 0; i < data.rows.length; i++) {
			let lesson = data.rows[i];
			lesson = lesson.get({ plain: true });
			lesson.packages = await ctx.model.Lessons.getPackagesByLessonId(lesson.id);
			lessons.push(lesson);
		}

		return this.success({ count: data.count, rows: lessons });
	}

	async detail() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const data = await ctx.model.Lessons.getById(id);

		if (!data) ctx.throw(404, "not found");

		data.skills = await ctx.model.LessonSkills.getSkillsByLessonId(id);
		data.packages = await ctx.model.Lessons.getPackagesByLessonId(id);

		return this.success(data);
	}

	async detailByUrl() {
		const { ctx } = this;
		let { url } = this.validate({ url: "string" });

		url = decodeURIComponent(url);
		let data = await ctx.model.Lessons.findOne({ where: { url }});
		if (!data) ctx.throw(404, "not found" + url);
		data = data.get({ plain: true });

		const id = data.id;

		data.skills = await ctx.model.LessonSkills.getSkillsByLessonId(id);
		data.packages = await ctx.model.Lessons.getPackagesByLessonId(id);

		return this.success(data);
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const data = await ctx.model.Lessons.getById(id);

		return this.success(data);
	}

	async create() {
		const { ctx } = this;
		const params = ctx.request.body;
		const skills = params.skills;

		this.enauthenticated();
		const userId = this.getUser().userId;
		params.userId = userId;
		params.state = PACKAGE_STATE_AUDIT_SUCCESS;

		let lesson = await ctx.model.Lessons.create(params);
		if (!lesson) ctx.throw("500", "DB failed");
		lesson = lesson.get({ plain: true });

		if (!skills || !_.isArray(skills)) return this.success(lesson);
		const lessonSkills = [];
		for (let i = 0; i < skills.length; i++) {
			let skillParams = skills[i];
			if (!skillParams.id) continue;
			const skillId = skillParams.id;
			const skillScore = skillParams.score || 0;
			lessonSkills.push({
				userId: userId,
				skillId: skillId,
				lessonId: lesson.id,
				score: skillScore,
			});
		}
		if (lessonSkills.length > 0) {
			await ctx.model.LessonSkills.bulkCreate(lessonSkills);
		}

		return this.success(lesson);
	}

	async update() {
		const { ctx } = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;
		delete params.state;
		const result = await ctx.model.Lessons.update(params, { where: { id }});
		const skills = params.skills || [];
		const lessonSkills = [];
		for (let i = 0; i < skills.length; i++) {
			let skillParams = skills[i];
			if (!skillParams.id) continue;
			const skillId = skillParams.id;
			const skillScore = skillParams.score || 0;
			lessonSkills.push({
				userId: userId,
				skillId: skillId,
				lessonId: id,
				score: skillScore,
			});
		}
		if (lessonSkills.length > 0) {
			await ctx.model.LessonSkills.destroy({ where: { lessonId: id }});
			await ctx.model.LessonSkills.bulkCreate(lessonSkills);
		}

		return this.success(result);
	}

	async destroy() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;

		await ctx.model.LessonSkills.destroy({ where: { lessonId: id, userId }});
		const result = await ctx.model.Lessons.destroy({ where: { id, userId }});

		return this.success(result);
	}

	async getSkills() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		this.enauthenticated();
		// const userId = this.getUser().userId;

		const skills = await ctx.model.Lessons.getSkills(id);

		return this.success(skills);
	}

	async addSkill() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		ctx.validate({
			skillId: "int",
			score: {
				type: "int",
			}
		});

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await ctx.model.Lessons.addSkill(userId, id, params.skillId, params.score);
		return this.success(result);
	}

	async deleteSkill() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.query || {};
		const skillId = params.skillId && _.toNumber(params.skillId);
		if (!skillId) ctx.throw(401, "args error");

		this.enauthenticated();
		const userId = this.getUser().userId;

		const result = await ctx.model.Lessons.deleteSkill(userId, id, skillId);

		return this.success(result);
	}

	async release() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.request.body;
		ctx.validate({
			content: "string",
		}, params);

		this.enauthenticated();
		const userId = this.getUser().userId;

		const lesson = await ctx.model.Lessons.getById(id, userId);
		if (!lesson) ctx.throw(400, "args error");

		const result = await ctx.model.LessonContents.release(userId, id, params.content);

		return this.success(result);
	}

	async content() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.query || {};

		const result = await ctx.model.LessonContents.content(id, params.version);

		return this.success(result);
	}

	async createLearnRecords() {
		const { ctx } = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		ctx.validate({
			packageId: "int",
		}, params);

		this.enauthenticated();
		const userId = this.getUser().userId;

		params.userId = userId;
		params.lessonId = id;

		const data = await ctx.model.LearnRecords.createLearnRecord(params);

		return this.success(data);
	}

	async updateLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;

		const params = ctx.request.body || {};
		if (!params.id) ctx.throw(400, "args error");

		params.lessonId = id;
		params.userId = userId;

		// const result = await ctx.model.LearnRecords.updateLearnRecord(params);

		return this.success("OK");
	}

	async getLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		const userId = this.getUser().userId;

		const list = await ctx.model.LearnRecords.findAll({
			where: {
				lessonId: id,
				userId,
			}
		});

		return this.success(list);
	}
}

module.exports = LessonsController;
