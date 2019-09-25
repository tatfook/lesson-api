
// const joi = require("joi");
const _ = require("lodash");

const Controller = require("./baseController.js");

const {
	CLASS_MEMBER_ROLE_ADMIN
} = require("../common/consts.js");

const Err = require("../common/err");

const LessonOrganizationClass = class extends Controller {
	get modelName() {
		return "lessonOrganizationClasses";
	}

	async show() {
		const { id } = this.validate({ id: "number" });

		const organ = await this.ctx.service.lessonOrganization.getByCondition({ id });

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: organ });
	}

	async history() {
		const { organizationId, roleId } = this.authenticated();
		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.ctx.throw(400, Err.AUTH_ERR);

		const data = await this.ctx.service.lessonOrganizationClass.historyClass(this.queryOptions, organizationId);
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: data });
	}

	async index() {
		const { userId, organizationId } = this.authenticated();
		const { roleId } = this.validate({ roleId: "number_optional" });

		let list;
		if (!roleId) {
			list = await this.ctx.service.lessonOrganizationClass.findAllByCondition({ organizationId });
		} else {
			list = await this.ctx.service.lessonOrganizationClass.findByUserIdRoleIdAndOrganizationId({ userId, organizationId, roleId });
		}

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
	}

	async create() {

		const { roleId, organizationId, userId, username } = this.authenticated();

		const params = this.validate({ name: "string" });

		const cls = await this.ctx.service.lessonOrganizationClass.createClass(params, {
			roleId, organizationId, userId, username
		});
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: cls });
	}

	// 禁止更新
	async update() {
		const { roleId, organizationId, userId, username } = this.authenticated();
		const params = this.validate({ id: "number" });

		await this.ctx.service.lessonOrganizationClass.updateClass(params, {
			roleId, organizationId, userId, username
		});
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: "OK" });
	}

	// 删除班级
	async destroy() {
		const { roleId, organizationId } = this.authenticated();
		const { id } = this.validate({ id: "number" });
		if (!organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
		if (roleId & CLASS_MEMBER_ROLE_ADMIN === 0) return this.ctx.throw(403, Err.AUTH_ERR);

		await this.ctx.service.lessonOrganizationClass.destroyClass(id, organizationId);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: "OK" });
	}

	// 班级最近项目
	async latestProject() {
		const { organizationId } = this.authenticated();
		const { id } = this.validate({ id: "number" });

		const members = await this.ctx.service.lessonOrganizationClass.classLastestProject(id, organizationId);
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: members });
	}
};

module.exports = LessonOrganizationClass;
