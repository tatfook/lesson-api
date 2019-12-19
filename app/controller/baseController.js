'use strict';

const joi = require('joi');
const _ = require('lodash');
const Controller = require('egg').Controller;

const Err = require('../common/err');
const { KEEPWORKUSER_ADMIN_ROLEID } = require('../common/consts');

const validator = require('../common/validatorExtend');

const rules = {
    int: joi.number().required(),
    int_optional: joi.number(),
    number: joi.number().required(),
    number_optional: joi.number(),
    string: joi.string().required(),
    string_optional: joi.string(),
    boolean: joi.boolean().required(),
    boolean_optional: joi.boolean(),
};

class BaseController extends Controller {
    getParams() {
        return _.merge(
            {},
            this.ctx.request.body,
            this.ctx.query,
            this.ctx.params
        );
    }

    validate(schema = {}, options = { allowUnknown: true }) {
        const params = this.getParams();

        _.each(schema, (val, key) => {
            schema[key] = rules[val] || val;
        });

        const result = joi.validate(params, schema, options);

        if (result.error) {
            const errmsg = result.error.details[0].message.replace(/"/g, '');
            this.ctx.throw(400, 'invalid params:' + errmsg);
        }

        _.assignIn(params, result.value);

        return params;
    }

    validate2(str, rules) {
        for (const k in rules) {
            if (k === 'require' || k === 'transform') {
                continue;
            }
            const method = validator[k];
            if (typeof method !== 'function') {
                throw new Error(`非法的校验方法${k}！`);
            }
            const rule = rules[k];
            const [errmsg, param] = [rule.errmsg, rule.param];
            if (Array.isArray(param)) {
                if (!method.call(null, str, ...param)) {
                    return { error: errmsg };
                }
            } else if (typeof param === 'object') {
                if (!method.call(null, str, param)) {
                    return { error: errmsg };
                }
            } else if (!method.call(null, str)) {
                return { error: errmsg };
            }
        }
        return {};
    }

    // 采用校验库 https://www.npmjs.com/package/validator
    validateCgi(param, cgiConfig) {
        if (!param || !cgiConfig) {
            this.ctx.throw(400, Err.ARGS_ERR);
        }
        for (const k in cgiConfig) {
            const rules = cgiConfig[k];
            let userParam = param[k];
            if (userParam === null || userParam === undefined) {
                if (rules.require === 0) {
                    continue;
                }
                this.ctx.throw(400, `缺少参数${k}！`);
            }
            if (typeof userParam === 'number') {
                userParam = userParam.toString();
            }
            const ret = this.validate2(userParam, rules);
            if (ret.error) {
                this.ctx.throw(400, ret.error);
            }
        }
    }

    formatQuery(query) {
        const self = this;
        const Op = this.app.Sequelize.Op;
        const two = 2;
        for (const key in query) {
            const arr = key.split('-');
            if (arr.length !== two) continue;

            const val = query[key];
            delete query[key];

            const newkey = arr[0];
            const op = arr[1];
            const oldval = query[newkey];

            if (!_.isPlainObject(oldval)) {
                query[newkey] = {};
                if (oldval) {
                    query[newkey][Op.eq] = oldval;
                }
            }
            query[newkey][Op[op]] = val;
        }

        const replaceOp = function (data) {
            if (!_.isObject(data)) return;
            _.each(data, (val, key) => {
                if (_.isString(key)) {
                    const op = key.substring(1);
                    if (_.startsWith(key, '$') && Op[op]) {
                        data[Op[op]] = val;
                        delete data[key];
                    }
                    if (
                        key === '$model$' &&
                        typeof val === 'string' &&
                        self.model[val]
                    ) {
                        data.model = self.model[val];
                        delete data.$model$;
                    }
                }
                replaceOp(val);
            });
        };

        replaceOp(query);
    }

    async query() {
        const { ctx } = this;
        const model = this.model[this.modelName];
        const query = this.validate();

        this.formatQuery(query);

        const result = await model.findAndCount(query);

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async search() {
        const { ctx } = this;
        const query = ctx.request.body;
        this.formatQuery(query);
        const model = this.model[this.modelName];
        const result = await model.findAndCount({
            ...this.queryOptions,
            where: query,
        });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async index() {
        const { ctx } = this;
        const query = ctx.query;

        this.enauthenticated();
        const userId = this.currentUser().userId;

        query.userId = userId;

        const model = this.model[this.modelName];
        const result = await model.findAndCount({
            ...this.queryOptions,
            where: query,
        });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async create() {
        const { ctx } = this;
        const params = ctx.request.body;

        this.enauthenticated();
        const userId = this.currentUser().userId;

        params.userId = userId;

        const model = this.model[this.modelName];
        const result = await model.create(params);

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async show() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        this.enauthenticated();

        if (!id) ctx.throw(400, Err.ID_ERR);
        const userId = this.currentUser().userId;

        const model = this.model[this.modelName];
        const result = await model.findOne({ where: { id, userId } });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async update() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        const params = ctx.request.body;

        this.enauthenticated();

        if (!id) ctx.throw(400, Err.ID_ERR);

        const userId = this.currentUser().userId;

        const model = this.model[this.modelName];
        const result = await model.update(params, { where: { id, userId } });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async destroy() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        this.enauthenticated();

        if (!id) ctx.throw(400, Err.ID_ERR);

        const userId = this.currentUser().userId;

        const model = this.model[this.modelName];
        const result = await model.destroy({ where: { id, userId } });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async postExtra() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        const params = ctx.request.body || {};

        this.enauthenticated();
        if (!id) ctx.throw(400, Err.ID_ERR);
        const { userId } = this.currentUser();

        const model = this.model[this.modelName];
        const result = await model.update(
            { extra: params },
            { where: { id, userId } }
        );

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async putExtra() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        const params = ctx.request.body || {};

        this.enauthenticated();
        if (!id) ctx.throw(400, Err.ID_ERR);
        const { userId } = this.currentUser();

        const where = { id, userId };
        const model = this.model[this.modelName];
        let data = await model.findOne({ where });
        if (!data) this.throw(404);
        data = data.get({ plain: true });

        const extra = data.extra || {};
        _.merge(extra, params);

        const result = await model.update({ extra }, { where });

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    async getExtra() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        this.enauthenticated();
        if (!id) ctx.throw(400, Err.ID_ERR);
        const { userId } = this.currentUser();

        const where = { id, userId };
        const model = this.model[this.modelName];
        let data = await model.findOne({ where });
        if (!data) this.throw(404);
        data = data.get({ plain: true });

        ctx.helper.success({ ctx, status: 200, res: data.extra || {} });
    }

    async deleteExtra() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        this.enauthenticated();
        if (!id) ctx.throw(400, Err.ID_ERR);
        const { userId } = this.currentUser();

        const model = this.model[this.modelName];
        const result = await model.update(
            { extra: {} },
            { where: { id, userId } }
        );

        ctx.helper.success({ ctx, status: 200, res: result });
    }

    getUser() {
        return this.ctx.state.user || {};
    }

    currentUser() {
        return this.ctx.state.user || {};
    }

    // 确保认证  废弃
    enauthenticated() {
        if (!this.isAuthenticated()) return this.ctx.throw(401, Err.AUTH_ERR);

        return this.currentUser();
    }

    authenticated() {
        return this.enauthenticated();
    }

    adminAuthenticated() {
        const config = this.config.self;
        const token = this.ctx.state.token;
        const user = this.ctx.helper.jwtDecode(
            token || '',
            config.adminSecret,
            true
        );
        if (!user) return this.ctx.throw(401, Err.AUTH_ERR);

        return user;
    }

    get queryOptions() {
        return this.ctx.state.queryOptions;
    }

    get model() {
        return this.app.model;
    }

    throw(...args) {
        return this.ctx.throw(...args);
    }

    ensureAdmin() {
        this.enauthenticated();
        const roleId = this.currentUser().roleId;

        if (roleId !== KEEPWORKUSER_ADMIN_ROLEID) {
            this.ctx.throw(403, Err.AUTH_ERR);
        }
    }

    isAuthenticated() {
        const user = this.ctx.state.user;
        if (user && user.userId !== undefined) return true;

        return false;
    }

    success(body, status = 200) {
        this.ctx.status = status;
        this.ctx.body = body;
    }

    fail(body, status, data) {
        this.ctx.status = status || 400;
        if (_.isNumber(body)) body = Err.getByCode(body) || body;
        if (_.isObject(body)) body.data = data;
        this.ctx.body = body;
    }

    failed(status, msg) {
        this.ctx.status = status || 400;
        this.ctx.body = msg;
    }
}

module.exports = BaseController;
