
"use strict";

const Service = require("../common/service.js");
const { CLASSROOM_STATE_USING } = require("../common/consts");
const Err = require("../common/err");


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