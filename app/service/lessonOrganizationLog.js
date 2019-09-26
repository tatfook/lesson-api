"use strict";

const Service = require("../common/service.js");

class LessonOrganizationLogService extends Service {
	/**
	 * 创建classroomLog
	 * @param {*} params 必选，对象
	 */
	async classroomLog(params) {
		return await this.ctx.model.LessonOrganizationLog.classroomLog(params);
	}

	/**
	 *  创建classLog
	 * @param {*} params 
	 */
	async classLog(params) {
		return await this.ctx.model.LessonOrganizationLog.classLog(params);
	}

	/**
 	*  创建studentLog
 	* @param {*} params 
 	*/
	async studentLog(params) {
		return await this.ctx.model.LessonOrganizationLog.studentLog(params);
	}

}

module.exports = LessonOrganizationLogService;