"use strict";

const Controller = require("./baseController.js");

class PackageLessonsController extends Controller {
	get modelName() {
		return "packageLessons";
	}
}

module.exports = PackageLessonsController;
