"use strict";

const Service = require("../common/service.js");
const {
	CLASS_MEMBER_ROLE_TEACHER,
	CLASS_MEMBER_ROLE_STUDENT,
	CLASS_MEMBER_ROLE_ADMIN
} = require("../common/consts.js");
const Err = require('../common/err');
const _ = require('lodash')

class LessonOrganizationClassMemberService extends Service {
	/**
 	* 通过条件获取lessonOrganizationClassMember
 	* @param {*} condition  必选,对象
 	*/
	async getByCondition(condition) {
		let data = await this.ctx.model.LessonOrganizationClassMember.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 根据条件查找全部的记录
	 * @param {*} condition 必选 对象
	 */
	async getAllByCondition(condition) {
		let list = await this.ctx.model.LessonOrganizationClassMember.findAll({ where: condition });
		return list ? list.map(r => r.get()) : [];
	}

	/**
	 * 根据条件查找全部的记录，并且带连表查询
	 * @param {*} include 关联表
	 * @param {*} condition 必选 对象
	 */
	async getAllAndExtraByCondition(include, condition) {
		const list = await this.ctx.model.LessonOrganizationClassMember.findAll({
			include,
			where: condition
		});

		return list ? list.map(r => r.get()) : [];
	}

	/**
 	* 根据条件删除机构成员
 	* @param {*} condition 
 	*/
	async destroyByCondition(condition) {
		return await this.ctx.model.LessonOrganizationClassMember.destroy({ where: condition });
	}

	/**
	 * 根据条件更新
	 * @param {*} params 更新的字段
	 * @param {*} condition 条件
	 */
	async updateByCondition(params, condition) {
		return await this.ctx.model.LessonOrganizationClassMember.update(params, { where: condition });
	}

	/**
	 * 
	 * @param {*} params 
	 */
	async createMember(params) {
		const ret = await this.ctx.model.LessonOrganizationClassMember.create(params);
		return ret ? ret.get() : undefined;
	}

	/**
	 * 获取教师列表
	 * @param {*} organizationId 
	 * @param {*} classId 
	 */
	async getTeachers(organizationId, classId) {
		const members = await this.ctx.service.lessonOrganization.getTeachers(organizationId, classId);
		const memberIds = members.map(o => o.memberId);
		if (memberIds.length === 0) return [];

		const curtime = new Date();
		const list = await this.model.LessonOrganizationClassMember.findAll({
			include: [
				{
					as: "lessonOrganizationClasses",
					model: this.model.LessonOrganizationClass,
					where: {
						end: { $gte: curtime },
					},
					required: false,
				}
			],
			where: {
				organizationId,
				memberId: {
					[this.model.Op.in]: memberIds,
				},
				classId: classId ? classId : { "$gte": 0 }
			}
		}).then(list => list.map(o => o.toJSON()));

		const users = await this.ctx.keepworkModel.Users.findAll({
			attributes: ["id", "username"], where: { id: { $in: memberIds } }
		});

		const map = {};
		_.each(list, o => {
			if (!(o.roleId & CLASS_MEMBER_ROLE_TEACHER)) return;
			map[o.memberId] = map[o.memberId] || o;
			map[o.memberId].classes = map[o.memberId].classes || [];

			if (o.lessonOrganizationClasses) map[o.memberId].classes.push(o.lessonOrganizationClasses);

			const index = _.findIndex(users, obj => { return obj.id === o.memberId; });
			if (index > -1) {
				map[o.memberId].username = users[index].username;
			}
			map[o.memberId].realname = map[o.memberId].realname || o.realname;
			delete o.lessonOrganizationClasses;
		});

		const datas = [];
		_.each(map, o => datas.push(o));

		return datas;
	}

	/**
	 * 获取学生列表
	 * @param {*} organizationId 
	 * @param {*} classId 
	 */
	async getStudents(organizationId, classId) {
		const members = await this.ctx.service.lessonOrganization.getMembers(organizationId, 1, classId);
		const memberIds = members.map(o => o.memberId);
		if (memberIds.length === 0) return { count: 0, rows: [] };

		const curtime = new Date();
		const list = await this.model.LessonOrganizationClassMember.findAll({
			include: [
				{
					as: "lessonOrganizationClasses",
					model: this.model.LessonOrganizationClass,
					where: {
						end: { $gte: curtime },
					},
					required: false,
				},
			],
			where: {
				organizationId,
				memberId: { $in: memberIds },
				classId: classId ? classId : { "$gt": 0 },
			},
		}).then(list => list.map(o => o.toJSON()));

		const users = await this.ctx.keepworkModel.Users.findAll({
			attributes: ["id", "username", "nickname", "portrait"], where: { id: { $in: memberIds } }
		});

		const map = {};
		const rows = [];
		let count = 0;

		_.each(list, o => {
			if (!(o.roleId & CLASS_MEMBER_ROLE_STUDENT)) return;
			if (!map[o.memberId]) {
				count++;
				map[o.memberId] = o;
				o.classes = [];

				const index = _.findIndex(users, obj => { return obj.id === o.memberId; });
				if (index > -1) {
					o.users = users[index].get();
				}
				rows.push(o);
			}
			map[o.memberId].realname = map[o.memberId].realname || o.realname;
			if (o.lessonOrganizationClasses) map[o.memberId].classes.push(o.lessonOrganizationClasses);
			delete o.lessonOrganizationClasses;
		});
		_.each(rows, o => { o.lessonOrganizationClasses = o.classes; });

		return { count, rows };
	}

	/**
	 * 这个接口逻辑复杂又乱。。。先放这儿
	 * @param {*} params 
	 * @param {*} authParams 
	 */
	async createMember(params, authParams) {
		let { organizationId, roleId, userId, username } = authParams;

		if (params.organizationId && params.organizationId != organizationId) {
			organizationId = params.organizationId;
			roleId = await this.ctx.service.organization.getRoleId(organizationId, userId);
		}

		params.organizationId = organizationId;
		params.roleId = params.roleId || CLASS_MEMBER_ROLE_STUDENT;
		const classIds = _.uniq(params.classIds || []);

		if (!params.memberId) {
			if (!params.memberName) return this.ctx.throw(400, Err.ARGS_ERR);

			const user = await this.ctx.service.user.getKeepworkUserByCondition({ username: params.memberName });
			if (!user) return this.ctx.throw(400, Err.USER_NOT_EXISTS);

			params.memberId = user.id;
		}


		if (!(roleId & CLASS_MEMBER_ROLE_ADMIN)) {
			if (roleId <= CLASS_MEMBER_ROLE_STUDENT) return this.ctx.throw(403, Err.AUTH_ERR);

			const organ = await this.ctx.service.lessonOrganization.getByCondition({ id: organizationId });
			if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

			if (organ.privilege && 1 === 0) return this.ctx.throw(403, Err.AUTH_ERR);
		}

		let oldmembers = await this.ctx.model.LessonOrganizationClassMember.findAll({
			order: [["id", "desc"]],
			include: [{ as: "lessonOrganizationClasses", model: this.ctx.model.LessonOrganizationClass, required: false }],
			where: { organizationId, memberId: params.memberId }
		}).then(list => list.map(o => o.toJSON()));

		oldmembers = _.filter(oldmembers, o => {
			if (o.roleId == CLASS_MEMBER_ROLE_STUDENT && o.lessonOrganizationClasses
				&& new Date(o.lessonOrganizationClasses.end).getTime() < new Date().getTime()
			) return false;
			return true;
		});

		const ids = _.map(oldmembers, o => o.id);

		//???
		const organ = await this.ctx.service.lessonOrganization.getByCondition({ id: organizationId });
		if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

		// 检查人数是否达到上限
		const organCount = organ.count;
		const isStudent = _.find(oldmembers, o => o.roleId & CLASS_MEMBER_ROLE_STUDENT) ? true : false;
		if (!isStudent && (params.roleId & CLASS_MEMBER_ROLE_STUDENT)) {
			const usedCount = await this.ctx.service.lessonOrganization.getOrganMemberCount(organizationId);
			if (usedCount >= organCount && classIds.length > 0) return this.ctx.throw(400, Err.MEMBERS_UPPER_LIMIT);
		}

		await this.ctx.service.lessonOrganizationLog.studentLog({ ...params, handleId: userId, username, classIds, oldmembers, organizationId });

		// 合并其它身份
		const datas = _.map(classIds, classId => ({
			...params, classId, roleId: params.roleId | (_.find(oldmembers, m => m.classId == classId) || { roleId: 0 }).roleId
		}));

		// 删除要创建的
		if (classIds.length) await this.destroyByCondition({ organizationId, memberId: params.memberId, classId: { $in: classIds } });
		// 取消全部班级此身份
		if (ids.length) await this.model.query(
			`
			update lessonOrganizationClassMembers 
			set roleId = roleId & ~${params.roleId} 
			where id in (:ids)
			`, {
			type: this.model.QueryTypes.UPDATE, replacements: { ids }
		});
		// 删除roleId=0为0的成员
		await this.destroyByCondition({ organizationId, memberId: params.memberId, roleId: 0 });

		if (datas.length == 0) return [];

		const members = await this.model.LessonOrganizationClassMember.bulkCreate(datas);

		if (params.realname) await this.model.LessonOrganizationClassMember.update({ realname: params.realname }, { where: { id: { "$in": ids } } });

		if (params.realname && classIds.length) {
			await this.ctx.service.lessonOrganizationActivateCode.updateByCondition({ realname: params.realname }, {
				organizationId,
				activateUserId: params.memberId,
				state: 1,
				classId: { $in: classIds },
			});
		}
		return members;
	}

	/**
	 * 删除成员
	 * @param {*} params 
	 * @param {*} authParams 
	 * @param {*} id memberId
	 */
	async destroyMember(params, authParams, id) {
		const { organizationId, roleId, userId, username } = authParams;

		const member = await this.getByCondition({ organizationId, id });
		if (!member) return;

		if (member.roleId >= roleId) return this.ctx.throw(411, Err.AUTH_ERR);

		if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
			if (roleId <= CLASS_MEMBER_ROLE_STUDENT) return this.throw(403, Err.AUTH_ERR);

			const organ = await this.ctx.service.lessonOrganization.getByCondition({ id: organizationId });
			if (!organ) return this.ctx.throw(400, Err.ORGANIZATION_NOT_FOUND);

			if (organ.privilege && 2 === 0) return this.throw(403, Err.AUTH_ERR);
		}

		if (!params.roleId || params.roleId == member.roleId) {
			await this.destroyByCondition({ id });
		} else {
			await this.updateByCondition({ roleId: member.roleId & (~params.roleId) }, { id });
		}

		const memberRoleId = params.roleId ? params.roleId : member.roleId;
		await this.ctx.service.lessonOrganizationLog.studentLog({
			organizationId,
			handleId: userId,
			username,
			oldmembers: [member],
			classIds: [-1],
			roleId: memberRoleId & CLASS_MEMBER_ROLE_TEACHER ? CLASS_MEMBER_ROLE_TEACHER : CLASS_MEMBER_ROLE_STUDENT,
		});
	}

	/**
	 * 
	 * @param {*} members 
	 */
	async bulkCreateMembers(members) {
		return await this.ctx.model.LessonOrganizationClassMember.bulkCreate(members);
	}
}

module.exports = LessonOrganizationClassMemberService;