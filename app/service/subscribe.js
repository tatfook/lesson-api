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
}

module.exports = SubscribeService;