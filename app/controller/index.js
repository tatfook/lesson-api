
// const axios = require("axios");
const _ = require("lodash");
const Controller = require("../core/baseController.js");

class IndexController extends Controller {
	// get
	async index() {
		const count = await this.model.Classroom.getPackageWeekClassroomCount(56);
		this.success(count);
	}

	show() {
		this.ctx.throw(400);
	}

	// async create() {
	// }

	// async update() {
	// }

	// async destroy() {

	// }

	async config() {
		const params = this.ctx.request.body;

		this.ensureAdmin();

		_.merge(this.app.config.self, params);

		return this.success("OK");
	}
}

module.exports = IndexController;
