"use strict";

const _ = require("lodash");

const Controller = require("./baseController.js");
const { CLASS_MEMBER_ROLE_ADMIN } = require("../common/consts");

const LessonOrganizationForm = class extends Controller {
	get modelName() {
		return "LessonOrganizationForm";
	}

	async search() {
		const query = this.validate({ organizationId: "number" });

		const list = await this.ctx.service.lessonOrganizationForm.getAllAndExtraByCondition(query, [{
			as: "lessonOrganizationFormSubmits",
			model: this.model.LessonOrganizationFormSubmit,
			attributes: ["formId"],
			limit: 100000
		}]);

		_.each(list, o => {
			o.submitCount = o.lessonOrganizationFormSubmits.length;
			o.lessonOrganizationFormSubmits = undefined;
		});

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
	}

	async create() {
		let { organizationId, userId, roleId } = this.authenticated();
		const params = this.validate();

		const data = await this.ctx.service.lessonOrganizationForm.createForm(params,
			{ organizationId, userId, roleId });

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: data });
	}

	async update() {
		let { organizationId, userId, roleId } = this.authenticated();
		const params = this.validate({ id: "number" });

		const data = await this.ctx.service.lessonOrganizationForm.updateForm(params, {
			organizationId, userId, roleId
		});

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: data });
	}

	async postSubmit() {
		const params = this.validate({ id: "number" });
		params.formId = params.id;
		params.userId = this.currentUser().userId;
		delete params.id;

		const submit = await this.ctx.service.lessonOrganizationForm.postForm(params);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: submit });
	}

	async getSubmit() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ id: "number" });

		const result = await this.ctx.service.lessonOrganizationForm.getAllSubmit(params, { userId, organizationId, roleId }, this.queryOptions);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: result });
	}

	async updateSubmit() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ id: "number", submitId: "number" });

		const ok = await this.ctx.service.lessonOrganizationForm.updateFormSubmit(params, { userId, organizationId, roleId });
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: ok });
	}

	// 管理员可以删除任何表单，普通人只能删除自己的表单
	async destroy() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const { userId, roleId } = this.authenticated();
		let condition;
		if (roleId & CLASS_MEMBER_ROLE_ADMIN) {
			condition = { id };
		} else {
			condition = { id, userId };
		}

		const model = this.model[this.modelName];
		const result = await model.destroy({ where: condition });
		ctx.helper.success({ ctx, status: 200, res: result });
	}
};

module.exports = LessonOrganizationForm;
