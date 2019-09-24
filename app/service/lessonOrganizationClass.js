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

	/**
	 * 根据条件更新
	 * @param {*} params 
	 * @param {*} condition 
	 */
	async updateByCondition(params, condition) {
		return await this.ctx.model.LessonOrganizationClass.update(params, { where: condition });
	}
}

module.exports = LessonOrganizationClassService;