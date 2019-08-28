
// const joi = require("joi");
const _ = require("lodash");

const Controller = require("../core/baseController.js");

const {
	CLASS_MEMBER_ROLE_ADMIN
} = require("../core/consts.js");

const LessonOrganizationClass = class extends Controller {
	get modelName() {
		return "lessonOrganizationClasses";
	}

	async show() {
		const { id } = this.validate({ id: "number" });

		const organ = await this.model.lessonOrganizations.findOne({ where: { id } });

		return this.success(organ);
	}

	async history() {
		const { organizationId, roleId } = this.authenticated();
		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.throw(400, "无权限");

		const curtime = new Date();
		const count = await this.model.lessonOrganizationClasses.count({ where: { organizationId, end: { $lte: curtime } } });
		const list = await this.model.lessonOrganizationClasses.findAll({
			...this.queryOptions,
			include: [
				{
					as: "lessonOrganizationClassMembers",
					model: this.model.lessonOrganizationClassMembers,
					include: [
						{
							as: "users",
							attributes: ["id", "username", "nickname", "portrait"],
							model: this.model.users,
						},
					]
				},
			],
			where: {
				organizationId,
				end: {
					$lte: curtime,
				}
			}
		});

		return this.success({ count, rows: list });
	}

	async index() {
		const { userId, organizationId } = this.authenticated();
		const { roleId } = this.validate({ roleId: "number_optional" });

		if (!roleId) {
			const list = await this.model.lessonOrganizationClasses.findAll({ where: { organizationId } });
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
		const list = await this.model.lessonOrganizationClasses.findAll({
			where: {
				id: { $in: ids },
				end: { $gte: curtime },
			},
		});

		return this.success(list);
	}

	async create() {
		const { roleId, organizationId } = this.authenticated();
		const params = this.validate({ name: "string" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");

		params.organizationId = organizationId;
		const packages = params.packages || [];

		const cls = await this.model.lessonOrganizationClasses.create(params).then(o => o && o.toJSON());
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

		await this.model.lessonOrganizationPackages.bulkCreate(datas);

		return this.success(cls);
	}

	// 禁止更新
	async update() {
		const { roleId, organizationId } = this.authenticated();
		const params = this.validate({ id: "number" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");
		delete params.organizationId;

		const cls = await this.model.lessonOrganizationClasses.findOne({ where: { id: params.id } }).then(o => o && o.toJSON());
		if (!cls) return this.throw(400);
		// 针对过期班级做检查
		if (new Date(cls.end).getTime() < new Date().getTime()) {
			const organ = await this.model.lessonOrganizations.findOne({ where: { id: cls.organizationId } }).then(o => o && o.toJSON());
			await this.model.lessonOrganizationClasses.update(params, { where: { id: params.id } });
			const studentCount = await this.model.lessonOrganizations.getStudentCount(cls.organizationId);
			if (studentCount > organ.count) {
				// 还原修改
				await this.model.lessonOrganizationClasses.update(cls, { where: { id: params.id } });
				return this.fail({ code: -1, message: "人数已超上限" });
				//return this.throw(400, {code: -1, message:"人数已超上限"});
			}
		} else {
			await this.model.lessonOrganizationClasses.update(params, { where: { id: params.id } });
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
			await this.model.lessonOrganizationPackages.destroy({ where: { classId: params.id, organizationId } });
			await this.model.lessonOrganizationPackages.bulkCreate(datas);
		}

		return this.success();
	}

	// 删除班级
	async destroy() {
		const { roleId, organizationId } = this.authenticated();
		const { id } = this.validate({ id: "number" });
		if (!organizationId) return this.throw(400);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN == 0) return this.throw(411, "无权限");

		await this.model.lessonOrganizationClasses.destroy({ where: { id, organizationId } });
		await this.model.lessonOrganizationPackages.destroy({ where: { classId: id, organizationId } });

		return this.success();
	}
}

module.exports = LessonOrganizationClass;
