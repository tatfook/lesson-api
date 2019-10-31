"use strict";

const _ = require("lodash");
const consts = require("../common/consts.js");
const {
	USER_IDENTIFY_TEACHER
} = consts;
const helper = require("../extend/helper");

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("users", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		username: { // keepwork username
			type: STRING(64),
			unique: true,
			allowNull: false,
		},

		nickname: { // lesson昵称或真是姓名
			type: STRING(64),
		},

		coin: { // 知识币
			type: INTEGER,
			defaultValue: 0,
		},

		lockCoin: { // 待解锁的知识币
			type: INTEGER,
			defaultValue: 0,
		},

		bean: {
			type: INTEGER,
			defaultValue: 0,
		},

		identify: { // 身份
			type: INTEGER, // 0 = 默认 1 - 学生  2 - 教师 4 - 申请老师
			defaultValue: 0,
		},

		extra: { // 额外数据
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	model.updateExtra = async (userId, extra) => {
		const user = await app.model.User.getById(userId);
		if (!user) return;

		const userExtra = user.extra || {};
		_.merge(userExtra, extra);

		await app.model.User.update({ extra: userExtra }, { where: { id: user.id }});
	};

	// 不存在则创建
	model.getById = async function (userId, username) {
		let data = await app.model.User.findOne({ where: { id: userId }});
		const amount = 0;
		if (!data && userId) {
			data = await app.model.User.create({
				id: userId,
				username: username || "",
				coin: amount,
			});
		};

		return data ? data.get() : undefined;
	};

	model.isTeacher = async userId => {
		let user = await app.model.User.findOne({ where: { id: userId }});
		if (!user) return false;

		user = user.get({ plain: true });

		if (user.identify & USER_IDENTIFY_TEACHER) return true;

		return false;
	};

	// 增加user表中的学习天数和更新最近学习日期
	model.learn = async function (userId) {
		const user = await this.getById(userId);
		if (!user) return;

		const datestr = helper.getDate().datestr;
		const learn = user.extra.learn || { learnDayCount: 0, lastLearnDate: "" };
		user.extra.learn = learn;

		if (datestr !== learn.lastLearnDate) {
			learn.learnDayCount = (learn.learnDayCount || 0) + 1;
			learn.lastLearnDate = datestr;
			await app.model.User.update({ extra: user.extra }, { where: { id: user.id }});
		}
	};

	model.associate = () => {
		app.model.User.hasOne(app.model.Tutor, {
			as: "student",
			foreignKey: "userId",
			constraints: false,
		});
		app.model.User.hasOne(app.model.Tutor, {
			as: "tutor",
			foreignKey: "tutorId",
			constraints: false,
		});
		app.model.User.hasOne(app.model.Teacher, {
			as: "teachers",
			foreignKey: "userId",
			constraints: false,
		});
		app.model.User.hasMany(app.model.LessonOrganization, {
			as: "lessonOrganizations",
			foreignKey: "userId",
			sourceKey: "id",
			constraints: false,
		});
		app.model.User.hasOne(app.model.LessonOrganizationClassMember, {
			as: "lessonOrganizationClassMembers",
			foreignKey: "memberId",
			sourceKey: "id",
			constraints: false,
		});

		app.model.User.hasMany(app.model.Package, {
			as: "packages",
			foreignKey: "userId",
			sourceKey: "id",
			constraints: false,
		});
	};

	return model;
};
