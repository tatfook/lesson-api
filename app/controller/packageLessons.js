// const axios = require("axios");
// const _ = require("lodash");
const Controller = require("../core/baseController.js");

class PackageLessonsController extends Controller {
	get modelName() {
		this.modelName = "packageLessons";
		return this.modelName;
	}
}

module.exports = PackageLessonsController;
