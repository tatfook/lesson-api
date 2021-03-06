'use strict';

const email = require('../common/email.js');
const Controller = require('./baseController.js');

class EmailController extends Controller {
    show() {
        this.ctx.throw(400);
    }

    async create() {
        const params = this.ctx.request.body;
        this.ctx.validate(
            {
                to: 'string',
                subject: 'string',
                html: 'string',
            },
            params
        );

        const { to, subject, html, from } = params;
        const ok = await email(this.app)(to, subject, html, from);

        return this.success(ok);
    }
}

module.exports = EmailController;
