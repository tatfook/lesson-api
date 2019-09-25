"use strict";

const _ = require('lodash');
const Service = require('egg').Service;
const Err = require('../common/err');
const {
	USER_IDENTIFY_TEACHER,
	USER_IDENTIFY_APPLY_TEACHER,
	TEACHER_PRIVILEGE_TEACH,
} = require('../common/consts');

class User extends Service {

	// 简化用户信息 
	getSimpleUser() {
	}

	async getUser({ userId, kid, username, cellphone, email }) {
		const user = await this.app.keepworkModel.users.findOne({
			where: {
				"$or": [
					{ id: _.toNumber(userId) || 0 },
					//{userId: (_.toNumber(kid) || 0) - 10000},
					{ username: username },
					{ cellphone: cellphone },
					{ email: email },
				]
			}
		}).then(o => o && o.toJSON());

		if (!user) return;

		user.isRealname = user.realname ? true : false;
		user.cellphone = undefined;
		user.email = undefined;
		user.password = undefined;
		user.realname = undefined;
		user.roleId = undefined;
		user.sex = undefined;

		return user;
	}

	/**
	 * 根据条件获取keepwork那边的User信息
	 * @param {*} condition 
	 */
	async getKeepworkUserByCondition(condition) {
		return await this.app.keepworkModel.Users.findOne({ where: condition }).then(o => o && o.toJSON());
	}

	async getUserinfoByUserId(userId) {
		const userinfo = await this.app.keepworkModel.userinfos.findOne({ where: { userId } }).then(o => o && o.toJSON());
		if (!userinfo) await this.app.userinfos.upsert({ userId });
		return userinfo;
	}

	async token(payload, clear) {
		const config = this.app.config.self;
		const tokenExpire = config.tokenExpire || 3600 * 24 * 2;
		const token = this.app.util.jwt_encode(payload, config.secret, tokenExpire);

		await this.setToken(payload.userId, token, clear);

		return token;
	}
	// used
	async setToken(userId, token, clear = false) {
		this.ctx.state.user = { userId };

		const data = await this.app.keepworkModel.userdatas.get(userId);

		data.tokens = data.tokens || [];
		if (clear) data.tokens = [];

		data.tokens.splice(0, 0, token);
		// 只支持10个token
		if (data.tokens.length > 20) data.tokens.pop();
		await this.app.keepworkModel.userdatas.set(userId, data);
	}

	async validateToken(userId, token) {
		const data = await this.app.keepworkModel.userdatas.get(userId);
		const tokens = data.tokens || [];
		//console.log(userId, data, token);
		return _.find(tokens, o => o == token) ? true : false;
	}

	async createRegisterMsg(user) {
		const msg = await this.app.keepworkModel.messages.create({
			sender: 0,
			type: 0,
			all: 0,
			msg: {
				type: 1,
				user: {
					...user,
					password: undefined,
				},
			},
			extra: {},
		}).then(o => o && o.toJSON());
		return await this.app.keepworkModel.userMessages.create({
			userId: user.id, messageId: msg.id, state: 0
		}).then(o => o && o.toJSON());
	}

	async register(user) {
		await this.createRegisterMsg(user);
	}

	/**
	 * 通过条件获取user
	 * @param {*} condition 必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Classroom.findOne({ where: condition });
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
	 * 
	 * @param {*} userDatas 
	 */
	async bulkCreateKeepworkUser(userDatas) {
		const ret = await this.ctx.keepworkModel.Users.bulkCreate(userDatas);
		return ret ? ret.map(r => r.get()) : [];
	}

	/**
	 * 
	 * @param {*} userinfos 
	 */
	async bulkCreateUserinfos(userinfos) {
		const ret = await this.ctx.keepworkModel.userinfos.bulkCreate(userinfos);
		return ret ? ret.map(r => r.get()) : [];
	}

	/**
 	* 根据条件更新
 	* @param {*} params 更新的字段
 	* @param {*} condition 条件
 	*/
	async updateKeepworkUserByCondition(params, condition) {
		return await this.ctx.keepworkModel.Users.update(params, { where: condition });
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

		const [account = {}, tutorService, teacher, allianceMember, tutor] = await Promise.all([
			ctx.keepworkModel.accounts.getByUserId(userId),
			ctx.model.Tutor.getByUserId(userId),
			ctx.model.Teacher.getByUserId(userId),
			ctx.keepworkModel.roles.getAllianceMemberByUserId(userId),
			ctx.keepworkModel.roles.getTutorByUserId(userId)
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

		const cdKey = await this.ctx.model.TeacherCDKey.findOne({ where: { key } }).then(o => o && o.toJSON());
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
