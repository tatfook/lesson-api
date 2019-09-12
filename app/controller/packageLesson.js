// const axios = require("axios");
// const _ = require("lodash");
const Controller = require("../core/baseController.js");

class PackageLessonsController extends Controller {
	get modelName() {
		return "packageLessons";
	}
}

module.exports = PackageLessonsController;
