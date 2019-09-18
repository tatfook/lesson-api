"use strict";

const Service = require("../core/service.js");

class PackageLessonService extends Service {
	/**
 	* 查找这些packageId分别有多少Lesson数量
 	* @param {*} packageIds 
 	*/
	async getLessonCountByPackageIds(packageIds = []) {
		if (packageIds.length === 0) return {};

		let list = await this.ctx.model.PackageLesson.getLessonCountByPackageIds2(packageIds);

		const count = {};

		list.forEach(r => {
			count[r.packageId] = r.count;
		});

		return count;
	}

	/**
	 * 通过条件获取packageLesson
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.PackageLesson.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
}

module.exports = PackageLessonService;
