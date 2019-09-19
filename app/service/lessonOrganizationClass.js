"use strict";

const Service = require("../common/service.js");

class LessonOrganizationClassService extends Service {
	/**
	 * 通过条件获取class
	 * @param {*} condition 必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonOrganizationClass.findOne({
			where: condition
		});
		if (data) data = data.get({ plain: true });

		return data;
	}

}

module.exports = LessonOrganizationClassService;