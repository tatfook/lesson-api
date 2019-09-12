
const _ = require("lodash");
const uuidv1 = require("uuid/v1");
// const consts = require("../core/consts.js");
const Controller = require("../core/baseController.js");

class TeacherCDKeysController extends Controller {
	async index() {
		this.adminAuthenticated();
		const { ctx } = this;
		const query = ctx.query;

		const list = await ctx.model.TeacherCDKey.findAndCount({ ...this.queryOptions, where: query });

		return this.success(list);
	}

	async generate() {
		this.adminAuthenticated();
		const { ctx } = this;
		const params = ctx.query || {};

		const count = _.toNumber(params.count) || 1;
		const list = [];

		for (let i = 0; i < count; i++) {
			let key = uuidv1().replace(/\-/g, "");
			let data = await ctx.model.TeacherCDKey.create({ key });
			list.push(data);
		}

		return this.success(list);
	}

	async update() {
		this.adminAuthenticated();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");
		const params = ctx.request.body;

		delete params.key;
		delete params.teacherId;
		const result = await ctx.model.TeacherCDKey.update(params, { where: { id } });

		return this.success(result);
	}

	async destroy() {
		this.adminAuthenticated();
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, "id invalid");

		const result = await ctx.model.TeacherCDKey.destroy({ where: { id } });

		return this.success(result);
	}
}

module.exports = TeacherCDKeysController;
