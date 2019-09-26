"use strict";

const Service = require("../common/service.js");
const { CLASS_MEMBER_ROLE_TEACHER, CLASS_MEMBER_ROLE_STUDENT } = require("../common/consts.js");
const _ = require("lodash");
const Err = require("../common/err");

class LessonOrganizationUserService extends Service {

	/**
	 * 机构批量创建用户
	 * @param {*} params 
	 * @param {*} authParams 
	 */
	async batchCreate(params, authParams) {
		let { userId, organizationId, roleId } = authParams;

		if (params.organizationId && ~~params.organizationId !== ~~organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.ctx.throw(400, Err.AUTH_ERR);

		let { classId, handlerId, count, password } = params;
		handlerId = handlerId || userId;

		const handler = await this.ctx.service.user.getKeepworkUserByCondition({ id: handlerId });
		if (!handler) return this.ctx.throw(400, Err.USER_NOT_EXISTS);
		const cellphone = handler.realname;
		if (!cellphone) return this.ctx.throw(400, Err.USER_NOT_REALNAME);

		const userdatas = [];
		count = count > 100 ? 100 : count;
		for (let i = 1; i <= count; i++) {
			userdatas.push({
				password: this.ctx.helper.md5(password || "123456"),
				realname: cellphone
			});
		}

		const users = await this.ctx.service.user.bulkCreateKeepworkUser(userdatas);

		const members = users.map(u => ({
			memberId: u.id,
			classId,
			organizationId,
			roleId: CLASS_MEMBER_ROLE_STUDENT,
			bind: 1,
		}));
		await this.ctx.service.lessonOrganizationClassMember.bulkCreateMembers(members);

		const userinfos = users.map(u => ({ userId: u.id, registerUsername: _.toString(u.id + 10000) }));
		await this.ctx.service.user.bulkCreateUserinfos(userinfos);

		return users;
	}


	/**
	 * 机构解绑用户
	 * @param {*} params 
	 * @param {*} authParams 
	 */
	async unbindUser(params, authParams) {
		let { userId, organizationId, roleId } = authParams;

		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.ctx.throw(400, Err.AUTH_ERR);

		let { classId } = params;
		const members = await this.ctx.service.lessonOrganizationClassMember.getAllByCondition({
			classId, organizationId, bind: 1
		});

		await this.ctx.service.lessonOrganizationClassMember.updateByCondition({ state: 0 }, { classId, organizationId, bind: 1 });
		const ids = members.map(o => o.memberId);
		await this.ctx.service.user.updateKeepworkUserByCondition({ realname: null }, { id: { "$in": ids }});
	}

	/**
	 * 更新密码
	 * @param {*} params 
	 * @param {*} authParams 
	 */
	async updatePassword(params, authParams) {
		let { userId, organizationId, roleId } = authParams;

		if (params.organizationId && ~~params.organizationId !== ~~organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}
		if (roleId < CLASS_MEMBER_ROLE_TEACHER) return this.ctx.throw(400, Err.AUTH_ERR);
		const { password, classId, memberId } = params;

		const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition(
			{ organizationId, classId, memberId });

		if (!member || ~~member.bind === 0) this.ctx.throw(400, Err.USER_NOT_EXISTS_OR_NOT_BIND_ORGAN);

		await this.ctx.service.user.updateKeepworkUserByCondition({
			password: this.ctx.helper.md5(password || "123456"),
		}, { id: memberId });

	}
}

module.exports = LessonOrganizationUserService;