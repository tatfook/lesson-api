"use strict";

module.exports = {
	async log(text) {
		const config = this.app.config.self;

		if (!config.log) return;

		await this.model.Log.create({ text });
	},
	getParams() {
		return _.merge({}, this.request.body, this.query, this.params);
	}
};
