
const _ = require("lodash");
const Controller = require("../core/baseController.js");

class SkillsController extends Controller {
	// get
	async index() {
		const {ctx} = this;
		const query = ctx.query || {};

		const list = await ctx.model.Skills.findAll({...this.queryOptions, where:query});

		return this.success(list);
	}

	async create() {
		this.ensureAdmin();
		const {ctx} = this;
		const params = ctx.request.body;

		ctx.validate({
			skillName: "string",
		}, params);

		const result = await ctx.model.Skills.create(params);

		return this.success(result);
	}

	async update() {
		this.ensureAdmin();
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const params = ctx.request.body;

		const result = await ctx.model.Skills.update(params, {where:{id}});

		return this.success(result);
	}

	async destroy() {
		this.ensureAdmin();
		const {ctx} = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const result = await ctx.model.Skills.destroy({
			where: {id},
		});

		return this.success(result);
	}
}

module.exports = SkillsController;
