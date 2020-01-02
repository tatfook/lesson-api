'use strict';

const Controller = require('./baseController.js');
const Err = require('../common/err');

const CoreApiKey = '9435c6503642d25c3f3bd66a4af7b56c'; // coreApi的md5值

const CoreApi = class extends Controller {
    // 创建注册消息
    async createRegisterMsg() {
        const ctx = this.ctx;
        const { user, apiKey } = this.validate();
        if (apiKey !== CoreApiKey) return this.ctx.throw(400, Err.AUTH_ERR);

        await this.ctx.service.message.createRegisterMsg(user);

        return this.ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    async createUser() {
        const ctx = this.ctx;
        const { id, username, apiKey } = this.validate();

        if (apiKey !== CoreApiKey) return this.ctx.throw(400, Err.AUTH_ERR);

        await this.ctx.service.user.getByIdOrCreate(id, username);
        return this.ctx.helper.success({ ctx, status: 200, res: 'OK' });
    }

    async getPackagesAndLessonCount() {
        const ctx = this.ctx;
        let { condition, apiKey } = this.validate();

        if (apiKey !== CoreApiKey) return this.ctx.throw(400, Err.AUTH_ERR);

        try {
            condition =
                typeof condition === 'string'
                    ? JSON.parse(condition)
                    : condition;
        } catch (e) {
            this.ctx.throw(400, Err.ARGS_ERR);
        }

        const ret = await this.ctx.service.package.getAllByConditionAndLessonCount(
            condition
        );
        return this.ctx.helper.success({ ctx, status: 200, res: ret });
    }
};

module.exports = CoreApi;
