"use strict";

const _ = require("lodash");
const Service = require("egg").Service;
const Err = require("../common/err");

class TeacherService extends Service {
	/**
	 * 
	 * @param {*} userId 
	 */
	async isAllowTeach(userId) {
		return await this.ctx.model.Teacher.isAllowTeach(userId);
	}


}

module.exports = TeacherService;