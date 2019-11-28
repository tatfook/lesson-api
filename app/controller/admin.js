'use strict';

const _ = require('lodash');
const Controller = require('./baseController.js');
const Err = require('../common/err');

class AdminsController extends Controller {
    // 检查model存不存在，和管理员权限
    parseParams() {
        const { ctx } = this;
        const params = this.ctx.params || {};
        const resourceName = params.resources || '';

        this.resource = this.ctx.model[_.upperFirst(resourceName)];
        this.resourceName = resourceName;

        if (!this.resource) {
            return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ARGS_ERR });
        }

        this.adminAuthenticated();

        return params;
    }

    async query() {
        this.adminAuthenticated();
        const { ctx } = this;

        // 只允许select语句，且不可执行多条语句
        const { sql } = this.validate({ sql: 'string' });
        const _sql = sql.toLowerCase();
        if (
            _sql.indexOf('select ') !== 0 ||
            _sql.indexOf(';') >= 0 ||
            _sql.indexOf('upsert ') >= 0 ||
            _sql.indexOf('drop ') >= 0 ||
            _sql.indexOf('update ') >= 0 ||
            _sql.indexOf('delete ') >= 0 ||
            _sql.indexOf('create ') >= 0 ||
            _sql.indexOf('show ') >= 0 ||
            _sql.indexOf('alter ') >= 0
        ) {
            return ctx.helper.fail({ ctx, status: 400, errMsg: Err.SQL_ERR });
        }

        const list = await this.model.query(sql, {
            type: this.model.QueryTypes.SELECT,
        });

        return ctx.helper.success({ ctx, status: 200, res: list });
    }

    async resourcesQuery() {
        const { ctx } = this;

        this.adminAuthenticated();
        this.parseParams();

        const query = this.validate();

        this.formatQuery(query);

        const list = await this.resource.findAndCount(query);

        ctx.helper.success({ ctx, status: 200, res: list });
    }
    async vipTLevelUpdate() {
        const { ctx } = this;
        this.adminAuthenticated();
        const members = await this.app.model.queryInterface.sequelize.query(
            `SELECT DISTINCT
                memberId
            FROM
                lessonOrganizationClassMembers;`,
            { type: this.app.model.QueryTypes.SELECT }
        );
        const memberIds = members.map(member => member.memberId);
        await Promise.all(
            memberIds.map(id => {
                return ctx.service.lessonOrganizationClassMember.updateUserVipAndTLevel(
                    id
                );
            })
        );
        ctx.helper.success({
            ctx,
            status: 200,
            res: { memberIds, length: memberIds.length },
        });
    }
    async search() {
        const { ctx } = this;
        this.parseParams();
        const query = this.validate();

        this.formatQuery(query);

        const list = await this.resource.findAndCount({
            ...this.queryOptions,
            where: query,
        });

        ctx.helper.success({ ctx, status: 200, res: list });
    }

    async index() {
        this.parseParams();
        const { ctx } = this;

        const query = ctx.query || {};
        const list = await this.resource.findAndCount({
            ...this.queryOptions,
            where: query,
        });

        ctx.helper.success({ ctx, status: 200, res: list });
    }

    async show() {
        this.parseParams();
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        if (!id) {
            return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ID_ERR });
        }

        const data = await this.resource.findOne({ where: { id } });

        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    async create() {
        this.parseParams();
        const { ctx } = this;
        const params = ctx.request.body;

        const data = await this.resource.create(params);

        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    async bulkCreate() {
        const { ctx } = this;
        this.adminAuthenticated();

        const datas = this.parseParams();

        const data = await this.resource.bulkCreate(datas);

        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    async update() {
        this.parseParams();
        const { ctx } = this;
        const params = ctx.request.body;
        const id = _.toNumber(ctx.params.id);

        if (!id) {
            return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ID_ERR });
        }

        const data = await this.resource.update(params, { where: { id } });

        if (this.resource.adminUpdateHook) {
            await this.resource.adminUpdateHook(params);
        }
        return ctx.helper.success({ ctx, status: 200, res: data });
    }

    async destroy() {
        this.parseParams();
        const { ctx } = this;
        const id = _.toNumber(ctx.params.id);

        if (!id) {
            return ctx.helper.fail({ ctx, status: 400, errMsg: Err.ID_ERR });
        }

        const data = await this.resource.destroy({ where: { id } });

        return ctx.helper.success({ ctx, status: 200, res: data });
    }
}

module.exports = AdminsController;
