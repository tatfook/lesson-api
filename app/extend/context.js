
module.exports = {
	async log(text) {
		const config = this.app.config.self;

		if (!config.log) return;

		await this.model.logs.create({ text });
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
