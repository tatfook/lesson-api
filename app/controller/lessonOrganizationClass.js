
// const joi = require("joi");
const _ = require("lodash");

const Controller = require("./baseController.js");

const {
	CLASS_MEMBER_ROLE_ADMIN
} = require("../common/consts.js");

const LessonOrganizationClass = class extends Controller {
	get modelName() {
		return "lessonOrganizationClasses";
	}

	async show() {
		const { id } = this.validate({ id: "number" });

		const organ = await this.model.LessonOrganization.findOne({ where: { id } });

		return this.success(organ);
	}

	async history() {
		const { organizationId, roleId } = this.authenticated();
		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.throw(400, "无权限");

		const curtime = new Date();
		const count = await this.model.LessonOrganizationClass.count({ where: { organizationId, end: { $lte: curtime } } });
		const list = await this.model.LessonOrganizationClass.findAll({
			...this.queryOptions,
			include: [
				{
					as: "lessonOrganizationClassMembers",
					model: this.model.LessonOrganizationClassMember,
					// include: [
					// 	{
					// 		as: "users",
					// 		attributes: ["id", "username", "nickname", "portrait"],
					// 		model: this.model.users,
					// 	},
					// ]
				},
			],
			where: {
				organizationId,
				end: {
					$lte: curtime,
				}
			}
		}).map(r => r.get());

		const userIds = list.map(r => r.lessonOrganizationClassMembers)
			.map(r => r.map(rr => rr.get().memberId)).join().split(',');

		const users = await this.ctx.keepworkModel.Users.findAll({
			attributes: ["id", "username", "nickname", "portrait"],
			where: {
				id: {
					$in: userIds
				}
			}
		}).map(r => r.get());

		for (let i = 0; i < list.length; i++) {
			const members = list[i].lessonOrganizationClassMembers;
			for (let j = 0; j < members.length; j++) {
				members[j] = members[j].get();
				const index = _.findIndex(users, obj => obj.id === members[j].memberId);
				if (index > -1) members[j].users = users[index];
			}
		}
		return this.success({ count, rows: list });
	}

	async index() {
		const { userId, organizationId } = this.authenticated();
		const { roleId } = this.validate({ roleId: "number_optional" });

		if (!roleId) {
			const list = await this.model.LessonOrganizationClass.findAll({ where: { organizationId } });
			return this.success(list);
		}

		const sql = `select classId from lessonOrganizationClassMembers where organizationId = :organizationId and roleId & :roleId and memberId = :memberId`;
		const ids = await this.ctx.model.query(sql, {
			type: this.ctx.model.QueryTypes.SELECT,
			replacements: {
				organizationId,
				roleId,
				memberId: userId,
			}
		}).then(list => list.map(o => o.classId));

		const curtime = new Date();
		const list = await this.model.LessonOrganizationClass.findAll({
			where: {
				id: { $in: ids },
				end: { $gte: curtime },
			},
		});

		return this.success(list);
	}

	async create() {
		const { roleId, organizationId, userId, username } = this.authenticated();
		const params = this.validate({ name: "string" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");

		params.organizationId = organizationId;
		const packages = params.packages || [];

		const cls = await this.model.LessonOrganizationClass.create(params).then(o => o && o.toJSON());
		if (!cls) return this.throw(500);

		const datas = [];
		_.each(packages, pkg => {
			datas.push({
				organizationId,
				classId: cls.id,
				packageId: pkg.packageId,
				lessons: pkg.lessons,
			});
		})

		await this.model.LessonOrganizationPackage.bulkCreate(datas);

		this.model.LessonOrganizationLog.classLog({ organizationId, cls, params, action: "createClass", handleId: userId, username });

		return this.success(cls);
	}

	// 禁止更新
	async update() {
		const { roleId, organizationId, userId, username } = this.authenticated();
		const params = this.validate({ id: "number" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");
		delete params.organizationId;

		const cls = await this.model.LessonOrganizationClass.findOne({ where: { id: params.id } }).then(o => o && o.toJSON());
		if (!cls) return this.throw(400);
		// 针对过期班级做检查
		if (new Date(cls.end).getTime() < new Date().getTime()) {
			const organ = await this.model.LessonOrganization.findOne({ where: { id: cls.organizationId } }).then(o => o && o.toJSON());
			await this.model.LessonOrganizationClass.update(params, { where: { id: params.id } });
			const studentCount = await this.model.LessonOrganization.getStudentCount(cls.organizationId);
			if (studentCount > organ.count) {
				// 还原修改
				await this.model.LessonOrganizationClass.update(cls, { where: { id: params.id } });
				return this.fail({ code: -1, message: "人数已超上限" });
				//return this.throw(400, {code: -1, message:"人数已超上限"});
			}
		} else {
			await this.model.LessonOrganizationClass.update(params, { where: { id: params.id } });
		}

		if (params.packages) {
			const datas = [];
			_.each(params.packages, pkg => {
				datas.push({
					organizationId,
					classId: params.id,
					packageId: pkg.packageId,
					lessons: pkg.lessons,
				});
			})
			await this.model.LessonOrganizationPackage.destroy({ where: { classId: params.id, organizationId } });
			await this.model.LessonOrganizationPackage.bulkCreate(datas);
		}
		this.model.LessonOrganizationLog.classLog({ organizationId, cls, params, action: "updateClass", handleId: userId, username });
		return this.success('ok');
	}

	// 删除班级
	async destroy() {
		const { roleId, organizationId } = this.authenticated();
		const { id } = this.validate({ id: "number" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");

		await this.model.LessonOrganizationClass.destroy({ where: { id, organizationId } });
		await this.model.LessonOrganizationPackage.destroy({ where: { classId: id, organizationId } });

		return this.success('ok');
	}

	// 班级最近项目
	async latestProject() {
		const { organizationId } = this.authenticated();
		const { id } = this.validate({ id: "number" });

		const members = await this.model.lessonOrganizationClassMembers.findAll({
			include: [
				{
					as: "users",
					model: this.model.users,
					attributes: ["id", "username", "nickname", "portrait"],
				}
			],
			where: { organizationId, classId: id },
		}).then(list => list.map(o => o.toJSON()));
		if (members.length == 0) return this.success([]);
		const userIds = members.map(o => o.memberId);
		const projects = await this.model.projects.findAll({
			order: [["updatedAt", "desc"]],
			userId: { "$in": userIds },
			type: 0, // 只取 paracraft 
		}).then(list => list.map(o => o.toJSON()));

		_.each(members, m => m.projects = projects.filter(o => o.userId == m.memberId).slice(0, 2));

		return this.success(members);
	}
}

module.exports = LessonOrganizationClass;
