
// const joi = require("joi");
const _ = require("lodash");

const Controller = require("../core/baseController.js");

const {
	CLASS_MEMBER_ROLE_STUDENT,
	CLASS_MEMBER_ROLE_ADMIN,
} = require("../core/consts.js");

const LessonOrganizationActivateCode = class extends Controller {
	get modelName() {
		return "lessonOrganizationActivateCodes";
	}

	async create() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ count: "number", classId: "number" });

		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}

		const classId = params.classId;
		const names = params.name || [];
		const count = params.count || names.length || 1;

		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.throw(411);

		const organ = await this.model.lessonOrganizations.getValidOrganizationById(organizationId);
		if (!organ) this.throw(400, "无效机构");

		const datas = [];
		for (let i = 0; i < count; i++) {
			datas.push({
				organizationId,
				classId,
				key: classId + "" + i + "" + (new Date()).getTime() + _.random(10, 99),
				extra: names.length > i ? { name: names[i] } : {},
			});
		}
		const list = await this.model.lessonOrganizationActivateCodes.bulkCreate(datas);
		return this.success(list);
	}

	async index() {
		let { organizationId, roleId, userId } = this.authenticated();
		const where = this.validate();

		if (where.organizationId && where.organizationId != organizationId) {
			organizationId = where.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.throw(400, "无权限");

		this.formatQuery(where);

		where.organizationId = organizationId;

		const data = await this.model.lessonOrganizationActivateCodes.findAndCountAll({
			...this.queryOptions,
			where,
			include: [
				{
					as: "lessonOrganizationClasses",
					model: this.model.lessonOrganizationClasses,
				}
			],
		});

		return this.success(data);
	}

	async activate() {
		const { userId, username } = this.authenticated();
		const { key, realname, organizationId } = this.validate({ key: "string", organizationId: "number" });

		const curtime = new Date().getTime();
		const data = await this.model.lessonOrganizationActivateCodes.findOne({
			where: { key, state: 0 }
		}).then(o => o && o.toJSON());
		if (!data) return this.fail({ code: 2, message: "无效激活码" });

		if (data.organizationId != organizationId) return this.fail({ code: 7, message: "激活码不属于这个机构" });

		const cls = await this.model.lessonOrganizationClasses.findOne({
			where: { id: data.classId }
		}).then(o => o && o.toJSON());

		if (!cls) return this.fail({ code: 2, message: "无效激活码" });
		const begin = new Date(cls.begin).getTime();
		const end = new Date(cls.end).getTime();
		if (curtime > end) return this.fail({ code: 3, message: "班级结束" });
		//if (curtime < begin) return this.fail({code:4, message:"班级未开始"});

		const organ = await this.model.lessonOrganizations.findOne({
			where: { id: data.organizationId, endDate: { $gt: new Date() } }
		}).then(o => o && o.toJSON());

		if (!organ) return this.fail({ code: 2, message: "无效机构" });

		const ms = await this.model.lessonOrganizationClassMembers.findAll({
			where: { organizationId: data.organizationId, memberId: userId }
		}).then(list => list.map(o => o.toJSON()));

		const isClassStudent = _.find(ms, o => o.classId == data.classId && o.roleId & CLASS_MEMBER_ROLE_STUDENT);
		if (isClassStudent) return this.fail({ code: 6, message: "已经是该班级学生" });
		const isStudent = _.find(ms, o => o.roleId & CLASS_MEMBER_ROLE_STUDENT);
		if (!isStudent) {
			const usedCount = await this.model.lessonOrganizations.getUsedCount(data.organizationId);
			if (organ.count <= usedCount) return this.fail({ code: 5, message: "人数已达上限" });
		}

		const m = _.find(ms, o => o.classId == data.classId);
		const roleId = m ? (m.roleId | CLASS_MEMBER_ROLE_STUDENT) : CLASS_MEMBER_ROLE_STUDENT;
		const member = await this.model.lessonOrganizationClassMembers.upsert({
			organizationId: data.organizationId,
			classId: data.classId,
			memberId: userId,
			roleId,
			realname,
		});

		await this.model.lessonOrganizationClassMembers.update({ realname }, { where: { organizationId, memberId: userId } });

		await this.model.lessonOrganizationActivateCodes.update({
			activateTime: new Date(), activateUserId: userId, state: 1, username, realname
		}, { where: { key } });

		return this.success(member);
	}
}

module.exports = LessonOrganizationActivateCode;
