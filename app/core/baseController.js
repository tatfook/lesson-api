const joi = require("joi");
const _ = require("lodash");
const Controller = require("egg").Controller;

const Err = require("./err.js");

const rules = {
	"int": joi.number().required(),
	"int_optional": joi.number(),
	"number": joi.number().required(),
	"number_optional": joi.number(),
	"string": joi.string().required(),
	"string_optional": joi.string(),
	"boolean": joi.boolean().required(),
	"boolean_optional": joi.boolean(),
}

class BaseController extends Controller {
	getParams() {
		return _.merge({}, this.ctx.request.body, this.ctx.query, this.ctx.params);
	}

	validate(schema = {}, options = {allowUnknown:true}) {
		const params = this.getParams();

		_.each(schema, (val, key) => {
			schema[key] = rules[val] || val;
		});

		const result = joi.validate(params, schema, options);

		if (result.error) {
			const errmsg = result.error.details[0].message.replace(/"/g, '');
			console.log(params);
			this.ctx.throw(400, "invalid params:" + errmsg);
		}

		_.assignIn(params, result.value);

		return params;
	}
	
	formatQuery(query) {
		const self = this;
		const Op = this.app.Sequelize.Op;
		for (let key in query) {
			const arr = key.split("-");
			if (arr.length != 2) continue;

			const val = query[key];
			delete query[key];
			
			const newkey = arr[0];
			const op = arr[1];
			const oldval = query[newkey];

			if (!_.isPlainObject(oldval)) {
				query[newkey] = {};
				if (oldval) {
					query[newkey][Op["eq"]] = oldval;
				}
			}
			console.log(op, Op[op]);
			query[newkey][Op[op]] = val;
		}

		const replaceOp = function(data) {
			if (!_.isObject(data)) return ;
			_.each(data, (val, key) => {
				if (_.isString(key)) {
					const op = key.substring(1);
					if (_.startsWith(key, "$") && Op[op]) {
						data[Op[op]] = val;
						delete data[key];
					}
					if (key == "$model$" && typeof(val) == "string" && self.model[val]) {
						data["model"] = self.model[val];
						delete data["$model$"];
					}
				}
				replaceOp(val);
			});
		}

		replaceOp(query);
	}

	async query() {
		const model = this.model[this.modelName];
		const query = this.validate();

		this.formatQuery(query);

		const result = await model.findAndCount(query);

		this.success(result);
	}

	async search() {
		const {ctx} = this;
		const query = ctx.request.body;
		this.formatQuery(query);
		const model = this.model[this.modelName];
		const result = await model.findAndCount({...this.queryOptions, where:query});

		this.success(result);
	}
	
	async index() {
		const {ctx} = this;
		const query = ctx.query;

		this.enauthenticated();
		const userId = this.getUser().userId;

		query.userId = userId;

		const model = this.model[this.modelName];
		const result = await model.findAndCount({...this.queryOptions, where:query});

		this.success(result);
	}

	async create() {
		const {ctx} = this;
		const params = ctx.request.body;

		this.enauthenticated();
		const userId = this.getUser().userId;

		params.userId = userId;

		const model = this.model[this.modelName];
		const result = await model.create(params);

		this.success(result);
	}

	async show() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);

		this.enauthenticated();

		if (!id) ctx.throw(400, "id invalid");
		const userId = this.getUser().userId;

		const model = this.model[this.modelName];
		const result = await model.findOne({where:{id, userId}});

		this.success(result);
	}

	async update() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body;

		this.enauthenticated();

		if (!id) ctx.throw(400, "id invalid");

		const userId = this.getUser().userId;

		const model = this.model[this.modelName];
		const result = await model.update(params, {where:{id, userId}});

		this.success(result);
	}

	async destroy() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body;

		this.enauthenticated();

		if (!id) ctx.throw(400, "id invalid");

		const userId = this.getUser().userId;

		const model = this.model[this.modelName];
		const result = await model.destroy({where:{id, userId}});

		this.success(result);
	}

	async postExtra() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body || {};

		this.enauthenticated();
		if (!id) ctx.throw(400, "id invalid");
		const {userId} = this.getUser();

		const model = this.model[this.modelName];
		const result = await model.update({extra:params}, {where:{id, userId}});
		
		this.success(result);
	}

	async putExtra() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body || {};

		this.enauthenticated();
		if (!id) ctx.throw(400, "id invalid");
		const {userId} = this.getUser();

		const where = {id, userId};
		const model = this.model[this.modelName];
		let data = await model.findOne({where});
		if (!data) this.throw(404);
		data = data.get({plain:true});

		const extra = data.extra || {};
		_.merge(extra, params);

		const result = await model.update({extra}, {where});
		
		this.success(result);
	}

	async getExtra() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body || {};

		this.enauthenticated();
		if (!id) ctx.throw(400, "id invalid");
		const {userId} = this.getUser();

		const where = {id, userId};
		const model = this.model[this.modelName];
		let data = await model.findOne({where});
		if (!data) this.throw(404);
		data = data.get({plain:true});

		this.success(data.extra || {});
	}

	async deleteExtra() {
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);

		this.enauthenticated();
		if (!id) ctx.throw(400, "id invalid");
		const {userId} = this.getUser();

		const model = this.model[this.modelName];
		const result = await model.update({extra:{}}, {where:{id, userId}});
		
		this.success(result);
	}

	getUser() {
		return this.ctx.state.user || {};
	}

	// 确保认证  废弃
	enauthenticated() {
		if (!this.isAuthenticated()) this.ctx.throw(401, "unauthenticated");

		return this.getUser();
	}

	authenticated() {
		return this.enauthenticated();
	}

	adminAuthenticated() {
		const config = this.config.self;
		const token = this.ctx.state.token;
		const user = this.app.util.jwt_decode(token || "", config.adminSecret, true);
		if (!user) return this.throw(401);
		
		return user;
	}

	get queryOptions() {
		return this.ctx.state.queryOptions
	}

	get model() {
		return this.app.model;
	}

	throw(...args) {
		return this.ctx.throw(...args);
	}

	ensureAdmin() {
		this.enauthenticated();
		const roleId = this.getUser().roleId;

		if (roleId != 10) this.ctx.throw(403, "not admin");
	}

	isAuthenticated() {
		const user = this.ctx.state.user;
		if (user && user.userId != undefined) return true;

		return false;
	}

	success(body, status=200) {
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
