"use strict";

const Service = require("../common/service.js");

class LessonService extends Service {
	/**
	 * 通过条件获取Lesson
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Lesson.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
}

module.exports = LessonService;