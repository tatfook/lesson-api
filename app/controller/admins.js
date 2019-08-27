
const _ = require("lodash");
const Controller = require("../core/baseController.js");

class AdminsController extends Controller {
	parseParams() {
		const params = this.ctx.params || {};
		const resourceName = params["resources"] || "";

		this.resource = this.ctx.model[_.upperFirst(resourceName)];
		this.resourceName = resourceName;

		if (!this.resource) this.ctx.throw(400, "args error");

		this.adminAuthenticated();

		return;
	}
	
	async query() {
		this.adminAuthenticated();

		const {sql} = this.validate({sql:"string"});
		const _sql = sql.toLowerCase();
		if (_sql.indexOf("select ") != 0 || 
				_sql.indexOf(";") >= 0 ||
				_sql.indexOf("upsert ") >= 0 ||
				_sql.indexOf("drop ") >= 0 ||
				_sql.indexOf("update ") >= 0 || 
				_sql.indexOf("delete ") >= 0 ||
				_sql.indexOf("create ") >= 0 ||
				_sql.indexOf("show ") >= 0 ||
				_sql.indexOf("alter ") >= 0) {
			return this.throw(404, "sql 不合法");
		}

		const list = await this.model.query(sql, {
			type: this.model.QueryTypes.SELECT,
		});

		return this.success(list);
	}

	async resourcesQuery() {
		this.adminAuthenticated();
		this.parseParams();

		const query = this.validate();

		this.formatQuery(query);
		console.log(query);

		const list = await this.resource.findAndCount(query);

		this.success(list);
	}

	async search() {
		this.parseParams();
		const query = this.validate();

		this.formatQuery(query);

		const list = await this.resource.findAndCount({...this.queryOptions, where:query});

		this.success(list);
	}

	async index() {
		this.parseParams();
		const {ctx} = this;

		const query = ctx.query || {};
		const list = await this.resource.findAndCount({...this.queryOptions, where:query});

		this.success(list);
	}

	async show() {
		this.parseParams();
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);

		if (!id) ctx.throw(400, "args error");

		const data = await this.resource.findOne({where:{id}});

		return this.success(data);
	}

	async create() {
		this.parseParams();
		const {ctx} = this;
		const params = ctx.request.body;

		const data = await this.resource.create(params);

		return this.success(data);
	}

	async update() {
		this.parseParams();
		const {ctx} = this;
		const params = ctx.request.body;
		const id = _.toNumber(ctx.params.id);

		if (!id) ctx.throw(400, "args error");

		const data = await this.resource.update(params, {where:{id}});

		if (this.resource.adminUpdateHook) await this.resource.adminUpdateHook(params);
		return this.success(data);
	}

	async destroy() {
		this.parseParams();
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);

		if (!id) ctx.throw(400, "args error");

		const data = await this.resource.destroy({where:{id}});

		return this.success(data);
	}
}

module.exports = AdminsController;
