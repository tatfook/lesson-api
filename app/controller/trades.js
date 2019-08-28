// const _ = require("lodash");
// const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

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
