"use strict";

const _ = require("lodash");
const {
	TRADE_TYPE_LESSON_STUDY,
} = require("../common/consts.js");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("lessonRewards", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		packageId: {
			type: BIGINT,
			allowNull: false,
		},

		lessonId: {
			type: BIGINT,
			allowNull: false,
		},

		coin: { // 奖励知识币数量
			type: INTEGER,
			defaultValue: 0,
		},

		bean: { // 奖励知识豆数量
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

		indexes: [
			{
				unique: true,
				fields: ["userId", "packageId", "lessonId"],
			},
		],

	});

	model.rewards = async (userId, packageId, lessonId) => {
		const where = { userId, packageId, lessonId };

		const [account, userLearnRecord] = await Promise.all([
			app.keepworkModel.accounts.findOne({ where: { userId }}),
			app.model.UserLearnRecord.findOne({ where })// 是否学习完成
		]);

		if (!account || !userLearnRecord) return;

		// 是否已领取
		let lessonReward = await app.model.LessonReward.findOne({ where }).then(o => o && o.toJSON());
		lessonReward = lessonReward || { userId, packageId, lessonId, coin: 0, bean: 0 };

		let beanCount = lessonReward.bean ? 0 : 10; // 已奖励则不再奖励
		let coinCount = (account.lockCoin < 10 || lessonReward.coin) ? 0 : _.random(10, account.lockCoin > 15 ? 15 : account.lockCoin);

		lessonReward.coin = lessonReward.coin + coinCount;
		lessonReward.bean = lessonReward.bean + beanCount;
		if (~~coinCount === 0 && ~~beanCount === 0) return { coin: coinCount, bean: beanCount };

		const [lesson] = await Promise.all([
			app.model.Lesson.getById(lessonId),
			app.model.LessonReward.upsert(lessonReward), // 创建返还记录
			app.keepworkModel.accounts.increment({ coin: coinCount, bean: beanCount, lockCoin: 0 - coinCount }, { where: { userId }}), // 扣除用户可返还余额
		]);

		await app.keepworkModel.trades.create({
			userId,
			type: TRADE_TYPE_LESSON_STUDY,
			subject: lesson.lessonName,
			coin: coinCount,
			bean: beanCount,
		});

		return { coin: coinCount, bean: beanCount };
	};

	return model;
};
