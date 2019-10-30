"use strict";

const Service = require("../common/service.js");
const _ = require("lodash");
const {
	TRADE_TYPE_LESSON_STUDY,
} = require("../common/consts.js");

class LearnRewardService extends Service {
	/**
	 * 领取奖励
	 * @param {*} userId 必选
	 * @param {*} packageId 必选
	 * @param {*} lessonId 必选
	 */
	async getRewards(userId, packageId, lessonId) {

		const where = { userId, packageId, lessonId };

		const [account, userLearnRecord] = await Promise.all([
			this.ctx.service.keepwork.getAccounts(userId),
			this.ctx.model.UserLearnRecord.findOne({ where })// 是否学习完成
		]);

		if (!account || !userLearnRecord) return;

		// 是否已领取
		let lessonReward = await this.ctx.model.LessonReward.findOne({ where }).then(o => o && o.toJSON());
		lessonReward = lessonReward || { userId, packageId, lessonId, coin: 0, bean: 0 };

		let beanCount = lessonReward.bean ? 0 : 10; // 已奖励则不再奖励
		let coinCount = (account.lockCoin < 10 || lessonReward.coin) ? 0 : _.random(10, account.lockCoin > 15 ? 15 : account.lockCoin);

		lessonReward.coin = lessonReward.coin + coinCount;
		lessonReward.bean = lessonReward.bean + beanCount;
		if (~~coinCount === 0 && ~~beanCount === 0) return { coin: coinCount, bean: beanCount };

		const [lesson] = await Promise.all([
			this.ctx.model.Lesson.getById(lessonId),
			this.ctx.model.LessonReward.upsert(lessonReward), // 创建返还记录
			// 扣除用户可返还余额
			this.ctx.service.keepwork.accountIncrement({ coin: coinCount, bean: beanCount, lockCoin: 0 - coinCount }, userId)
		]);

		await this.ctx.service.keepwork.createRecord({
			userId,
			type: TRADE_TYPE_LESSON_STUDY,
			subject: lesson.lessonName,
			coin: coinCount,
			bean: beanCount,
			resources: "trades"
		});

		return { coin: coinCount, bean: beanCount };
	}

	/**
 	* 通过条件获取lessonReward记录
 	* @param {*} condition 必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonReward.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
}

module.exports = LearnRewardService;