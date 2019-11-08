'use strict';

const _ = require('lodash');
const Controller = require('./baseController.js');

class IndexController extends Controller {
    // get
    async index() {
        const user = await this.model.User.findOne();
        this.success(user);
    }

    show() {
        this.ctx.throw(400);
    }

    async config() {
        const params = this.ctx.request.body;

        this.ensureAdmin();

        _.merge(this.app.config.self, params);

        return this.success('OK');
    }
}

module.exports = IndexController;
