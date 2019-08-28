
// const _ = require("lodash");

const Controller = require("../core/baseController.js");

const {
	CLASS_MEMBER_ROLE_TEACHER,
} = require("../core/consts.js");

const Index = class extends Controller {
	// 更改密码 
	async changepwd() {
		let { organizationId, roleId } = this.authenticated();
		const params = this.validate({ memberId: "number", password: "string" });
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400, "无权限操作");

		const isMember = await this.ctx.service.organization.isMember({ organizationId, memberId: params.memberId });
		if (!isMember) return this.success(false);

		const ok = await ctx.model.users.update({
			password: app.util.md5(params.password),
		}, { where: { id: params.memberId }});

		return this.success(ok);
	}
};

module.exports = Index;
