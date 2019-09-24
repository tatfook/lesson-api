"use strict";

const consts = require("../common/consts.js");
const { PACKAGE_STATE_AUDIT_SUCCESS } = consts;

const _ = require("lodash");
const Controller = require("./baseController.js");
const Err = require("../common/err");

class LearnRecordsController extends Controller {
	// get
	async index() {
		const { ctx } = this;
		const query = this.validate();
		const { userId } = this.authenticated();
		query.userId = userId;

		const result = await ctx.service.learnRecord.findLearnRecordAndCount(this.queryOptions, query);

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async show() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const lr = await ctx.service.learnRecord.getByCondition({ id, userId });

		if (!lr) return ctx.throw(404, Err.NOT_FOUND);

		return ctx.helper.success({ ctx, status: 200, res: lr });
	}

	async create() {
		const { ctx } = this;
		const params = ctx.request.body;

		const { userId = 0, username, organizationId } = this.currentUser();

		params.userId = userId;

		ctx.validate({
			packageId: "int",
			lessonId: "int",
			classroomId: { type: "int", required: false },
			state: "int",
		}, params);

		let learnRecord = await ctx.service.learnRecord.createLearnRecord(params);

		if (!params.classroomId) {
			await ctx.service.lessonOrganizationLog.classroomLog({
				lr: learnRecord, action: "learn", handleId: userId, username, organizationId
			});
		}
		return ctx.helper.success({ ctx, status: 200, res: learnRecord });
	}

	async update() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		const params = ctx.request.body || {};
		if (!id) return ctx.throw(400, Err.ID_ERR);

		const userId = this.currentUser().userId || 0;

		await ctx.service.learnRecord.updateLearnRecord(id, userId, params);

		return ctx.helper.success({ ctx, status: 200, res: "OK" });
	}

	async destroy() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) return ctx.throw(400, Err.ID_ERR);

		this.enauthenticated();
		const userId = this.currentUser().userId;

		const result = await ctx.service.learnRecord.destroyByCondition({ id, userId });

		return ctx.helper.success({ ctx, status: 200, res: result });
	}

	async createReward() {
		const { ctx } = this;
		const id = _.toNumber(ctx.params.id);
		if (!id) ctx.throw(400, Err.ID_ERR);
		this.enauthenticated();
		const userId = this.currentUser().userId;

		const lr = await ctx.service.learnRecord.getByCondition({ id, userId });
		const pack = await ctx.service.package.getByCondition({ id: lr.packageId });

		if (!pack || pack.state !== PACKAGE_STATE_AUDIT_SUCCESS) {
			return ctx.helper.success({ ctx, status: 200, res: { coin: 0, bean: 0 }});
		}

		const data = await ctx.service.lessonReward.getRewards(userId, lr.packageId, lr.lessonId);

		return ctx.helper.success({ ctx, status: 200, res: data || { coin: 0, bean: 0 }});
	}

	async getReward() {
		const { ctx } = this;
		this.enauthenticated();
		const userId = this.currentUser().userId;
		const params = this.validate({ "packageId": "int", "lessonId": "int" });

		const pack = await ctx.service.package.getByCondition({ id: params.packageId });
		if (!pack || pack.state !== PACKAGE_STATE_AUDIT_SUCCESS) {
			return ctx.helper.success({ ctx, status: 200, res: { coin: 10, bean: 10 }});
		}

		const data = await ctx.service.lessonReward.getByCondition({
			userId,
			packageId: params.packageId,
			lessonId: params.lessonId,
		});
		return ctx.helper.success({ ctx, status: 200, res: data || { coin: 0, bean: 0 }});
	}
}

module.exports = LearnRecordsController;
