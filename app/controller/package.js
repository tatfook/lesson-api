'use strict';

const _ = require('lodash');
const consts = require('../common/consts.js');
const Controller = require('./baseController.js');
const Err = require('../common/err');

const { PACKAGE_STATE_AUDIT_SUCCESS } = consts;

class PackagesController extends Controller {
    async search() {
        const { ctx } = this;
        const query = ctx.query || {};
        if (query.state === undefined) {
            query.state = PACKAGE_STATE_AUDIT_SUCCESS;
        }

        const data = await this.ctx.service.package.searchPackages(
            this.queryOptions,
            query
        );

        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    // get
    async index() {
        const { ctx } = this;
        const query = ctx.query || {};
        this.enauthenticated();
        query.userId = this.currentUser().userId;

        const result = await ctx.service.package.getAllAndCountByCondition(
            query
        );

        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    // 获取单一课程包
    async show() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ARGS_ERR);
        const data = await ctx.service.package.getByCondition({ id });

        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    // 获取课程详情
    async detail() {
        const { ctx } = this;
        this.enauthenticated();
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ARGS_ERR);

        const data = await this.ctx.service.package.getPackageDetail(id);
        return this.ctx.helper.success({ ctx, status: 200, res: data });
    }

    // 创建课程包
    async create() {
        const { ctx } = this;
        const params = ctx.request.body;

        const ten = 10;
        this.enauthenticated();
        params.userId = this.currentUser().userId;
        params.coin = (params.rmb || 0) * ten;
        params.state = 0;

        const pack = await this.ctx.service.package.createPackage(params);

        return this.ctx.helper.success({ ctx, status: 200, res: pack });
    }

    async update() {
        const { ctx } = this;
        const params = ctx.request.body;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        this.enauthenticated();
        params.userId = this.currentUser().userId;
        params.id = id;

        const ten = 10;
        if (params.rmb !== undefined) params.coin = params.rmb * ten;
        delete params.state;

        const result = await this.ctx.service.package.updatePackage(params);
        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    async destroy() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        this.enauthenticated();
        const userId = this.currentUser().userId;

        const result = await this.ctx.service.package.destroyPackage(
            userId,
            id
        );

        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    async audit() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);
        const params = ctx.request.body;
        const { userId } = this.enauthenticated();

        const result = await this.ctx.service.package.audit(params, userId, id);

        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    async hots() {
        const { ctx } = this;

        const list = await ctx.service.package.getPackageByHot();

        return this.ctx.helper.success({ ctx, status: 200, res: list });
    }

    // 获取课程列表
    async lessons() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const list = await ctx.service.package.getLessonsOfPackage(id);

        return this.ctx.helper.success({ ctx, status: 200, res: list });
    }

    async addLesson() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const params = ctx.request.body;
        ctx.validate({
            lessonId: 'int',
        });

        this.enauthenticated();
        const userId = this.currentUser().userId;

        const result = await this.ctx.service.package.addLesson(
            userId,
            id,
            params.lessonId,
            params.lessonNo
        );
        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    async putLesson() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const params = ctx.request.body;
        ctx.validate({
            lessonId: 'int',
        });

        this.enauthenticated();
        const userId = this.currentUser().userId;

        const result = await this.ctx.service.package.updatePackageLesson(
            userId,
            id,
            params.lessonId,
            params.lessonNo
        );
        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }

    async deleteLesson() {
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);
        if (!id) ctx.throw(400, Err.ID_ERR);

        const params = ctx.query || {};
        const lessonId = params.lessonId && _.toNumber(params.lessonId);
        if (!lessonId) ctx.throw(401, 'args error');

        this.enauthenticated();
        const userId = this.currentUser().userId;

        const result = await this.ctx.service.package.deleteLesson(
            userId,
            id,
            lessonId
        );
        return this.ctx.helper.success({ ctx, status: 200, res: result });
    }
}

module.exports = PackagesController;
