"use strict";

const Controller = require("./baseController.js");

const LessonOrganizationUser = class extends Controller {
	static get modelName() {
		return "LessonOrganizationUser";
	}

	async batchCreateUser() {
		const ctx = this.ctx;
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ classId: "number", count: "number" });
		const users = await this.ctx.service.user.batchCreate(params, { userId, organizationId, roleId });

		return this.ctx.helper.success({ ctx, status: 200, res: users });
	}

	async unbind() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ classId: "number" });

		await this.ctx.service.lessonOrganizationUser.unbindUser(params, { userId, organizationId, roleId });

		return this.ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	async setpwd() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ password: "string", classId: "number", memberId: "number" });

		await this.ctx.service.lessonOrganizationUser.updatePassword(params, { userId, organizationId, roleId });

		return this.ctx.helper.success({ ctx, status: 200, res: "OK" });
	}
};

module.exports = LessonOrganizationUser;
