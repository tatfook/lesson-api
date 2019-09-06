
const _ = require("lodash");
const {
	TRADE_TYPE_LESSON_STUDY,
} = require("../core/consts.js");

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

	// model.sync({force:true});

	model.rewards = async function (userId, packageId, lessonId) {
		const where = { userId, packageId, lessonId };
		const account = await app.keepworkModel.accounts.findOne({ where: { userId }}).then(o => o && o.toJSON());
		if (!account) return;

		// 是否学习完成
		let data = await app.model.UserLearnRecords.findOne({ where });
		if (!data) return;

		// 是否已领取
		let lessonReward = await app.model.LessonRewards.findOne({ where }).then(o => o && o.toJSON());
		lessonReward = lessonReward || { userId, packageId, lessonId, coin: 0, bean: 0 };

		let beanCount = lessonReward.bean ? 0 : 10; // 已奖励则不再奖励
		let coinCount = (account.lockCoin < 10 || lessonReward.coin) ? 0 : _.random(10, account.lockCoin > 15 ? 15 : account.lockCoin);

		lessonReward.coin = lessonReward.coin + coinCount;
		lessonReward.bean = lessonReward.bean + beanCount;
		if (~~coinCount === 0 && ~~beanCount === 0) return { coin: coinCount, bean: beanCount };

		// 创建返还记录
		await app.model.LessonRewards.upsert(lessonReward);

		// 扣除用户可返还余额
		await app.keepworkModel.accounts.increment({ coin: coinCount, bean: beanCount, lockCoin: 0 - coinCount }, { where: { userId }});

		const lesson = await app.model.Lessons.getById(lessonId);
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
