"use strict";

const Service = require("../common/service.js");
const { TOKEN_DEFAULT_EXPIRE, CLASS_MEMBER_ROLE_ADMIN } = require("../common/consts.js");
const _ = require("lodash");
const Err = require("../common/err");

class LessonOrganizationService extends Service {

	/**
	 * 合并这个人在这个机构中的全部角色,并且生成一个token
	 * @param {*} params 结构：{members,userId,username,organizationId}
	 * @param {*} config token 的密钥，过期时间等
	 */
	async mergeRoleIdAndGenToken(params, config) {
		let roleId = 0;
		_.each(params.members, o => { roleId = roleId | o.roleId; });

		// 生成token
		const token = this.ctx.helper.jwtEncode({
			userId: params.userId,
			roleId,
			username: params.username,
			organizationId: params.organizationId,
		}, config.secret, config.tokenExpire || TOKEN_DEFAULT_EXPIRE);

		return { token, roleId };
	}

	/**
	 * 根据条件获取机构
	 * @param {*} condition 必选 对象
	 */
	async getByCondition(condition) {
		const ret = await this.ctx.model.LessonOrganization.findOne({ where: condition });
		return ret ? ret.get() : undefined;
	}

	/**
	 * 获取用户加入的机构
	 * @param {*} userId 
	 */
	async getUserOrganizations(userId) {
		const sql = `
		SELECT DISTINCT o.* FROM lessonOrganizations o
		LEFT JOIN lessonOrganizationClassMembers m ON o.id = m.organizationId 
		WHERE m.memberId = ${userId}
		`;
		const list = await this.ctx.model.query(sql, { type: this.ctx.model.QueryTypes.SELECT });
		return list;
	}

	/**
	 * 创建机构，如果传了usernames,packages，会创建机构管理员和机构package
	 * @param {*} params {usernames,packages,...}
	 */
	async createOrganization(params) {
		const organ = await this.ctx.model.LessonOrganization.create(params).then(o => o && o.toJSON());
		if (!organ) return this.ctx.throw(500, Err.DB_ERR);

		// 创建机构package
		if (params.packages) {
			await this.createPackageForOrganization(params.packages, organ.id);
		}

		// 添加管理员
		if (params.usernames) {
			await this.createAdminForOrganization(params.usernames, organ.id);
		}

		return organ;
	}

	/**
	 * 给机构增加packages
	 * @param {*} packages 
	 * @param {*} organizationId 
	 */
	async createPackageForOrganization(packages, organizationId) {
		const p = _.map(packages, pkg => ({
			organizationId,
			classId: 0,
			packageId: pkg.packageId,
			lessons: pkg.lessons,
		}));
		await this.ctx.model.LessonOrganizationPackage.bulkCreate(p);
	}

	/**
	 * 给机构增加admin成员
	 * @param {*} usernames 
	 * @param {*} organizationId 
	 */
	async createAdminForOrganization(usernames, organizationId) {
		const users = await this.ctx.keepworkModel.Users.findAll({
			where: {
				username: { [this.ctx.model.Op.in]: usernames }
			}
		}).then(list => _.map(list, o => o.toJSON()));

		const members = _.map(users, o => ({
			classId: 0,
			organizationId,
			memberId: o.id,
			roleId: CLASS_MEMBER_ROLE_ADMIN,
		}));
		await this.model.LessonOrganizationClassMember.bulkCreate(members);
	}

	/**
	 * 给这个organization更新一下packages
	 * @param {*} organizationId 
	 * @param {*} packages 
	 */
	async fixedClassPackage(organizationId, packages) {
		const pkgs = await this.model.LessonOrganizationPackage.findAll({
			where: { organizationId, classId: { $gt: 0 }}
		}).then(list => list.map(o => o.toJSON()));

		const datas = [];
		_.each(pkgs, o => {
			const pkg = _.find(packages, p => ~~p.packageId === ~~o.packageId);
			if (!pkg) return;
			const lessons = [];
			_.each(o.lessons, l => {
				const pl = _.find(pkg.lessons, pl => ~~pl.lessonId === ~~l.lessonId);
				if (pl) lessons.push(pl);
			});
			o.lessons = lessons;
			datas.push(o);
		});

		await this.model.LessonOrganizationPackage.destroy({ where: { organizationId, classId: { $gt: 0 }}});
		await this.model.LessonOrganizationPackage.bulkCreate(datas);
	}

	/**
	 * 根据organizationId更新
	 * @param {*} params 
	 * @param {*} organizationId 
	 * @param {*} authParams 
	 */
	async updateOrganization(params, organizationId, authParams) {
		if (this.ctx.state.admin && this.ctx.state.admin.userId) {
			await this.ctx.model.LessonOrganization.update(params, { where: { id: organizationId }});
		} else {
			const { userId, roleId = 0, username } = authParams;
			if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.ctx.throw(403, Err.AUTH_ERR);
			await this.ctx.model.LessonOrganization.update(params, { where: { id: organizationId }});

			if (params.privilege && organ.privilege !== params.privilege) {
				await this.ctx.model.LessonOrganizationLog.create({
					organizationId,
					type: "系统",
					description: params.privilege === 0 ? "不允许任课教师管理学生信息" : "允许任课教师管理学生信息",
					handleId: userId,
					username,
				});
			}
		}
	}

	/**
	 * ???
	 * @param {*} packageId 
	 * @param {*} classId 
	 * @param {*} roleId 
	 */
	async getPackage(packageId, classId, roleId, userId, organizationId) {
		let list = [];
		if (classId !== undefined) {
			list = await this.model.LessonOrganizationPackage.findAll({
				where: { organizationId, packageId, classId }
			}).then(list => _.map(list, o => o.toJSON()));
		} else {
			const classIds = await this.model.lessonOrganizationClassMember.getAllClassIds({ memberId: userId, roleId, organizationId });
			list = await this.model.LessonOrganizationPackage.findAll({
				where: {
					organizationId,
					packageId,
					classId: { $in: classIds },
				}
			}).then(list => _.map(list, o => o.toJSON()));
		}

		list = this.ctx.service.lessonOrganizationPackage.mergePackages(list);

		return list[0];
	}


	async getPackageDetail(packageId, classId, roleId, userId, organizationId) {
		const pkg = await this.getPackage(packageId, classId, roleId, userId, organizationId);
		if (!pkg) return this.ctx.throw(400, Err.ARGS_ERR);

		const pkginfo = await this.ctx.model.Package.findOne({ where: { id: pkg.packageId }}).then(o => o && o.toJSON());
		const lessonIds = _.map(pkg.lessons, o => o.lessonId);
		const lessons = await this.ctx.model.Lesson.findAll({
			where: { id: { [this.ctx.model.Op.in]: lessonIds }}
		}).then(list => _.map(list, o => o.toJSON()));

		_.each(pkg.lessons, o => { o.lesson = _.find(lessons, l => l.id === o.lessonId); });
		// 授课记录
		const classrooms = await this.ctx.model.Classroom.findAll({
			attributes: ["packageId", "lessonId", "classId"],
			where: {
				userId,
				classId,
				packageId,
				lessonId: {
					[this.ctx.model.Op.in]: lessonIds,
				},
			}
		});
		const learnRecords = await this.ctx.model.LearnRecord.findAll({
			attributes: ["packageId", "lessonId", "classId"],
			where: {
				userId,
				packageId,
				state: 1,
				lessonId: {
					[this.ctx.model.Op.in]: lessonIds,
				},
			}
		});

		pkg.package = pkginfo;

		_.each(pkg.lessons, o => {
			o.isTeached = _.find(classrooms, c => ~~c.lessonId === ~~o.lessonId) ? true : false;
			o.isLearned = _.find(learnRecords, l => ~~l.lessonId === ~~o.lessonId) ? true : false;
		});
		return pkg;
	}

	/**
	 * 获取机构已用人数？？
	 * @param {*} organizationId 
	 */
	async getOrganMemberCount(organizationId) {
		return await this.ctx.model.LessonOrganization.getUsedCount(organizationId);
	}

	/**
 	* 获取机构学生的人数
 	* @param {*} organizationId 
 	*/
	async getStudentCount(organizationId) {
		return await this.ctx.model.LessonOrganization.getStudentCount(organizationId);
	}

	/**
	 * 获取教师列表
	 * @param {*} organizationId 
	 * @param {*} classId 
	 */
	async getTeachers(organizationId, classId) {
		return await this.ctx.model.LessonOrganization.getTeachers(organizationId, classId);
	}

	/**
	 * 
	 * @param {*} organizationId 
	 * @param {*} classId 
	 */
	async getMembers(organizationId, roleId, classId) {
		return await this.ctx.model.LessonOrganization.getMembers(organizationId, roleId, classId);
	}
}

module.exports = LessonOrganizationService;