// const axios = require("axios");
// const _ = require("lodash");
const email = require("../core/email.js");
const Controller = require("../core/baseController.js");

class EmailController extends Controller {
	// async index() {
	// }

	show() {
		this.ctx.throw(400);
	}

	async create() {
		const params = this.ctx.request.body;
		this.ctx.validate({
			to: "string",
			subject: "string",
			html: "string",
		}, params);

		const { to, subject, html, from } = params;
		const ok = await email(this.app)(to, subject, html, from);
		// const ok = await this.app.sendEmail(to, subject, html, params.from);

		return this.success(ok);
	}

	// async update() {
	// }

	// async destroy() {
	// }
}

module.exports = EmailController;
