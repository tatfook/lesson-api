'use strict';
const { ValidationError } = require('egg-ajv/error');

exports.keys = 'lesson';

exports.cors = {
    origin: '*',
};

exports.middleware = [ 'authenticated', 'pagination' ];

exports.security = {
    xframe: {
        enable: false,
    },
    csrf: {
        enable: false,
    },
};

exports.bodyParser = {
    jsonLimit: '1mb',
    formLimit: '1mb',
};

exports.onerror = {
    all: (e, ctx) => {
        const message = e.stack || e.message || e.toString();
        ctx.status = 500;
        ctx.body = message;

        if (e.name === 'SequelizeUniqueConstraintError') {
            ctx.status = 409;
        } else if (e instanceof ValidationError) {
            // 参数校验错误
            ctx.body = JSON.stringify(e.errors);
            ctx.status = 422;
        } else if (e.status) {
            ctx.status = e.status;
            ctx.body = JSON.stringify({
                message: e.message,
            });
        }

        ctx.model.Log.create({ text: JSON.stringify(e) });
    },
};
