"use strict";

const Service = require("../core/service.js");

class LessonOrganizationLogService extends Service {
	/**
	 * 创建classroomLog
	 * @param {*} params 必选，对象
	 */
	async classroomLog(params) {
		return await this.ctx.model.LessonOrganizationLog.classroomLog(params);
	}
}

module.exports = LessonOrganizationLogService;