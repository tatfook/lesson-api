
const Controller = require("./baseController.js");

const LessonOrganizationClassMember = class extends Controller {
	get modelName() {
		return "lessonOrganizationClassMembers";
	}

	// 获取教师列表
	async teacher() {
		const { ctx } = this;
		const { organizationId } = this.authenticated();
		const { classId } = this.validate({ classId: "number_optional" });

		const datas = await this.ctx.service.lessonOrganizationClassMember.getTeachers(organizationId, classId);
		return ctx.helper.success({ ctx: ctx, status: 200, res: datas });
	}

	// 获取学生列表
	async student() {
		const { ctx } = this;
		const { organizationId } = this.authenticated();

		const { classId } = this.validate({ classId: "number_optional" });

		const data = await this.ctx.service.lessonOrganizationClassMember.getStudents(organizationId, classId);

		return ctx.helper.success({ ctx: ctx, status: 200, res: data });
	}

	async bulkCreate() {
		return this.success();
	}

	async create() {
		let { organizationId, roleId, userId, username } = this.authenticated();
		const params = this.validate();

		const members = await this.ctx.service.lessonOrganizationClassMember.createMember(params,
			{ organizationId, roleId, userId, username });
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: members });
	}

	async destroy() {
		const { organizationId, roleId, userId, username } = this.authenticated();
		const { id } = this.validate({ id: "number" });

		await this.ctx.service.lessonOrganizationClassMember.destroyMember(params, { organizationId, roleId, userId, username }, id);
		return this.ctx.helper.success({ ctx: this.ctx, status: 200, res: "OK" });
	}

	// 禁止更新
	async update() {
	}
};

module.exports = LessonOrganizationClassMember;
