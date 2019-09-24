"use strict";

const Service = require("../common/service.js");
const { TOKEN_DEFAULT_EXPIRE, CLASS_MEMBER_ROLE_ADMIN } = require("../common/consts.js");
const _ = require("lodash");
const Err = require("../common/err");


class LessonOrganizationPackageService extends Service {
	/**
	 * 根据条件删除机构课程包
	 * @param {*} condition 
	 */
	async destroyByCondition(condition) {
		return await this.ctx.model.LessonOrganizationPackage.destroy(condition);
	}

	async findAllByCondition(condition) {
		const ret = await this.ctx.model.LessonOrganizationPackage.findAll({ where: condition });
		return ret ? ret.map(r => r.get()) : [];
	}

	/**
	 * 
	 * @param {*} include 
	 * @param {*} condition 
	 */
	async findAllAndExtraByCondition(include, condition) {
		const ret = await this.ctx.model.LessonOrganizationPackage.findAll({ include, where: condition });
		return ret ? ret.map(r => r.get()) : [];
	}

	/**
	 * 查询课程包入口
	 * @param {*} organizationId 
	 * @param {*} classId 
	 * @param {*} userId 
	 * @param {*} roleId 
	 */
	async findAllEntrance(organizationId, classId, userId, roleId) {
		let list = [];

		if (classId) {
			list = await this.findAllByCondition({ organizationId, classId });
		} else {
			list = await this.findAllAndExtraByCondition([
				{
					as: "lessonOrganizationClassMembers",
					model: this.ctx.model.LessonOrganizationClassMember,
					where: {
						memberId: userId,
						classId: roleId & CLASS_MEMBER_ROLE_ADMIN ? { $gte: 0 } : { $gt: 0 }
					},
				},
				{
					as: "lessonOrganizationClasses",
					model: this.ctx.model.LessonOrganizationClass,
				},
			],
			{
				organizationId
			});
		}
		return list;
	}

	// 合并课程
	mergePackages(list = [], roleId) {
		const pkgmap = {};
		// 合并课程
		_.each(list, o => {
			if (roleId && o.lessonOrganizationClassMembers && (!(o.lessonOrganizationClassMembers.roleId & roleId))) return;

			if (pkgmap[o.packageId]) {
				pkgmap[o.packageId].lessons = (pkgmap[o.packageId].lessons || []).concat(o.lessons || []);
				pkgmap[o.packageId].lessons = _.uniqBy(pkgmap[o.packageId].lessons, "lessonId");
				if (pkgmap[o.packageId].lessonOrganizationClasses && o.lessonOrganizationClasses
					&& pkgmap[o.packageId].lessonOrganizationClasses.end < o.lessonOrganizationClasses.end) {
					pkgmap[o.packageId].lessonOrganizationClasses = o.lessonOrganizationClasses;
				}
			} else {
				pkgmap[o.packageId] = o;
			}
		});

		list = [];
		_.each(pkgmap, o => list.push(o));

		return list;
	}

	/**
	 * controller/lessonOrganization.js里面的packages方法用，暂且放这儿
	 * @param {*} packageList 
	 */
	async dealWithPackageList(packageList, roleId, userId, classId) {
		packageList = this.mergePackages(packageList, roleId);

		for (let i = 0; i < packageList.length; i++) {
			const pkg = packageList[i];
			const ids = _.map(pkg.lessons, o => o.lessonId);
			const lrs = await this.ctx.model.UserLearnRecord.findAll({
				where: {
					userId,
					packageId: pkg.packageId,
					lessonId: { $in: ids },
				}
			});
			_.each(pkg.lessons, o => {
				o.isLearned = _.find(lrs, lr => ~~lr.lessonId === ~~o.lessonId) ? true : false;
			});
		}

		const pkgIds = _.map(packageList, o => o.packageId);
		const pkgs = await this.ctx.model.Package.findAll({
			where: { id: { [this.ctx.model.Op.in]: pkgIds }}
		}).then(list => _.map(list, o => o.toJSON()));

		if (classId) {
			const classrooms = await this.ctx.model.Classroom.findAll({
				where: { userId, classId, packageId: { $in: pkgIds }}
			}).then(list => list.map(o => o.toJSON()));

			_.each(packageList, o => {
				const cls = classrooms.filter(c => ~~c.packageId === ~~o.packageId);
				const c = _.orderBy(cls, ["createdAt"], ["desc"])[0];
				if (c) o.lastTeachTime = c.createdAt;
			});
		}
		_.each(packageList, o => { o.package = _.find(pkgs, p => ~~p.id === ~~o.packageId); });

		return packageList;
	}

}

module.exports = LessonOrganizationPackageService;