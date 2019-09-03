
// const joi = require("joi");
const _ = require("lodash");

const Controller = require("../core/baseController.js");

const {
	CLASS_MEMBER_ROLE_STUDENT,
	CLASS_MEMBER_ROLE_TEACHER,
} = require("../core/consts.js");

const LessonOrganizationUser = class extends Controller {
	static get modelName() {
		return "lessonOrganizationUsers";
	}

	async batchCreateUser() {
		console.log("------------------------");
		const ctx = this.ctx;
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ classId: "number", count: "number" });
		if (params.organizationId && ~~params.organizationId !== ~~organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400, "无权限操作");
		console.log("------------------------");

		let { classId, handlerId, count, password } = params;;
		handlerId = handlerId || userId;

		const handler = await this.ctx.service.user.getUserByUserId(handlerId);
		if (!handler) return this.throw(400, "负责人不存在");
		const cellphone = handler.realname;
		if (!cellphone) return this.throw(400, "负责人未实名");

		const userdatas = [];
		count = count > 100 ? 100 : count;
		for (let i = 1; i <= count; i++) {
			userdatas.push({
				password: this.app.util.md5(password || "123456"),
				realname: cellphone
			});
		}

		// 批量创建返回结果有 BUG
		const users = await ctx.keepworkModel.Users.bulkCreate(userdatas).then(list => list.map(o => o.toJSON()));
		const ids = users.filter(o => o.id).map(o => o.id);
		// users = await this.model.users.findAll({
		// attributes:["id","username"],
		// where:{id:{"$in":ids}},
		// }).then(list => list.map(o => o.toJSON()));

		const members = users.map(u => ({
			memberId: u.id,
			classId,
			organizationId,
			roleId: CLASS_MEMBER_ROLE_STUDENT,
			bind: 1,
		}));
		await this.model.lessonOrganizationClassMembers.bulkCreate(members);

		const userinfos = users.map(u => ({ userId: u.id, registerUsername: _.toString(u.id + 10000) }));
		await this.keepworkModel.userinfos.bulkCreate(userinfos);

		// //const organizationUserdatas = users.map(o => ({
		// //userId: o.id,
		// //state:1,
		// //organizationId,
		// //classId,
		// //handlerId,
		// //cellphone,
		// //}));

		// //await this.model.lessonOrganizationUsers.bulkCreate(organizationUserdatas);

		return this.success(users);
	}

	async unbind() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ classId: "number" });
		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400, "无权限操作");
		let { classId } = params;;
		const members = await this.model.lessonOrganizationClassMembers.findAll({
			where: { classId, organizationId, bind: 1 }
		}).then(list => list.map(o => o.toJSON()));

		await this.model.lessonOrganizationClassMembers.update({ state: 0 }, { where: { classId, organizationId, bind: 1 }});
		const ids = members.map(o => o.memberId);
		await this.ctx.keepworkModel.Users.update({ realname: null }, { where: { id: { "$in": ids }}});

		// const users = await this.model.lessonOrganizationUsers.findAll({where:{classId, organizationId}}).then(list => list.map(o => o.toJSON()));
		// await this.model.lessonOrganizationUsers.update({state: 0}, {where:{classId, organizationId}});
		// const ids = users.map(o => o.userId);
		// await this.model.users.update({realname:null}, {where:{id: {"$in": ids}}});

		return this.success("ok");
	}

	async setpwd() {
		let { userId, organizationId, roleId } = this.authenticated();
		const params = this.validate({ password: "string", classId: "number", memberId: "number" });
		if (params.organizationId && ~~params.organizationId !== ~~organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.throw(400, "无权限操作");
		const { password, classId, memberId } = params;

		const member = await this.model.lessonOrganizationClassMembers.findOne({ where: { organizationId, classId, memberId }}).then(o => o && o.toJSON());
		if (!member || ~~member.bind === 0) this.throw(400, "成员不存在或未绑定本机构");

		await this.keepworkModel.users.update({
			password: this.app.util.md5(password || "123456"),
		}, { where: { id: memberId }});

		return this.success("ok");
	}
};

module.exports = LessonOrganizationUser;
