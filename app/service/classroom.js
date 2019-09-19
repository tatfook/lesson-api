"use strict";

const Service = require("../common/service.js");
const { CLASSROOM_STATE_USING } = require("../common/consts");
const Err = require("../common/err");

class ClassroomService extends Service {
	/**
	 * 通过条件获取classroom
	 * @param {*} condition 必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Classroom.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 分页查找classroom,并且查询packageId分别有多少Lesson数量
	 * @param {*} condition 筛选条件,对象
	 */
	async findAndCount(condition) {
		const data = await this.ctx.model.Classroom.findAndCountAll({ where: condition });
		const packageIds = [];

		data.rows = data.rows.map(r => {
			packageIds.push(r.packageId);
			return r.get();
		});

		const lessonCount = await this.ctx.service.packageLesson.getLessonCountByPackageIds(packageIds);

		data.rows = data.rows.map(r => {
			r.lessonCount = lessonCount[r.packageId];
			return r;
		});
		return data;
	}

	/**
	 * check之后，创建课堂，或者说授课记录
	 * @param {*} params 
	 */
	async checkAndCreateClassroom(params) {
		// 判断资源存不存在
		const [packageLesson, _package, lesson] = await Promise.all([
			this.ctx.service.packageLesson.getByCondition({
				packageId: params.packageId,
				lessonId: params.lessonId
			}),
			this.ctx.service.package.getByCondition({ id: params.packageId }),
			this.ctx.service.lesson.getByCondition({ id: params.lessonId })
		]);

		if (!packageLesson || !_package || !lesson) return this.ctx.throw(400, Err.LESSON_OR_PACKAGE_NOT_EXISTS);

		const _extra = {
			...(params.extra || {}),
			packageName: _package.packageName,
			lessonName: lesson.lessonName,
			lessonGoals: lesson.goals,
			coverUrl: (lesson.extra || {}).coverUrl,
			lessonNo: packageLesson.extra.lessonNo
		};
		const _params = {
			userId: params.userId,
			packageId: params.packageId,
			lessonId: params.lessonId,
			state: CLASSROOM_STATE_USING,
			extra: _extra
		};

		const data = await this.ctx.model.Classroom.createClassroom(_params);

		await this.ctx.service.lessonOrganizationLog.classroomLog({
			classroom: data, action: "create",
			handleId: params.userId,
			username: params.username,
			organizationId: params.organizationId
		});

		return data;
	}

	/**
	 * 更新classroom
	 * @param {*} params 要更新的字段内容
	 * @param {*} classroomId 主键id
	 * @param {*} userId 可选
	 */
	async updateClassroom(params, classroomId, userId) {
		const condition = { id: classroomId, userId }

		return await this.ctx.model.Classroom.update(params, { where: condition });
	}

	/**
	 * 加入课堂
	 * @param {*} params 
	 */
	async joinClassroom(params) {
		const classroom = await this.getByCondition({ key: params.key });
		if (!classroom) return this.ctx.throw(400, Err.CLASSROOM_NOT_EXISTS);

		// 判断这个人是不是这个班级的
		if (classroom.classId && params.userId) {
			const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition({
				classId: classroom.classId, memberId: params.userId
			});
			if (!member) return this.ctx.throw(400, Err.NOT_YOUR_CLASS);
		}

		const data = await this.ctx.model.Classroom.join(params.userId, params.key, params.username);
		if (!data) return this.ctx.throw(400, Err.UNKNOWN_ERR);

		await this.ctx.service.lessonOrganizationLog.classroomLog({
			classroom, action: "join",
			handleId: params.userId, username: params.username,
			organizationId: params.organizationId
		});
		return data;
	}

	// 退出课堂
	async quitClassroom(userId, username) {
		return await this.ctx.model.Classroom.quit(userId, username);
	}

	// 获取当前课堂
	async currentClassroom(userId) {
		const user = await this.ctx.service.user.getById(userId);

		const classroomId = user.extra.classroomId;
		if (!classroomId) return this.ctx.throw(400, Err.DONT_IN_CLASSROOM_NOW);

		const classroom = await this.getByCondition({ id: classroomId });
		if (!classroom) return this.ctx.throw(400, Err.CLASSROOM_NOT_EXISTS);

		if (classroom.state !== CLASSROOM_STATE_USING) return this.ctx.throw(400, Err.CLASSROOM_FINISHED);

		// 如果是跟着班级学的，判断班级是否有效
		if (classroom.classId) {
			const cls = await this.ctx.service.lessonOrganizationClass.getByCondition({
				id: classroom.classId,
				end: { $gte: new Date() }
			});
			if (!cls) return this.ctx.throw(400, Err.CLASS_NOT_EXIST);
		}

		// 获取学习记录
		const learnRecord = await this.ctx.service.learnRecord.getByCondition({ classroomId: classroom.id, userId });
		if (learnRecord) {
			classroom.learnRecordId = learnRecord.id;
		}
		return classroom;
	}

	// 下课
	async dismiss(userId, classroomId, username) {
		return await this.ctx.model.Classroom.dismiss(userId, classroomId, username);
	}
}

module.exports = ClassroomService;
