"use strict";

const Service = require("../core/service.js");

class PackageService extends Service {
	/**
	 * 通过条件获取package
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Package.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
}

module.exports = PackageService;