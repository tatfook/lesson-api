
// const joi = require("joi");
const _ = require("lodash");
const Controller = require("./baseController.js");
const { CLASS_MEMBER_ROLE_ADMIN } = require("../common/consts.js");

/**
 * 把机构有关的表，都要移到lesson-dev里面来
 */
const LessonOrganization = class extends Controller {
	get modelName() {
		return "lessonOrganizations";
	}

	async token() {
		const { userId, username } = this.authenticated();
		const { organizationId } = this.validate({ organizationId: "number" });
		const members = await this.model.LessonOrganizationClassMember.findAll({
			where: {
				organizationId, memberId: userId
			}
		}).then(list => list.map(o => o.toJSON()));

		if (members.length === 0) return this.throw(400);
		let roleId = 0;
		_.each(members, o => { roleId = roleId | o.roleId; });
		const config = this.app.config.self;
		const token = this.app.util.jwt_encode({
			userId,
			roleId,
			username,
			organizationId,
		}, config.secret, config.tokenExpire || 3600 * 24 * 2);

		await this.ctx.service.user.setToken(userId, token);

		return this.success(token);
	}

	async login() {
		let { username, password, organizationId, organizationName } = this.validate({ username: "string", password: "string" });
		const user = await this.ctx.keepworkModel.Users.findOne({
			where: {
				[this.ctx.keepworkModel.Op.or]: [{ username: username }, { cellphone: username }, { email: username }],
				password: this.app.util.md5(password)
			}
		}).then(o => o && o.toJSON());

		if (!user) return this.fail(1);
		if (!organizationId) {
			if (!organizationName) return this.throw(400);
			const organ = await this.model.LessonOrganization.findOne({ where: { name: organizationName }}).then(o => o && o.toJSON());
			if (!organ) return this.throw(400);
			organizationId = organ.id;
		}

		const curtime = new Date();
		const members = await this.model.LessonOrganizationClassMember.findAll({
			include: [
				{
					as: "lessonOrganizationClasses",
					model: this.model.LessonOrganizationClass,
					where: {
						// begin: {$lte: curtime},
						end: { $gte: curtime },
					},
					required: false,
				}
			],
			where: { organizationId, memberId: user.id }
		}).then(list => list.map(o => o.toJSON())
			.filter(o => ~~o.classId === 0 || o.lessonOrganizationClasses));

		// if (members.length === 0) return this.throw(400, "成员不存在");// 成员不存在允许登录

		let roleId = 0;
		_.each(members, o => { roleId = roleId | o.roleId; });

		const config = this.app.config.self;
		const tokenExpire = config.tokenExpire || 3600 * 24 * 2;
		const token = this.app.util.jwt_encode({
			userId: user.id,
			roleId: roleId,
			username: user.username,
			organizationId: organizationId,
		}, config.secret, tokenExpire);

		user.token = token;
		user.roleId = roleId;
		user.organizationId = organizationId;
		delete user.password;

		await this.ctx.service.user.setToken(user.id, token);

		return this.success(user);
	}

	async index() {
		const { userId } = this.authenticated();
		const sql = `select organizationId from lessonOrganizationClassMembers where memberId = ${userId} group by organizationId`;
		const ids = await this.model.query(sql, { type: this.model.QueryTypes.SELECT }).then(list => list.map(o => o.organizationId));
		const list = await this.model.LessonOrganization.findAll({ where: { id: { $in: ids }}}).then(list => list.map(o => o.toJSON()));
		return this.success(list);
	}

	async show() {
		const { id } = this.validate({ id: "number" });

		const organ = await this.model.LessonOrganization.findOne({ where: { id }});
		if (!organ) return this.throw(404);

		return this.success(organ);
	}

	async getByUrl() {
		const { url } = this.validate({ url: "string" });

		const organ = await this.model.LessonOrganization.findOne({ where: { loginUrl: url }});
		if (!organ) return this.throw(404);

		return this.success(organ);
	}

	async getByName() {
		const { name } = this.validate({ name: "string" });

		const organ = await this.model.LessonOrganization.findOne({ where: { name }});
		if (!organ) return this.throw(404);

		return this.success(organ);
	}

	async create() {
		this.adminAuthenticated();

		const params = this.validate();

		const organ = await this.model.LessonOrganization.create(params).then(o => o && o.toJSON());
		if (!organ) return this.throw(500);

		if (params.packages) {
			const packages = _.map(params.packages, pkg => ({
				organizationId: organ.id,
				classId: 0,
				packageId: pkg.packageId,
				lessons: pkg.lessons,
			}));
			await this.model.LessonOrganizationPackage.bulkCreate(packages);
		}

		if (params.usernames) {
			const users = await this.ctx.keepworkModel.Users.findAll({
				where: {
					username: { [this.model.Op.in]: params.usernames }
				}
			}).then(list => _.map(list, o => o.toJSON()));

			const members = _.map(users, o => ({
				classId: 0,
				organizationId: organ.id,
				memberId: o.id,
				roleId: CLASS_MEMBER_ROLE_ADMIN,
			}));
			await this.model.LessonOrganizationClassMember.bulkCreate(members);
		}

		return this.success(organ);
	}

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

	// 禁止更新
	async update() {
		const params = this.validate({ id: "number" });
		const id = params.id;

		const organ = await this.model.LessonOrganization.findOne({ where: { id }});
		if (!organ) return this.throw(400);

		delete params.userId;
		if (this.ctx.state.admin && this.ctx.state.admin.userId) {
			await this.model.LessonOrganization.update(params, { where: { id }});
		} else {
			const { userId, roleId = 0, username } = this.authenticated();
			if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.throw(411, "无效token");
			await this.model.LessonOrganization.update(params, { where: { id }});

			if (params.privilege && organ.privilege !== params.privilege) {
				await this.model.LessonOrganizationLog.create({
					organizationId: id,
					type: "系统",
					description: params.privilege === 0 ? "不允许任课教师管理学生信息" : "允许任课教师管理学生信息",
					handleId: userId,
					username,
				});
			}
		}

		if (params.packages) {
			await this.model.LessonOrganizationPackage.destroy({ where: { organizationId: id, classId: 0 }});
			const datas = _.map(params.packages, pkg => ({
				organizationId: id,
				classId: 0,
				packageId: pkg.packageId,
				lessons: pkg.lessons,
			}));
			await this.model.LessonOrganizationPackage.bulkCreate(datas);
			await this.fixedClassPackage(id, params.packages);
		}

		if (params.endDate) {
			await this.model.LessonOrganizationClass.update({ end: params.endDate }, {
				where: {
					organizationId: id,
					end: { $gt: params.endDate },
				}
			});
		}

		if (params.usernames) {
			await this.model.LessonOrganizationClassMember.destroy({ where: { classId: 0, organizationId: id }});
			const users = await this.ctx.keepworkModel.Users.findAll({
				where: { username: { [this.ctx.keepworkModel.Op.in]: params.usernames }}
			}).then(list => _.map(list, o => o.toJSON()));

			const members = _.map(users, o => ({
				classId: 0,
				organizationId: id,
				memberId: o.id,
				roleId: CLASS_MEMBER_ROLE_ADMIN,
			}));
			await this.model.LessonOrganizationClassMember.bulkCreate(members);
		}

		return this.success("ok");
	}

	mergePackages(list = [], roleId) {
		const pkgmap = {};
		// 合并课程
		_.each(list, o => {
			if (roleId && o.lessonOrganizationClassMembers && (!(o.lessonOrganizationClassMembers.roleId & roleId))) return;
			// if (o.lessonOrganizationClasses && new Date(o.lessonOrganizationClasses.end).getTime() < new Date().getTime()) return;
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

	// 课程包
	async packages() {
		const { userId, organizationId } = this.authenticated();
		const { classId = 0, roleId = 67 } = this.validate({ classId: "number_optional", roleId: "number_optional" });

		let list = [];
		// const curtime = new Date();
		if (classId) {
			list = await this.model.LessonOrganizationPackage.findAll({
				where: {
					organizationId,
					classId,
				},
			}).then(list => _.map(list, o => o.toJSON()));
		} else {
			list = await this.model.LessonOrganizationPackage.findAll({
				include: [
					{
						as: "lessonOrganizationClassMembers",
						model: this.model.LessonOrganizationClassMember,
						where: {
							memberId: userId,
							classId: roleId & CLASS_MEMBER_ROLE_ADMIN ? { $gte: 0 } : { $gt: 0 }
						},
					},
					{
						as: "lessonOrganizationClasses",
						model: this.model.LessonOrganizationClass,
					},
				],
				where: {
					organizationId,
				}
			}).then(list => _.map(list, o => o.toJSON()));
		}
		// console.log(list);

		list = this.mergePackages(list, roleId);

		for (let i = 0; i < list.length; i++) {
			const pkg = list[i];
			const ids = _.map(pkg.lessons, o => o.lessonId);
			const lrs = await this.app.model.UserLearnRecord.findAll({
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

		const pkgIds = _.map(list, o => o.packageId);
		const pkgs = await this.app.model.Package.findAll({
			where: { id: { [this.model.Op.in]: pkgIds }}
		}).then(list => _.map(list, o => o.toJSON()));

		if (classId) {
			const classrooms = await this.app.model.Classroom.findAll({
				where: { userId, classId, packageId: { $in: pkgIds }}
			}).then(list => list.map(o => o.toJSON()));

			_.each(list, o => {
				const cls = classrooms.filter(c => ~~c.packageId === ~~o.packageId);
				const c = _.orderBy(cls, ["createdAt"], ["desc"])[0];
				if (c) o.lastTeachTime = c.createdAt;
			});
		}
		_.each(list, o => { o.package = _.find(pkgs, p => ~~p.id === ~~o.packageId); });

		return this.success(list);
	}

	async getPackage(packageId, classId, roleId) {
		const { userId, organizationId } = this.authenticated();
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

		list = this.mergePackages(list);

		return list[0];
	}

	// 课程包详情页
	async packageDetail() {
		const { userId } = this.authenticated();
		const { packageId, classId, roleId = 1 } = this.validate({ packageId: "number", "classId": "number_optional", roleId: "number_optional" });

		const pkg = await this.getPackage(packageId, classId, roleId);
		if (!pkg) return this.throw(400);

		const pkginfo = await this.app.model.Package.findOne({ where: { id: pkg.packageId }}).then(o => o && o.toJSON());
		const lessonIds = _.map(pkg.lessons, o => o.lessonId);
		const lessons = await this.app.model.Lesson.findAll({
			where: { id: { [this.model.Op.in]: lessonIds }}
		}).then(list => _.map(list, o => o.toJSON()));

		_.each(pkg.lessons, o => { o.lesson = _.find(lessons, l => l.id === o.lessonId); });
		// 授课记录
		const classrooms = await this.app.model.Classroom.findAll({
			attributes: ["packageId", "lessonId", "classId"],
			where: {
				userId,
				classId,
				packageId,
				lessonId: {
					[this.model.Op.in]: lessonIds,
				},
			}
		});
		const learnRecords = await this.app.model.LearnRecord.findAll({
			attributes: ["packageId", "lessonId", "classId"],
			where: {
				userId,
				packageId,
				state: 1,
				lessonId: {
					[this.model.Op.in]: lessonIds,
				},
			}
		});

		pkg.package = pkginfo;

		_.each(pkg.lessons, o => {
			o.isTeached = _.find(classrooms, c => ~~c.lessonId === ~~o.lessonId) ? true : false;
			o.isLearned = _.find(learnRecords, l => ~~l.lessonId === ~~o.lessonId) ? true : false;
		});

		return this.success(pkg);
	}

	// 课程推荐
};

module.exports = LessonOrganization;
