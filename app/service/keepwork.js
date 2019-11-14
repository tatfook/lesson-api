'use strict';

const Service = require('../common/service.js');
const Err = require('../common/err');
const apiKey = require('../common/consts').API_KEY;
/**
 * 这个类负责和keepwork那边做交互
 */
class KeepworkService extends Service {
    get baseUrl() {
        return this.config.self.coreServiceBaseUrl;
    }

    /**
     * attributes: ["id", "username", "nickname", "portrait", "vip", "tLevel"]
     * @param {*} condition condition
     */
    async getAllUserByCondition(condition) {
        const list = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}users`,
            condition,
            {},
            true
        );
        return list ? list : this.ctx.throw(500, Err.UNKNOWN_ERR);
    }

    async getUserById(userId) {
        const ret = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}users/${userId}`
        );
        return ret ? ret : this.ctx.throw(500, Err.UNKNOWN_ERR);
    }

    /**
     *
     * @param {*} condition condition
     * @param {*} order order
     */
    async getAllProjectByCondition(condition, order) {
        const list = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}lessons/projects`,
            Object.assign({ condition }, { order, apiKey }),
            {},
            true
        );
        return list ? list : this.ctx.throw(500, Err.UNKNOWN_ERR);
    }

    // 获取数据库的token
    async getUserDatas(userId) {
        const ret = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}lessons/userdatas`,
            { id: userId, apiKey }
        );
        return ret;
    }

    // 更新token
    async setUserDatas(userId, data) {
        const ret = await this.ctx.helper.curl(
            'post',
            `${this.baseUrl}lessons/userdatas`,
            Object.assign({ id: userId, apiKey }, data)
        );
        return ret;
    }

    // 更新记录,调用update
    async update(params, condition) {
        const ret = await this.ctx.helper.curl(
            'put',
            `${this.baseUrl}lessons/update`,
            { condition, params, apiKey }
        );
        return ret;
    }

    async getAccountsAndRoles(userId) {
        const ret = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}lessons/accountsAndRoles`,
            { userId, apiKey }
        );
        return ret;
    }

    // 增加数值，调用increment
    async accountIncrement(incrementObj, userId) {
        const ret = await this.ctx.helper.curl(
            'put',
            `${this.baseUrl}lessons/accountsIncrement`,
            { incrementObj, userId, apiKey }
        );
        return ret;
    }

    // 查找accounts，调用findOne
    async getAccounts(userId) {
        const ret = await this.ctx.helper.curl(
            'get',
            `${this.baseUrl}lessons/accounts`,
            { userId, apiKey }
        );
        return ret;
    }

    // 创建记录，params是要创建的记录对象，调用create
    async createRecord(params) {
        const ret = await this.ctx.helper.curl(
            'post',
            `${this.baseUrl}lessons/createRecord`,
            { params, apiKey }
        );
        return ret;
    }

    // 截断表记录
    async truncate(params) {
        const ret = await this.ctx.helper.curl(
            'post',
            `${this.baseUrl}lessons/truncate`,
            { params, apiKey }
        );
        return ret;
    }

    // 更新用户的VIP和tLevel信息
    async updateUser(userId, params) {
        const ret = await this.ctx.helper.curl(
            'put',
            `${this.baseUrl}lessons/users/${userId}`,
            { params, apiKey }
        );
        return ret;
    }
}

module.exports = KeepworkService;
