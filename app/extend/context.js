
module.exports = {
	async log(text) {
		const config = this.app.config.self;

		if (!config.log) return;

		await this.model.logs.create({ text });
	},
	getParams() {
		return _.merge({}, this.request.body, this.query, this.params);
	}

	// get model() {
	// return this.app.model;
	// }
	// get config() {
	// return this.app.config.self;
	// }

	// get util() {
	// return this.app.util;
	// }
};
