"use strict";

const Service = require("../common/service.js");
// const Err = require("../common/err");

class LessonContentService extends Service {
	/**
	 * 发布课程
	 * @param {*} userId 
	 * @param {*} lessonId 课程ID
	 * @param {*} content 教案内容
	 * @param {*} courseware 课件内容
	 */
	async releaseLesson(userId, lessonId, content, courseware) {
		return await this.ctx.model.LessonContent.release(
			userId, lessonId, content, courseware
		);
	}

	/**
	 * 获取某个版本的教案内容
	 * @param {*} lessonId 
	 * @param {*} version 
	 */
	async getLessonContent(lessonId, version) {
		return await this.ctx.model.LessonContent.content(
			lessonId, version
		);
	}
}

module.exports = LessonContentService;