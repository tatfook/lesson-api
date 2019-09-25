
"use strict";

const Controller = require("./baseController.js");

// const {
// 	TRADE_TYPE_BEAN,
// 	TRADE_TYPE_COIN,
// } = consts;

class TradesController extends Controller {
	// index() {

	// }
	//
	get modelName() {
		return "Trades";
	}
}

module.exports = TradesController;
