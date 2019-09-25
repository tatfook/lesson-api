
const _ = require("lodash");
const Controller = require("./baseController.js");
const Err = require("../common/err");

class SubjectsController extends Controller {
	// get
	async index() {
		const { ctx } = this;
		const query = ctx.query || {};

		const list = await ctx.service.subject.findAllByCondition(this.queryOptions, query);
		return ctx.helper.success({ ctx, status: 200, res: list });
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const subject = await ctx.service.subject.getByCondition({ id });
		if (!subject) ctx.throw(404, Err.NOT_FOUND);

		return ctx.helper.success({ ctx, status: 200, res: subject });
	}

	async create() {
		this.ensureAdmin();
		const { ctx } = this;
		const params = ctx.request.body;

		const result = await ctx.service.subject.createSubject(params);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async update() {
		this.ensureAdmin();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const params = ctx.request.body;

		const result = await ctx.service.subject.updateByCondition(params, { id });

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async destroy() {
		this.ensureAdmin();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);

		const result = await ctx.service.subject.destoryByCondition({ id });

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

}

module.exports = SubjectsController;
