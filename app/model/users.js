
const _ = require("lodash");
const consts = require("../core/consts.js");
const { 
	USER_IDENTIFY_TEACHER
} = consts;

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
	
	model.updateExtra = async function (userId, extra) {
		const user = await app.model.Users.getById(userId);

		if (!user) return;

		const userExtra = user.extra || {};
		_.merge(userExtra, extra);

		await app.model.Users.update({ extra: userExtra }, { where: { id: user.id }});
	};

	model.getById = async function (userId, username) {
		let data = await app.model.Users.findOne({ where: { id: userId }});

		const amount = 0;
		if (!data && userId) {
			console.log(userId, username);
			data = await app.model.Users.create({
				id: userId,
				username,
				coin: amount,
			});
			 
			// await app.model.Coins.create({
			// userId,
			// amount: amount,
			// type: COIN_TYPE_SYSTEM_DONATE,
			// desc: "系统赠送",
			// });
		};

		data = data.get({ plain: true });

		return data;
	};
	
	model.isTeacher = async function (userId) {
		let user = await app.model.Users.findOne({ where: { id: userId }});
		if (!user) return false;

		user = user.get({ plain: true });

		if (user.identify & USER_IDENTIFY_TEACHER) return true;

		return false;
	};

	model.learn = async function (userId) {
		const user = await this.getById(userId);
		if (!user) return ;

		const datestr = app.util.getDate().datestr;
		const learn = user.extra.learn || { learnDayCount: 0, lastLearnDate: "" };
		user.extra.learn = learn;

		if (datestr !== learn.lastLearnDate) {
			learn.learnDayCount = (learn.learnDayCount || 0) + 1;
			learn.lastLearnDate = datestr;
			await app.model.Users.update({ extra: user.extra }, { where: { id: user.id }});
		}
	};

	app.model.users = model;
	return model;
};
