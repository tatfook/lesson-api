"use strict";

const Service = require("../common/service.js");


class SubjectService extends Service {
	/**
	 * 
	 * @param {*} queryOptions 排序参数
	 * @param {*} condition 查询条件
	 */
	async findAllByCondition(queryOptions, condition) {
		const list = await this.ctx.model.Subject.findAll({ ...queryOptions, where: condition });
		return list ? list.map(r => r.get()) : [];
	}

	/**
 	* 通过条件获取package
 	* @param {*} condition  必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.Subject.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 创建subject
	 * @param {*} params 
	 */
	async createSubject(params) {
		return await this.ctx.model.Subject.create(params);
	}

	/**
	 * 根据条件更新
	 * @param {*} params 
	 * @param {*} condition 
	 */
	async updateByCondition(params, condition) {
		return await this.ctx.model.Subject.update(params, { where: condition });
	}

	/**
	 *  根据条件删除
	 * @param {*} condition 
	 */
	async destoryByCondition(condition) {
		return await this.ctx.model.Subject.destroy({ where: condition })
	}
}

module.exports = SubjectService;