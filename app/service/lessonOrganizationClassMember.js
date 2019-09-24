"use strict";

const Service = require("../common/service.js");

class LessonOrganizationClassMemberService extends Service {
	/**
 	* 通过条件获取lessonOrganizationClassMember
 	* @param {*} condition  必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonOrganizationClassMember.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 根据条件查找全部的记录
	 * @param {*} condition 必选 对象
	 */
	async getAllByCondition(condition) {
		let list = await this.ctx.model.LessonOrganizationClassMember.findAll({ where: condition });
		return list ? list.map(r => r.get()) : [];
	}

	/**
	 * 根据条件查找全部的记录，并且带连表查询
	 * @param {*} include 关联表
	 * @param {*} condition 必选 对象
	 */
	async getAllAndExtraByCondition(include, condition) {
		const list = await this.ctx.model.LessonOrganizationClassMember.findAll({
			include,
			where: condition
		});

		return list ? list.map(r => r.get()) : [];
	}

	/**
 	* 根据条件删除机构成员
 	* @param {*} condition 
 	*/
	async destroyByCondition(condition) {
		return await this.ctx.model.LessonOrganizationClassMember.destroy({ where: condition });
	}

	/**
	 * 根据条件更新
	 * @param {*} params 更新的字段
	 * @param {*} condition 条件
	 */
	async updateByCondition(params, condition) {
		return await this.ctx.model.LessonOrganizationClassMember.update(params, { where: condition });
	}

	/**
	 * 
	 */
	async createMember(params) {
		const ret = await this.ctx.model.LessonOrganizationClassMember.create(params);
		return ret ? ret.get() : undefined;
	}
}

module.exports = LessonOrganizationClassMemberService;