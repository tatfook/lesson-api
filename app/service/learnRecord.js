"use strict";

const Service = require("../common/service.js");
const Err = require("../common/err");
const { CLASSROOM_STATE_USING } = require("../common/consts");

class LearnRecordService extends Service {
	/**
	 * 通过条件获取learnRecord
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
	 * 批量更新课堂学习记录
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

	/**
	 * 分页查找学习记录
	 * @param {*} queryOptions 分页和排序参数
	 * @param {*} condition 查询条件
	 */
	async findLearnRecordAndCount(queryOptions, condition) {
		return await this.ctx.model.LearnRecord.findAndCountAll({ ...queryOptions, where: condition });
	}

	/**
	 * 更新单个学习记录，会有相关状态检查
	 * @param {*} learnRecordId 学习记录id 
	 * @param {*} userId 用户id
	 * @param {*} params 要更新的字段
	 */
	async updateLearnRecord(learnRecordId, userId, params) {
		const lr = await this.getByCondition({ id: learnRecordId, userId });
		if (!lr) return this.ctx.throw(400, Err.ARGS_ERR);

		// 判断是不是在上课中
		if (lr.classroomId) {
			const classroom = await this.ctx.service.classroom.getByCondition({ id: lr.classroomId });

			if (!classroom || (classroom && classroom.status !== CLASSROOM_STATE_USING)) {
				return this.ctx.throw(400, Err.ALREADY_DISMISS);
			}
		}

		params.id = learnRecordId;
		params.userId = userId;

		delete params.packageId;
		delete params.lessonId;
		delete params.classroomId;

		await this.ctx.model.LearnRecord.updateLearnRecord(params);
	}

	/**
	 * 无检查更新学习记录,这里加个admin前缀
	 * @param {*} params 要更新的字段
	 */
	async adminUpdateLearnRecord(params) {
		return await this.ctx.model.LearnRecord.updateLearnRecord(params);
	}

	/**
	 * 通过条件删除学习记录
	 * @param {*} condition 必选
	 */
	async destroyByCondition(condition) {
		return await this.ctx.model.LearnRecord.destroy({ where: condition });
	}

	/**
	 * 根据条件查找全部的学习记录
	 * @param {*} condition 
	 */
	async findAllByCondition(condition) {
		const ret = await this.ctx.model.LearnRecord.findAll({ where: condition });
		return ret.map(r => r.get());
	}
}

module.exports = LearnRecordService;