
const _ = require("lodash");
const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

const { CLASSROOM_STATE_USING } = consts;

class ClassroomsController extends Controller {
	async ensureTeacher() {
		this.enauthenticated();
		// const teacher = await this.model.teachers.getByUserId(userId);
		// if (!teacher) this.throw(400, "非老师");
	}

	async index() {
		const { ctx } = this;
		const query = ctx.query || {};

		this.enauthenticated();
		const userId = this.getUser().userId;

		query.userId = userId;

		const data = await ctx.model.Classrooms.findAndCount({ where: query });
		const rows = data.rows;
		const packageIds = [];
		_.each(rows, (o, i) => {
			rows[i] = o.toJSON();
			packageIds.push(rows[i].packageId);
		});
		const lessonCount = await ctx.model.PackageLessons.getLessonCountByPackageIds(packageIds);
		_.each(rows, (o, i) => { o.lessonCount = lessonCount[o.packageId]; });

		return this.success(data);
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const data = await ctx.model.Classrooms.findOne({ where: { id }});

		return this.success(data);
	}

	async create() {
		const { ctx } = this;
		const { userId, username, organizationId } = this.enauthenticated();
		const params = ctx.request.body;

		ctx.validate({
			packageId: "int",
			lessonId: "int",
		});

		// const isTeacher = await this.model.teachers.isAllowTeach(userId);
		// if (!isTeacher) return this.throw(400, "无权限");

		const packageLesson = await ctx.model.PackageLessons.findOne({
			where: {
				packageId: params.packageId,
				lessonId: params.lessonId,
			}
		});
		if (!packageLesson) ctx.throw(400);

		const _package = await ctx.model.Packages.getById(params.packageId);
		const lesson = await ctx.model.Lessons.getById(params.lessonId);

		if (!_package || !lesson) ctx.throw(400, "args error");

		params.userId = userId;
		params.state = CLASSROOM_STATE_USING;
		params.extra = params.extra || {};
		params.extra.packageName = _package.packageName;
		params.extra.lessonName = lesson.lessonName;
		params.extra.lessonGoals = lesson.goals;
		params.extra.coverUrl = (lesson.extra || {}).coverUrl;
		params.extra.lessonNo = packageLesson.extra.lessonNo;

		const data = await ctx.model.Classrooms.createClassroom(params);

		this.app.keepworkModel.lessonOrganizationLogs.classroomLog({ classroom: data, action: "create", handleId: userId, username, organizationId });

		return this.success(data);
	}

	async update() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		// await this.ensureTeacher();
		const userId = this.getUser().userId;
		params.userId = userId;

		const data = await ctx.model.Classrooms.update(params, { where: { id, userId }});

		return this.success(data);
	}

	async valid() {
		const { key } = this.validate({ key: "string" });

		let data = await this.model.Classrooms.findOne({ where: { key }});
		if (!data) return this.success(false);
		data = data.get({ plain: true });

		return this.success(data.state & CLASSROOM_STATE_USING ? true : false);
	}

	async getByKey() {
		const { key } = this.validate({ key: "string" });
		const classroom = await this.model.Classrooms.findOne({ where: { key }}).then(o => o && o.toJSON());
		if (!classroom) return this.fail(1);

		return this.success(classroom);
	}

	async join() {
		const { ctx } = this;
		const params = this.validate({ key: "string" });
		// const {userId, organizationId} = this.enauthenticated();
		const { userId = 0, organizationId, username } = this.getUser();
		const classroom = await this.model.Classrooms.findOne({ where: { key: params.key }}).then(o => o && o.toJSON());
		if (!classroom) return this.fail(1);

		if (classroom.classId && userId) {
			const member = await this.app.keepworkModel.lessonOrganizationClassMembers.findOne({ where: { classId: classroom.classId, memberId: userId }}).then(o => o && o.toJSON());
			if (!member) return this.throw(400, "不是该班级学生");
		}

		// const count = await this.model.LearnRecords.count({where:{classroomId:classroom.id}});
		// if (count >= 50) return this.fail(2);

		// const userId = this.getUser().userId || 0;
		const data = await ctx.model.Classrooms.join(userId, params.key, params.username);
		if (!data) return this.fail(-1);

		// if (!userId) data.token = this.app.util.jwt_encode({userId:0, username:"匿名用户"}, this.app.config.self.secret, 3600 * 24);

		this.app.keepworkModel.lessonOrganizationLogs.classroomLog({ classroom, action: "join", handleId: userId, username, organizationId });
		return this.success(data);
	}

	async quit() {
		const { userId, username } = this.enauthenticated();

		await this.model.Classrooms.quit(userId, username);

		return this.success("OK");
	}

	async current() {
		const { ctx } = this;

		this.enauthenticated();
		const userId = this.getUser().userId;

		const user = await ctx.model.Users.getById(userId);

		const classroomId = user.extra.classroomId;
		if (!classroomId) ctx.throw(404, "not found");

		let classroom = await ctx.model.Classrooms.findOne({ where: { id: classroomId }});
		if (!classroom) ctx.throw(404, "not found");

		classroom = classroom.get({ plain: true });
		if (~~classroom.state !== CLASSROOM_STATE_USING) ctx.throw(400, "课堂已结束");

		if (classroom.classId) {
			const cls = await this.app.keepworkModel.lessonOrganizationClasses.findOne({ where: { id: classroom.classId, end: { $gte: new Date() }}});
			if (!cls) ctx.throw(400, "班级失效");
		}

		const learnRecord = await ctx.model.LearnRecords.findOne({ where: { classroomId: classroom.id, userId }});
		if (learnRecord) {
			classroom.learnRecordId = learnRecord.get({ plain: true }).id;
		}
		return this.success(classroom);
	}

	async getLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		this.enauthenticated();
		// const userId = this.getUser().userId;

		const list = await ctx.model.LearnRecords.findAll({ where: { classroomId: id }});

		return this.success(list);
	}

	// 更新课堂学习记录
	async createLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		await this.ensureTeacher();
		const userId = this.getUser().userId;

		const classroom = await ctx.model.Classrooms.getById(id, userId);
		if (!classroom) ctx.throw(400, "args error");

		params.classroomId = id;
		params.packageId = classroom.packageId;
		params.lessonId = classroom.lessonId;
		if (!params.userId) ctx.throw(400, "args error");
		const lr = await ctx.model.LearnRecords.createLearnRecord(params);

		return this.success(lr);
	}

	// 更新课堂学习记录
	async updateLearnRecords() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		await this.ensureTeacher();
		const userId = this.getUser().userId;

		const classroom = await ctx.model.Classrooms.getById(id, userId);
		if (!classroom) ctx.throw(400, "args error");

		const learnRecords = _.isArray(params) ? params : [params];
		for (let i = 0; i < learnRecords.length; i++) {
			let record = learnRecords[i];
			if (!record.id) continue;
			if (!record.userId) delete record.userId;
			record.classroomId = id;
			await ctx.model.LearnRecords.updateLearnRecord(record);
		}

		return this.success("OK");
	}

	// 下课
	async dismiss() {
		const { ctx } = this;
		const { userId, username } = this.enauthenticated();
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		// const params = ctx.request.body;

		const result = await ctx.model.Classrooms.dismiss(userId, id, username);
		return this.success(result);
	}
}

module.exports = ClassroomsController;
