
const moment = require("moment");

module.exports = app => {
	const {
		BIGINT,
		STRING,
		TEXT,
		JSON,
		DATE
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationLogs", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		type: {
			type: STRING,
			defaultValue: "",
		},

		description: {
			type: TEXT,
		},

		handleId: {
			type: BIGINT,
			defaultValue: 0,
		},

		username: {
			type: STRING,
			defaultValue: "",
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},
		createdAt: {
			type: DATE,
		},

		updatedAt: {
			type: DATE,
		}

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	model.classroomLog = async function ({ classroom = {}, lr, action = "create", username, handleId, organizationId }) {
		const log = {
			organizationId: organizationId || classroom.organizationId,
			type: "课堂",
			handleId,
			username,
		};

		if (action === "create") {
			log.description = `创建课堂, 课堂ID: C${classroom.key}, 《${classroom.extra.packageName}》, ${classroom.extra.lessonNo}: ${classroom.extra.lessonName}`;
		} else if (action === "dismiss") {
			log.description = `下课, 课堂ID: C${classroom.key}, 《${classroom.extra.packageName}》, ${classroom.extra.lessonNo}: ${classroom.extra.lessonName}`;
		} else if (action === "join") {
			log.description = `进入课堂, 课堂ID: C${classroom.key}`;
		} else if (action === "quit") {
			log.description = `离开课堂, 课堂ID: C${classroom.key}`;
		} else if (action === "learn") {
			const packageId = lr.packageId;
			const lessonId = lr.lessonId;
			const pkg = await app.model.Package.findOne({ where: { id: packageId }});
			const lesson = await app.model.Lesson.findOne({ where: { id: lessonId }});
			const packageLesson = await app.model.PackageLesson.findOne({ where: { packageId: packageId, lessonId: lessonId }});
			const packageName = pkg.packageName;
			const lessonName = lesson.lessonName;
			const lessonNo = packageLesson.extra.lessonNo;

			log.description = `自学课程,《${packageName}》, ${lessonNo}: ${lessonName}`;
		} else {
			return;
		}
		await app.model.LessonOrganizationLog.create(log);
	};

	model.classLog = async function ({ cls, params = {}, action, count = 0, username, handleId, organizationId }) {
		const begin = moment(new Date(cls.begin)).format("YYYY/MM/DD");
		const end = moment(new Date(cls.end)).format("YYYY/MM/DD");
		const paramsBegin = params.begin ? moment(new Date(params.begin)).format("YYYY/MM/DD") : begin;
		const paramsEnd = params.end ? moment(new Date(params.end)).format("YYYY/MM/DD") : end;
		if (action === "createClass") {
			return await app.model.LessonOrganizationLog.create({
				organizationId, type: "班级", description: `新建, 班级: ${cls.name}, 开班时间 ${begin} - ${end}`, username, handleId
			});
		} if (action === "updateClass") {
			if (cls.name !== params.name) {
				await app.model.LessonOrganizationLog.create({
					organizationId, type: "班级", description: `改名, 班级: ${cls.name}, 修改为: ${params.name}`, username, handleId
				});
			}
			if (paramsBegin !== begin || paramsEnd !== end) {
				await app.model.LessonOrganizationLog.create({
					organizationId, type: "班级", description: `修改有效期, 班级: ${cls.name}, 开班时间修改为: ${paramsBegin} - ${paramsEnd}`, username, handleId
				});
			}
			if (params.packages) {
				await app.model.LessonOrganizationLog.create({
					organizationId, type: "班级", description: `变更课程包, 班级: ${cls.name}`, username, handleId
				});
			}
		} else if (action === "activateCode") {
			await app.model.LessonOrganizationLog.create({
				organizationId, type: "班级", description: `生成邀请码: ${cls.name}, 生成 ${count} 个`, username, handleId
			});
		}
	};

	model.studentLog = async function ({ oldmembers, roleId, classIds, realname = "", memberId, username, handleId, organizationId }) {
		if (classIds.length === 0) {
			if (!oldmembers || oldmembers.length === 0) {
				oldmembers = await app.model.LessonOrganizationClassMember.findAll({
					where: { memberId, organizationId }
				}).then(list => list.map(o => o.toJSON()));
			}
			if (roleId === CLASS_MEMBER_ROLE_STUDENT) {
				return await app.model.LessonOrganizationLog.create({
					organizationId, type: "学生", description: "删除, 学生: " + (oldmembers[0].realname || ""), username, handleId
				});
			}
			if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
				return await app.model.LessonOrganizationLog.create({
					organizationId, type: "老师", description: "删除, 老师: " + (oldmembers[0].realname || ""), username, handleId
				});
			}
			return;
		}

		if (classIds.length === 1 && classIds[0] === 0 && oldmembers.length === 0) {
			if (roleId === CLASS_MEMBER_ROLE_STUDENT) {
				return await app.model.LessonOrganizationLog.create({
					organizationId, type: "学生", description: "添加学生: " + realname, username, handleId
				});
			}
			if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
				const member = _.find(oldmembers, o => o.classId === 0 && o.roleId && CLASS_MEMBER_ROLE_TEACHER);
				if (member) {
					return await app.model.LessonOrganizationLog.create({
						organizationId, type: "老师", description: `改名, 教师: ${member.realname || ""} 修改为: ${realname}`, username, handleId
					});
				}
				return await app.model.LessonOrganizationLog.create({ organizationId, type: "老师", description: "添加老师: " + realname, username, handleId });

			}
		}

		for (let i = 0; i < oldmembers.length; i++) {
			const member = oldmembers[i];
			const index = classIds.indexOf(member.classId);
			const cls = await app.model.LessonOrganizationClass.findOne({ where: { id: member.classId }});
			member.realname = member.realname || "";
			if (index < 0 && cls) {
				if (roleId === CLASS_MEMBER_ROLE_STUDENT) {
					await app.model.LessonOrganizationLog.create({
						organizationId, type: "班级", description: `移除学生, ${cls.name}, 移除学生: ${member.realname}`, handleId, username
					});
				}
				if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
					await app.model.LessonOrganizationLog.create({
						organizationId, type: "班级", description: `移除老师, ${cls.name}, 移除老师: ${member.realname}`, handleId, username
					});
				}
				continue;
			} else {
				if (member.realname !== realname && realname) {
					if (roleId === CLASS_MEMBER_ROLE_STUDENT) {
						await app.model.LessonOrganizationLog.create({
							organizationId, type: "学生", description: `改名, 学生: ${member.realname || ""}, 修改为: ${realname}`, handleId, username
						});
					}
					if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
						await app.model.LessonOrganizationLog.create({
							organizationId, type: "老师", description: `改名, 教师: ${member.realname || ""}, 修改为: ${realname}`, handleId, username
						});
					}
					realname = member.realname;
					continue;
				}
			}
		}

		for (let i = 0; i < classIds.length; i++) {
			const classId = classIds[i];
			const member = _.find(oldmembers, o => o.classIds === classId && o.roleId & roleId);
			if (member) continue;
			const cls = await app.model.LessonOrganizationClass.findOne({ where: { id: classId }});
			if (!cls) continue;
			if (roleId === CLASS_MEMBER_ROLE_STUDENT) {
				await app.model.LessonOrganizationLog.create({
					organizationId, type: "班级", description: `添加学生, ${cls.name}, 添加学生: ${realname}`, handleId, username
				});
			}
			if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
				await app.model.LessonOrganizationLog.create({
					organizationId, type: "班级", description: `添加老师, ${cls.name}, 添加老师: ${realname}`, handleId, username
				});
			}
		}
	};

	return model;
};

