"use strict";

const Service = require("../common/service.js");

class LearnRewardService extends Service {
	/**
	 * 领取奖励
	 * @param {*} userId 必选
	 * @param {*} packageId 必选
	 * @param {*} lessonId 必选
	 */
	async getRewards(userId, packageId, lessonId) {
		return await this.ctx.model.LessonReward.rewards(userId, packageId, lessonId);
	}

	/**
 	* 通过条件获取lessonReward记录
 	* @param {*} condition 必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.LearnRecord.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
}

module.exports = LearnRewardService;