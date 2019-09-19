"use strict";

const Service = require("../common/service.js");

class LearnRecordService extends Service {
	/**
	 * 通过条件获取classroom
	 * @param {*} condition 必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.LearnRecord.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 根据条件获取学习记录列表
	 * @param {*} condition 
	 */
	async getAllByCondition(condition) {
		let list = await this.ctx.model.LearnRecord.findAll({ where: condition });
		return list.map(r => r.get());
	}

	/**
	 * 创建课堂学习记录
	 * @param {*} params 
	 */
	async createLearnRecord(params) {
		return await this.ctx.model.LearnRecord.createLearnRecord(params);
	}

	/**
	 * 更新课堂学习记录
	 * @param {*} params 学习记录数组
	 * @param {*} classroomId 课堂id
	 */
	async batchUpdateLearnRecord(params, classroomId) {
		for (let i = 0; i < params.length; i++) {
			let record = params[i];
			if (!record.id) continue;

			record.classroomId = classroomId;
			await this.ctx.model.LearnRecord.updateLearnRecord(record);
		}
	}
}

module.exports = LearnRecordService;