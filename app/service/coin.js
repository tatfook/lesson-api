
"use strict";

const Service = require("../common/service.js");


class CoinService extends Service {
	/**
	 * 
	 * @param {*} condition 
	 */
	async getAllByCondition(condition) {
		const list = await this.ctx.model.Coin.findAll({ where: condition });
		return list ? list.map(r => r.get()) : [];
	}
}

module.exports = CoinService;