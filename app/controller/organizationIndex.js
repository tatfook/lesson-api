
// const _ = require("lodash");

const Controller = require("./baseController.js");

const {
	CLASS_MEMBER_ROLE_TEACHER,
	CLASS_MEMBER_ROLE_ADMIN
} = require("../common/consts.js");

const Index = class extends Controller {
	// 更改密码 
	async changepwd() {
		let { userId, organizationId, username, roleId } = this.authenticated();
		const params = this.validate({ classId: "number", memberId: "number", password: "string" });
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400, "无权限操作");

		if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
			const teacher = await this.model.LessonOrganizationClassMember.findOne({ organizationId, classId: params.classId, memberId: userId });
			if (teacher.roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400);
		}

		const member = await this.model.LessonOrganizationClassMember.findOne({
			where: { organizationId, classId: params.classId, memberId: params.memberId }
		}).then(o => o.toJSON());
		if (!member) return this.success(false);

		const ok = await this.ctx.keepworkModel.Users.update({
			password: this.app.util.md5(params.password),
		}, { where: { id: params.memberId } });

		this.model.LessonOrganizationLog.create({
			organizationId,
			type: "学生",
			username,
			handleId: userId,
			description: "修改密码, 学生: " + (member.realname || ""),
		});

		return this.success(ok);
	}

	// 日志
	async log() {
		let { organizationId, roleId } = this.authenticated();
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400);

		const query = this.validate();
		this.formatQuery(query);

		//query.organizationId = query.organizationId || organizationId;
		query.organizationId = organizationId;

		const logs = await this.model.LessonOrganizationLog.findAndCount({ ...this.queryOptions, where: query });

		return this.success(logs);
	}
};

module.exports = Index;
