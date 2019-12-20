'use strict';

const _ = require('lodash');
const Service = require('egg').Service;
const Err = require('../common/err');
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const md5 = require('blueimp-md5');
const consts = require('../common/consts');

const tokenUpperLimit = 20; // 只支持20个token

class User extends Service {
    async token(payload, clear) {
        const config = this.app.config.self;
        const tokenExpire = config.tokenExpire || consts.TOKEN_DEFAULT_EXPIRE;
        const token = this.ctx.helper.jwtEncode(
            payload,
            config.secret,
            tokenExpire
        );

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
        return await this.ctx.model.LessonOrganizationClassMember.checkTeacherRoleSql(
            teacherId,
            organizationId,
            studentId
        );
    }

    // 获取keepwork头像，在机构中的realname,家长手机号，到期时间，以及vip和tLevel
    async getPortraitRealNameParentNum(userId, organizationId) {
        const [users, member] = await Promise.all([
            this.ctx.service.keepwork.getAllUserByCondition({ id: userId }),
            this.ctx.service.lessonOrganizationClassMember.getByCondition({
                organizationId,
                memberId: userId,
                roleId: { $in: ['1', '3', '65', '67'] },
            }),
        ]);

        return {
            portrait: users.length ? users[0].portrait : '',
            vip: users.length ? users[0].vip : 0,
            tLevel: users.length ? users[0].tLevel : 0,
            realname: member ? member.realname : '',
            parentPhoneNum: member ? member.parentPhoneNum : '',
            endTime: member ? member.endTime : '',
        };
    }

    // 修改keepwork头像，在机构中的realname和家长手机号
    async updatePortraitRealNameParentNum({
        portrait,
        realname,
        parentPhoneNum,
        userId,
        organizationId,
    }) {
        if (parentPhoneNum) {
            const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition(
                { memberId: userId }
            );
            if (member.parentPhoneNum) {
                // 家长手机号已经绑定，再修改的话不应该用这个接口
                this.ctx.throw(400, Err.UNKNOWN_ERR);
            }
        }

        await Promise.all([
            this.ctx.service.keepwork.update(
                { portrait, resources: 'users' },
                { id: userId }
            ),
            this.ctx.service.lessonOrganizationClassMember.updateByCondition(
                { realname, parentPhoneNum },
                { memberId: userId, organizationId }
            ),
        ]);
    }

    // 修改家长手机号【第二步】
    async updateParentphonenum(userId, organizationId, parentPhoneNum) {
        return await this.ctx.service.lessonOrganizationClassMember.updateByCondition(
            { parentPhoneNum },
            { memberId: userId, organizationId }
        );
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

        const [
            account,
            allianceMember,
            tutor,
        ] = await ctx.service.keepwork.getAccountsAndRoles(userId);

        data.rmb = account.rmb;
        data.coin = account.coin;
        data.bean = account.bean;
        data.allianceMember = allianceMember;
        data.tutor = tutor;

        return data;
    }

    /**
     * 根据条件更新
     * @param {*} params params
     * @param {*} condition condition
     */
    async updateUserByCondition(params, condition) {
        return await this.ctx.model.User.update(params, { where: condition });
    }

    getBatch() {
        const two = 2;
        const four = 4;
        const date = new Date();
        const year = _.padStart(date.getFullYear(), four, '0');
        const month = _.padStart(date.getMonth() + 1, two, '0');
        const day = _.padStart(date.getDate(), two, '0');
        const hour = _.padStart(date.getHours(), two, '0');
        const minute = _.padStart(date.getMinutes(), two, '0');
        const second = _.padStart(date.getSeconds(), two, '0');

        return year + month + day + hour + minute + second;
    }

    // 发送短信
    async sendSms(to, datas, templateId = '194012') {
        const smsConfig = this.app.config.self.sms;
        // 主帐号,对应开官网发者主账号下的 ACCOUNT SID
        const accountSid = smsConfig.accountSid;
        // 主帐号令牌,对应官网开发者主账号下的 AUTH TOKEN
        const accountToken = smsConfig.accountToken;
        // 应用Id，在官网应用列表中点击应用，对应应用详情中的APP ID
        // 在开发调试的时候，可以使用官网自动为您分配的测试Demo的APP ID
        const appId = smsConfig.appId;
        // 请求地址
        // 沙盒环境（用于应用开发调试）：sandboxapp.cloopen.com
        // 生产环境（用户应用上线使用）：app.cloopen.com
        const serverIP = smsConfig.serverIP;
        // 请求端口，生产环境和沙盒环境一致
        const serverPort = smsConfig.serverPort;
        // REST版本号，在官网文档REST介绍中获得。
        const softVersion = smsConfig.softVersion;

        const batch = this.getBatch();
        const sig = md5(accountSid + accountToken + batch).toUpperCase();
        const url =
            'https://' +
            serverIP +
            ':' +
            serverPort +
            '/' +
            softVersion +
            '/Accounts/' +
            accountSid +
            '/SMS/TemplateSMS?sig=' +
            sig;
        const params = {
            appId,
            to,
            datas,
            templateId,
        };

        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=utf-8',
            Authorization: Base64.encode(accountSid + ':' + batch),
        };

        const data = await axios
            .post(url, params, { headers })
            .then(res => res.data);

        if (data.statusCode === '000000') return true;

        return false;
    }
}

module.exports = User;
