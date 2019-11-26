'use strict';

const _ = require('lodash');
const jwt = require('jwt-simple');
const Controller = require('./baseController.js');
const Err = require('../common/err');

const {
    sendSms,
    verifyCode,
    updateUserInfo,
    updateParentNum,
    updateParentNum2,
} = require('../common/validatorRules/evaluationReport');

const AN_HOUR_SECONDS = 3600; // 一小时的秒
const THOUSAND = 1000;
const A_DAY_HOURS = 24; // 一天的小时

class UsersController extends Controller {
    token() {
        const env = this.app.config.env;
        this.enauthenticated();
        const user = this.currentUser();
        user.exp =
            Date.now() / THOUSAND +
            (env === 'prod'
                ? AN_HOUR_SECONDS * A_DAY_HOURS * THOUSAND
                : AN_HOUR_SECONDS * A_DAY_HOURS);
        const token = jwt.encode(user, this.app.config.self.secret);

        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: token,
        });
    }

    tokeninfo() {
        return this.ctx.helper.success({
            ctx: this.ctx,
            status: 200,
            res: this.enauthenticated(),
        });
    }

    // 获取当前用户  不存在则创建
    async index() {
        const { ctx } = this;
        this.enauthenticated();
        const user = this.currentUser();

        const data = await this.ctx.service.user.getCurrentUser(user);

        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    // 获取用户信息
    async show() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const data = await ctx.service.user.getCurrentUser({ userId: id });

        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    // 发送短信验证码
    async sendSms() {
        const { ctx } = this;
        this.enauthenticated();

        const { cellphone } = ctx.request.body;
        this.validateCgi({ cellphone }, sendSms);

        const six = 6;
        const nine = 9;
        const sixty = 60;
        const list = [ '15219998888' ]; // 需要返回特定验证码的手机号

        const env = this.app.config.self.env;
        const code =
            env === 'unittest' || list.includes(cellphone)
                ? '123456'
                : _.times(six, () => _.random(0, nine, false)).join('');

        const check = await this.app.redis.get(`verifCode:${cellphone}`);
        if (check) ctx.throw(400, Err.DONT_SEND_REPEAT);

        await this.app.redis.set(`verifCode:${cellphone}`, code, 'EX', sixty);
        if (env !== 'unittest' && !list.includes(cellphone)) {
            const res = await ctx.service.user.sendSms(cellphone, [
                code,
                '1分钟',
            ]);
            if (!res) {
                await this.app.redis.del(`verifCode:${cellphone}`);
                ctx.throw(400, Err.SENDSMS_ERR);
            }
        }

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    // 校验验证码
    async verifyCode() {
        const { ctx } = this;
        this.enauthenticated();

        const { cellphone, verifCode } = ctx.request.body;
        this.validateCgi({ cellphone, verifCode }, verifyCode);

        const check = await this.app.redis.get(`verifCode:${cellphone}`);

        return ctx.helper.success({
            ctx,
            status: 200,
            res: check === verifCode,
        });
    }

    // 获取用户信息，keepwork头像，机构中的realname,和家长手机号
    async getUserInfo() {
        const { ctx } = this;
        const { userId, organizationId } = this.enauthenticated();
        const { studentId } = ctx.request.query; // 老师获取学生的信息，传该参数
        // 检查师生身份
        if (studentId) {
            const check = await ctx.service.user.checkTeacherRole(
                userId,
                organizationId,
                studentId
            );
            if (!check) ctx.throw(403, Err.AUTH_ERR);
        }

        const ret = await ctx.service.user.getPortraitRealNameParentNum(
            studentId ? studentId : userId,
            organizationId
        );

        return ctx.helper.success({ ctx, status: 200, res: ret });
    }

    // 修改keepwork头像，在机构中的realname和家长手机号【也可不传parentPhoneNum, verifCode】
    async updateUserInfo() {
        const { ctx } = this;
        const { userId, organizationId } = this.enauthenticated();

        const {
            portrait,
            realname,
            parentPhoneNum,
            verifCode,
        } = ctx.request.body;

        this.validateCgi({ realname }, updateUserInfo);

        if (parentPhoneNum) {
            this.validateCgi({ parentPhoneNum, verifCode }, updateParentNum);
            const check = await this.app.redis.get(
                `verifCode:${parentPhoneNum}`
            );
            if (check !== verifCode) ctx.throw(400, Err.VERIFCODE_ERR);
        }

        await ctx.service.user.updatePortraitRealNameParentNum({
            portrait,
            realname,
            parentPhoneNum,
            userId,
            organizationId,
        });

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    // 修改家长手机号【第二步】
    async updateParentphonenum() {
        const { ctx } = this;
        const { userId, organizationId } = this.enauthenticated();

        const {
            parentPhoneNum,
            verifCode,
            newParentPhoneNum,
            newVerifCode,
        } = ctx.request.body;
        this.validateCgi(
            { parentPhoneNum, verifCode, newParentPhoneNum, newVerifCode },
            updateParentNum2
        );

        const [ check1, check2 ] = await Promise.all([
            this.app.redis.get(`verifCode:${parentPhoneNum}`),
            this.app.redis.get(`verifCode:${newParentPhoneNum}`),
        ]);
        if (check1 !== verifCode || check2 !== newVerifCode) {
            ctx.throw(400, Err.VERIFCODE_ERR);
        }

        await ctx.service.user.updateParentphonenum(
            userId,
            organizationId,
            newParentPhoneNum
        );

        return ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    async create() {
        const { ctx } = this;
        this.enauthenticated();
        const user = this.currentUser();

        const data = await ctx.service.user.getByIdOrCreate(
            user.userId,
            user.username
        );

        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    async update() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        this.enauthenticated();
        const userId = this.currentUser().userId;

        if (~~id !== userId) ctx.throw(400, Err.ARGS_ERR);

        const params = ctx.request.body;

        delete params.lockCoin;
        delete params.coin;
        delete params.bean;
        delete params.identify;
        delete params.username;

        const result = await ctx.service.user.updateUserByCondition(params, {
            id,
        });

        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }
}

module.exports = UsersController;
