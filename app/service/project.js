"use strict";

const Service = require("../common/service.js");

class ProjectService extends Service {
	/**
	 * 通过条件获取package
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Project.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 根据条件获取全部记录
	 * @param {*} condition 
	 * @param {*} order 排序
	 */
	async getAllByCondition(condition, order) {
		let list = await this.ctx.model.Project.findAll({ where: condition, order });
		return list ? list.map(r => r.get()) : [];
	}
}

module.exports = ProjectService;