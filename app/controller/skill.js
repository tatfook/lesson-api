'use strict';

const _ = require('lodash');
const Controller = require('./baseController.js');
const Err = require('../common/err');

class SkillsController extends Controller {
    // get
    async index() {
        const { ctx } = this;
        const query = ctx.query || {};

        const list = await ctx.service.skill.findAllByCondition(
            this.queryOptions,
            query
        );

        return ctx.helper.success({ ctx, status: 200, res: list });
    }

    async create() {
        this.ensureAdmin();
        const { ctx } = this;
        const params = ctx.request.body;

        ctx.validate(
            {
                skillName: 'string',
            },
            params
        );

        const result = await ctx.service.skill.createSkill(params);

        return ctx.helper.success({ ctx, status: 200, res: result });
    }

    async update() {
        this.ensureAdmin();
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const params = ctx.request.body;

        const result = await ctx.service.skill.updateByCondition(params, {
            id,
        });

        return ctx.helper.success({ ctx, status: 200, res: result });
    }

    async destroy() {
        this.ensureAdmin();
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const result = await ctx.service.skill.destoryByCondition({ id });

        return ctx.helper.success({ ctx, status: 200, res: result });
    }
}

module.exports = SkillsController;
