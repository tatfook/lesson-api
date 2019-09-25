"use strict";

const Service = require("egg").Service;


class TradeService extends Service {
	/**
	 * 
	 * @param {*} params 
	 */
	async createTradeRecord(params) {
		return await this.ctx.model.Trade.create(params);
	}
}

module.exports = TradeService;