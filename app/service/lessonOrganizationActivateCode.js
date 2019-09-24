
"use strict";

const Service = require("../common/service.js");
const { CLASS_MEMBER_ROLE_ADMIN, CLASS_MEMBER_ROLE_STUDENT } = require("../common/consts.js");
const _ = require("lodash");
const Err = require("../common/err");

class LessonOrganizationActivateCodeService extends Service {

	/**
	 * 创建激活码
	 * @param {*} params {count,classId,names,organizationId?}
	 * @param {*} authParams {userId, organizationId, roleId, username}
	 */
	async createActivateCode(params, authParams) {
		let { userId, organizationId, roleId, username } = authParams;
		if (params.organizationId && params.organizationId !== organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}

		const classId = params.classId;
		const names = params.names || [];
		const count = params.count || names.length || 1;

		const cls = await this.ctx.service.lessonOrganizationClass.getByCondition({ id: classId });
		if (!cls) return this.ctx.throw(400, Err.CLASS_NOT_EXIST);

		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) return this.ctx.throw(403, Err.AUTH_ERR);

		const organ = await this.ctx.service.lessonOrganization.getByCondition({
			id: organizationId, endDate: { $gte: new Date() }
		});
		if (!organ) this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

		const datas = [];
		for (let i = 0; i < count; i++) {
			datas.push({
				organizationId,
				classId,
				key: classId + "" + i + "" + (new Date()).getTime() + _.random(10, 99),
				extra: names.length > i ? { name: names[i] } : {},
			});
		}

		const list = await this.ctx.model.LessonOrganizationActivateCode.bulkCreate(datas);

		this.ctx.model.LessonOrganizationLog.classLog({ organizationId, cls, action: "activateCode", count, handleId: userId, username });

		return list;
	}

	/**
	 * 
	 * @param {*} queryOptions 分页排序等参数 必选
	 * @param {*} condition 查询条件 必选
	 * @param {*} include 连表 可选
	 */
	async findAllActivateCodeAndCount(queryOptions, condition, include) {
		const ret = await this.ctx.model.LessonOrganizationActivateCode.findAndCountAll({
			...queryOptions,
			where: condition,
			include
		});
		return ret;
	}

	/**
 	* 通过条件获取activateCode
 	* @param {*} condition 必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonOrganizationActivateCode.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
 	* 根据条件更新
 	* @param {*} params 更新的字段
 	* @param {*} condition 条件
 	*/
	async updateByCondition(params, condition) {
		return await this.ctx.model.LessonOrganizationActivateCode.update(params, { where: condition });
	}

	/**
	 * 使用激活码
	 * @param {*} params {key, realname, organizationId } 
	 * @param {*} authParams {userId, username}
	 */
	async useActivateCode(params, authParams) {
		const { userId, username } = authParams;
		let { key, realname, organizationId } = params;

		const curtime = new Date().getTime();
		const data = await this.getByCondition({ key, state: 0 });
		if (!data) return this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);

		if (organizationId && data.organizationId != organizationId) return this.ctx.throw(400, Err.ACTIVATE_CODE_NOT_MATCH_ORGAN);
		organizationId = data.organizationId;

		const cls = await this.ctx.service.lessonOrganizationClass.getByCondition({ id: data.classId });
		if (!cls) return this.ctx.throw(400, Err.INVALID_ACTIVATE_CODE);

		const end = new Date(cls.end).getTime();
		if (curtime > end) return this.ctx.throw(400, Err.CLASS_IS_FINISH);

		const organ = await this.ctx.service.lessonOrganization.getByCondition({ id: data.organizationId, endDate: { $gt: new Date() } });
		if (!organ) return this.ctx.throw(400, Err.INVALID_ORGAN);

		const ms = await this.ctx.service.lessonOrganizationClassMember.getAllByCondition({
			organizationId: data.organizationId, memberId: userId
		});
		const isClassStudent = _.find(ms, o => o.classId == data.classId && o.roleId & CLASS_MEMBER_ROLE_STUDENT);
		if (isClassStudent) return this.ctx.throw(400, Err.ALREADY_IN_CLASS);

		const isStudent = _.find(ms, o => o.roleId & CLASS_MEMBER_ROLE_STUDENT);
		if (!isStudent) {
			const usedCount = await this.ctx.service.lessonOrganization.getOrganMemberCount(data.organizationId);
			if (organ.count <= usedCount) return this.ctx.throw(400, Err.MEMBERS_UPPER_LIMIT);
		}

		let member = _.find(ms, o => o.classId == data.classId);
		const roleId = member ? (member.roleId | CLASS_MEMBER_ROLE_STUDENT) : CLASS_MEMBER_ROLE_STUDENT;
		if (member) {
			await this.ctx.service.lessonOrganizationClassMember.updateByCondition({ roleId, realname }, { id: member.id });
		} else {
			member = await this.ctx.service.lessonOrganizationClassMember.createMember({
				organizationId: data.organizationId,
				classId: data.classId,
				memberId: userId,
				roleId,
				realname,
			});
		}

		await this.ctx.service.lessonOrganizationClassMember.updateByCondition({ realname },
			{ organizationId, memberId: userId });

		await this.updateByCondition({
			activateTime: new Date(), activateUserId: userId, state: 1, username, realname
		}, { key });

		return Object.assign(member, { roleId, realname });
	}
}

module.exports = LessonOrganizationActivateCodeService;