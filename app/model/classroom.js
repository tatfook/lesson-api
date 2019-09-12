
const _ = require("lodash");
const consts = require("../core/consts.js");
const {
	CLASSROOM_STATE_USING,
	CLASSROOM_STATE_USED,
	LEARN_RECORD_STATE_START
} = consts;

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("classrooms", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		classId: { // 课堂Id
			type: BIGINT,
			defaultValue: 0
		},

		organizationId: { // 机构Id
			type: BIGINT,
			defaultValue: 0,
		},

		packageId: { // 所属课程包ID
			type: BIGINT,
			allowNull: false,
		},

		lessonId: {
			type: BIGINT,
			allowNull: false,
		},

		key: {
			type: STRING(24),
			unique: true,
		},

		state: { // 0 -- 未上课  1 -- 上可中  2 -- 上课结束 
			type: INTEGER,
			defaultValue: 0,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	model.createClassroom = async function (params) {
		let classroom = await app.model.Classroom.create(params);
		if (!classroom) return;
		classroom = classroom.get({ plain: true });
		classroom.key = _.padEnd(_.toString(classroom.id), 6, "" + _.random(10000000, 99999999));
		await app.model.Classroom.update(classroom, { where: { id: classroom.id }});

		const userId = classroom.userId;
		const user = await app.model.User.getById(userId);
		const extra = user.extra || {};
		// 下课旧学堂
		if (extra.classroomId) await this.dismiss(userId, extra.classroomId);
		extra.classroomId = classroom.id;

		// 设置用户当前课堂id
		await app.model.User.update({ extra }, { where: { id: userId }});

		// 更新课程包周上课量
		const lastClassroomCount = await this.getPackageWeekClassroomCount(classroom.packageId);
		await app.model.Package.update({ lastClassroomCount }, { where: { id: classroom.packageId }});

		return classroom;
	};

	model.getById = async function (classroomId, userId) {
		const where = { id: classroomId };

		if (userId) where.userId = userId;
		let data = await app.model.Classroom.findOne({ where });

		if (data) data = data.get({ plain: true });

		return data;
	};

	model.isClassing = async function (classroomId) {
		const classroom = await this.getById(classroomId);
		if (classroom && ~~classroom.state === CLASSROOM_STATE_USING) return true;

		return false;
	};

	model.isTeached = async function (userId, packageId, lessonId) {
		const data = await app.model.Classroom.findOne({
			where: {
				userId,
				packageId,
				lessonId
			}
		});

		if (data) return true;

		return false;
	};

	model.quit = async function (studentId, username) {
		const user = await app.model.User.getById(studentId);

		const classroomId = user.extra.classroomId;
		if (!classroomId) return;

		const classroom = await app.model.Classroom.getById(classroomId);
		if (~~classroom.state !== CLASSROOM_STATE_USING) return;

		app.model.LessonOrganizationLog.classroomLog({ classroom, action: "quit", handleId: studentId, username });
		app.model.LearnRecord.destroy({
			where: {
				classroomId,
				userId: studentId,
			}
		});

		// 教师退出自己的课堂 不置当前课堂id
		if (~~classroom.userId !== ~~studentId) {
			user.extra.classroomId = undefined;
			await app.model.User.update({ extra: user.extra }, { where: { id: user.id }});
		}

	};

	model.join = async function (studentId, key, username) {
		let data = await app.model.Classroom.findOne({ where: { key }});
		if (!data) return;
		data = data.get({ plain: true });
		const classroomId = data.id;
		const lessonId = data.lessonId;
		// 课程未开始或结束
		if (~~data.state !== CLASSROOM_STATE_USING) return;
		const learnRecordData = {
			classroomId,
			classId: data.classId,
			packageId: data.packageId,
			lessonId: data.lessonId,
			userId: studentId,
			state: LEARN_RECORD_STATE_START,
			extra: {},
		};
		let learnRecord = null;
		if (studentId) {
			// 设置用户当前课堂id
			await app.model.User.updateExtra(studentId, { classroomId });

			learnRecord = await app.model.LearnRecord.findOne({ where: { classroomId, userId: studentId }});
			if (!learnRecord) learnRecord = await app.model.LearnRecord.create(learnRecordData);

			await app.model.Subscribe.upsert({ userId: studentId, packageId: data.packageId });
		} else {
			if (username) {
				learnRecordData.extra.username = username;
				const lrs = await app.model.LearnRecord.findAll({ where: { classroomId }});
				_.each(lrs, o => {
					if ((o.extra || {}).username === username) learnRecord = o;
				});
			}
			if (!learnRecord) {
				learnRecord = await app.model.LearnRecord.create(learnRecordData);
			}
		}

		learnRecord = learnRecord.get({ plain: true });
		learnRecord.lesson = await app.model.Lesson.getById(lessonId);

		return learnRecord;
	};

	// 下课
	model.dismiss = async function (userId, classroomId, username) {
		let data = await app.model.Classroom.findOne({
			where: {
				id: classroomId,
				userId,
				state: CLASSROOM_STATE_USING,
			}
		});

		if (!data) return false;
		data = data.get({ plain: true });

		app.model.LessonOrganizationLog.classroomLog({ classroom: data, action: "dismiss", handleId: userId, username });
		// 更新课堂状态
		await app.model.Classroom.update({
			state: CLASSROOM_STATE_USED,
		}, {
			where: {
				userId,
				id: data.id,
			}
		});

		// 更新订阅包信息
		await app.model.Subscribe.addTeachedLesson(userId, data.packageId, data.lessonId);

		return true;
	};

	// 获取最后一次教课记录 
	model.getLastTeach = async function (userId, packageId) {
		const list = await app.model.Classroom.findAll({
			order: [["createdAt", "DESC"]],
			limit: 1,
			where: { userId, packageId },
		});

		if (list.length === 1) return list[0];


	};

	// 获取课程包周上课量
	model.getPackageWeekClassroomCount = async function (packageId) {
		const curtime = (new Date()).getTime();
		const startTime = curtime - 1000 * 3600 * 24 * 7;

		const count = await app.model.Classroom.count({
			where: {
				createdAt: {
					[app.model.Op.gt]: new Date(startTime),
				}
			}
		});

		return count;
	};


	app.model.Classroom = model;

	return model;
};
