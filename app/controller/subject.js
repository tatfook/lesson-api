
const _ = require("lodash");
const Controller = require("./baseController.js");

class SubjectsController extends Controller {
	// get
	async index() {
		const { ctx } = this;
		const query = ctx.query || {};

		const list = await ctx.model.Subject.findAll({ ...this.queryOptions, where: query });

		return this.success(list);
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const subject = await ctx.model.Subject.findOne({ where: { id } });
		if (!subject) ctx.throw(404, "not found");

		return this.success(subject);
	}

	async create() {
		this.ensureAdmin();
		const { ctx } = this;
		const params = ctx.request.body;

		const result = await ctx.model.Subject.create(params);

		return this.success(result);
	}

	async update() {
		this.ensureAdmin();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.request.body;

		const result = await ctx.model.Subject.update(params, { where: { id } });

		return this.success(result);
	}

	async destroy() {
		this.ensureAdmin();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const result = await ctx.model.Subject.destroy({
			where: { id },
		});

		return this.success(result);
	}

}

module.exports = SubjectsController;
