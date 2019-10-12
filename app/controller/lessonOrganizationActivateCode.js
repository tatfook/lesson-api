"use strict";

const Controller = require("./baseController.js");
const Err = require("../common/err");

const {
	CLASS_MEMBER_ROLE_ADMIN,
} = require("../common/consts.js");

const LessonOrganizationActivateCode = class extends Controller {
	get modelName() {
		return "LessonOrganizationActivateCode";
	}

	async create() {
		let { userId, organizationId, roleId, username } = this.authenticated();
		const params = this.validate({ count: "number", classId: "number" });

		const list = await this.ctx.service.lessonOrganizationActivateCode.createActivateCode(params, { userId, organizationId, roleId, username });

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: list });
	}

	async index() {
		let { organizationId, roleId, userId } = this.authenticated();
		const where = this.validate();

		if (where.organizationId && where.organizationId != organizationId) {
			organizationId = where.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.throw(400, Err.AUTH_ERR);

		this.formatQuery(where);

		where.organizationId = organizationId;

		const data = await this.ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount(
			this.queryOptions,
			where,
			[{
				as: "lessonOrganizationClasses",
				model: this.model.LessonOrganizationClass,
			}]);

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: data });
	}

	// 新加参数 parentPhoneNum, verifCode，绑定家长手机号
	async activate() {
		const { userId, username } = this.authenticated();
		let { key, realname, organizationId,
			parentPhoneNum, verifCode
		} = this.validate({ key: "string", organizationId: "number" });

		const data = await this.ctx.service.lessonOrganizationActivateCode.useActivateCode({
			key, realname,
			organizationId,
			parentPhoneNum,
			verifCode
		}, { userId, username });

		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: data });
	}
};

module.exports = LessonOrganizationActivateCode;
