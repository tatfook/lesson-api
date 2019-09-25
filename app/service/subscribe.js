"use strict";

const Service = require("../common/service.js");
const Err = require("../common/err");

class SubscribeService extends Service {
	/**
	 * 通过条件获取package
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Subscribe.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 
	 * @param {*} params 
	 */
	async upsertSubscribe(params) {
		return await this.ctx.model.Subscribe.upsert(params);
	}

	/**
	 * 用户课程包
	 * @param {*} userId 
	 * @param {*} state package的状态
	 */
	async getByUserId(userId, state) {
		return await this.ctx.model.Subscribe.getByUserId(userId, state);
	}


}

module.exports = SubscribeService;