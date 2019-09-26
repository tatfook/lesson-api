"use strict";

const Service = require("../common/service.js");

class LessonSkillService extends Service {
	/**
	 * 根据lessonId获取评分情况
	 * @param {*} lessonId 
	 */
	async getSkillsByLessonId(lessonId) {
		return await this.ctx.model.LessonSkill.getSkillsByLessonId(lessonId);
	}

	/**
	 * 根据条件删除技能评分
	 * @param {*} condition 
	 */
	async destroyByCondition(condition) {
		return await this.ctx.model.LessonSkill.destroy({ where: condition });
	}
};

module.exports = LessonSkillService;