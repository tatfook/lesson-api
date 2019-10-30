"use strict";

const _ = require("lodash");
const Service = require("egg").Service;
const Err = require("../common/err");
const {
	USER_IDENTIFY_TEACHER,
	USER_IDENTIFY_APPLY_TEACHER,
	TEACHER_PRIVILEGE_TEACH,
} = require("../common/consts");

const tokenUpperLimit = 20;// 只支持20个token

class User extends Service {

	async token(payload, clear) {
		const config = this.app.config.self;
		const tokenExpire = config.tokenExpire || 3600 * 24 * 2;
		const token = this.ctx.helper.jwtEncode(payload, config.secret, tokenExpire);

		await this.setToken(payload.userId, token, clear);

		return token;
	}
	// used
	async setToken(userId, token, clear = false) {
		this.ctx.state.user = { userId };

		const data = await this.ctx.service.keepwork.getUserDatas(userId);

		data.tokens = data.tokens || [];
		if (clear) data.tokens = [];

		data.tokens.splice(0, 0, token);
		// 只支持20个token
		if (data.tokens.length > tokenUpperLimit) data.tokens.pop();

		await this.ctx.service.keepwork.setUserDatas(userId, data);
	}

	// 检查师生身份
	async checkTeacherRole(teacherId, organizationId, studentId) {
		return await this.ctx.model.LessonOrganizationClassMember.checkTeacherRoleSql(teacherId, organizationId, studentId);
	}

	// 获取keepwork头像，在机构中的realname和家长手机号
	async getPortraitRealNameParentNum(userId, organizationId) {

		const [users, member] = await Promise.all([
			this.ctx.service.keepwork.getAllUserByCondition({ id: userId }),
			this.ctx.service.lessonOrganizationClassMember.getByCondition({ organizationId, memberId: userId })
		]);

		return {
			portrait: users.length ? users[0].portrait : "",
			realname: member ? member.realname : "",
			parentPhoneNum: member ? member.parentPhoneNum : ""
		};
	}

	// 修改keepwork头像，在机构中的realname和家长手机号
	async updatePortraitRealNameParentNum({ portrait, realname, parentPhoneNum, userId, organizationId }) {
		if (parentPhoneNum) {
			const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition({ memberId: userId });
			if (member.parentPhoneNum) {// 家长手机号已经绑定，再修改的话不应该用这个接口
				this.ctx.throw(400, Err.UNKNOWN_ERR);
			}
		}

		await Promise.all([
			this.ctx.service.keepwork.update({ portrait, resources: "users" }, { id: userId }),
			this.ctx.service.lessonOrganizationClassMember.updateByCondition({ realname, parentPhoneNum }, { memberId: userId, organizationId })
		]);
	}

	// 修改家长手机号【第二步】
	async updateParentphonenum(userId, organizationId, parentPhoneNum) {
		return await this.ctx.service.lessonOrganizationClassMember.updateByCondition({ parentPhoneNum }, { memberId: userId, organizationId });
	}

	/**
	 * 通过条件获取user
	 * @param {*} condition 必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.User.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 通过userId找一个用户，如果没有则创建
	 * @param {*} userId 必选
	 * @param {*} username 可选
	 */
	async getByIdOrCreate(userId, username) {
		return await this.ctx.model.User.getById(userId, username);
	}

	/**
 	* 根据条件更新
 	* @param {*} params 更新的字段
 	* @param {*} condition 条件
 	*/
	async updateKeepworkResourceByCondition(params, condition) {
		return await this.ctx.service.keepwork.update(params, condition);
	}

	/**
	 * 获取当前用户  不存在则创建
	 * @param {*} user token中的user信息
	 */
	async getCurrentUser(user) {
		const { ctx } = this;
		const data = await this.getByIdOrCreate(user.userId, user.username);
		if (!data) return ctx.throw(404, Err.USER_NOT_EXISTS);

		const userId = user.userId;

		const [tutorService, teacher, [account, allianceMember, tutor]] = await Promise.all([
			ctx.model.Tutor.getByUserId(userId),
			ctx.model.Teacher.getByUserId(userId),
			ctx.service.keepwork.getAccountsAndRoles(userId)
		]);

		data.rmb = account.rmb;
		data.coin = account.coin;
		data.bean = account.bean;
		data.tutorService = tutorService;
		data.teacher = teacher;
		data.allianceMember = allianceMember;
		data.tutor = tutor;

		return data;
	}

	/**
	 * 根据条件更新
	 * @param {*} params 
	 * @param {*} condition 
	 */
	async updateUserByCondition(params, condition) {
		return await this.ctx.model.User.update(params, { where: condition });
	}

	/**
	 * 废弃
	 */
	async becomeTeacher(userId, key, school) {
		const user = await this.getByIdOrCreate(userId);
		if (!user) this.ctx.throw(400, Err.ARGS_ERR);

		const isOk = await this.ctx.model.TeacherCDKey.useKey(key, userId);
		if (!isOk) this.throw(400, Err.KEY_INVALID);

		const cdKey = await this.ctx.model.TeacherCDKey.findOne({ where: { key }}).then(o => o && o.toJSON());
		const startTime = new Date().getTime();

		user.identify = (user.identify | USER_IDENTIFY_TEACHER) & (~USER_IDENTIFY_APPLY_TEACHER);
		const teacher = await this.ctx.model.Teacher.findOne({
			where: { userId }
		}).then(o => o && o.toJSON()) || {
			userId, startTime, endTime: startTime,
			key, school, privilege: TEACHER_PRIVILEGE_TEACH
		};

		if (teacher.endTime < startTime) {
			teacher.endTime = teacher.startTime = startTime;
		}
		teacher.endTime += cdKey.expire;

		await this.ctx.model.Teacher.upsert(teacher);
		const result = await this.updateUserByCondition(user, { id: userId });

		return result;
	}

	// 用户花费知识币和知识豆
	async expense(userId, params) {
		const user = await this.getByIdOrCreate(userId);
		if (!user) this.ctx.throw(400, ARGS_ERR);

		const { coin, bean, description } = params;

		if ((bean && bean > user.bean) || (coin && coin > user.coin)) this.ctx.throw(400, Err.OVERAGE_NOT_ENOUGH);
		if (user.bean && bean && user.bean >= bean && bean > 0) {
			user.bean = user.bean - bean;
			await this.ctx.service.trade.createTradeRecord({ userId, type: TRADE_TYPE_BEAN, amount: bean * -1, description });
		}

		if (user.coin && coin && user.coin >= coin && coin > 0) {
			user.coin = user.coin - coin;
			await this.ctx.service.trade.createTradeRecord({ userId, type: TRADE_TYPE_COIN, amount: coin * -1, description });
		}

		await this.updateUserByCondition({ coin: user.coin, bean: user.bean }, { id: userId });
	}

}

module.exports = User;
