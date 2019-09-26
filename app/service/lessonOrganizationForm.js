"use strict";

const Service = require("../common/service.js");
const {
	CLASS_MEMBER_ROLE_ADMIN
} = require("../common/consts.js");
const Err = require("../common/err");
const _ = require("lodash");

class LessonOrganizationFormService extends Service {
	/**
	 * 通过条件获取Lesson
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonOrganizationForm.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}
	/**
     * 根据条件查找form记录
     * @param {*} condition 查询条件
     * @param {*} include 连表 可选
     */
	async getAllAndExtraByCondition(condition, include) {
		const ret = await this.ctx.model.LessonOrganizationForm.findAll({ include, where: condition });
		return ret ? ret.map(r => r.get()) : [];
	}

	/**
     * 创建form
     * @param {*} params 
     * @param {*} authParams 
     */
	async createForm(params, authParams) {
		let { organizationId, userId, roleId } = authParams;
		if (!organizationId && !params.organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
		if (params.organizationId && params.organizationId !== organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}

		if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.ctx.throw(400, Err.AUTH_ERR);

		params.organizationId = organizationId;
		params.userId = userId;

		const data = await this.ctx.model.LessonOrganizationForm.create(params);
		return data ? data.get() : undefined;
	}

	/**
     * 更新form
     * @param {*} params 
     * @param {*} authParams 
     */
	async updateForm(params, authParams) {
		let { organizationId, userId, roleId } = authParams;
		if (!organizationId && !params.organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
		if (params.organizationId && params.organizationId !== organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}

		if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.ctx.throw(400, Err.AUTH_ERR);
		delete params.organizationId;
		delete params.userId;

		const data = await this.ctx.model.LessonOrganizationForm.update(params, { where: { id: params.id } });
		return data;
	}

	/**
     * 提交表格
     * @param {*} params 
     */
	async postForm(params) {
		const form = await this.getByCondition({ id: params.formId });
		if (!form) return this.ctx.throw(400, Err.FORM_NOT_EXISTS);

		params.organizationId = form.organizationId;
		params.userId = params.userId || 0;

		const submit = await this.ctx.model.LessonOrganizationFormSubmit.create(params);
		return submit ? submit.get() : undefined;
	}

    /**
     * 获取form提交记录
     * @param {*} params 
     * @param {*} authParams 
     */
	async getAllSubmit(params, authParams, queryOptions) {
		let { userId, organizationId, roleId } = authParams;

		if (!organizationId && !params.organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.ctx.throw(400, Err.AUTH_ERR);

		const { id } = params;
		const result = await this.ctx.model.LessonOrganizationFormSubmit.findAndCountAll({ ...queryOptions, where: { formId: id } });

		return result;
	}

    /**
     * 更新提交记录
     * @param {*} params 
     * @param {*} authParams 
     */
	async updateFormSubmit(params, authParams) {
		let { userId, organizationId, roleId } = authParams;
		if (!organizationId && !params.organizationId) return this.ctx.throw(400, Err.ARGS_ERR);
		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_ADMIN) return this.ctx.throw(400, Err.AUTH_ERR);

		const { id, submitId, comment, state, quizzes } = params;

		const ok = await this.ctx.model.LessonOrganizationFormSubmit.update({ comment, state, quizzes }, { where: { id: submitId, formId: id } });
		return ok;
	}
}

module.exports = LessonOrganizationFormService;