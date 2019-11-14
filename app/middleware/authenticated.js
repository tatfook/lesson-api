'use strict';

const jwt = require('../common/jwt.js');

module.exports = (options, app) => {
    const config = app.config.self;
    return async function(ctx, next) {
        const Authorization =
            ctx.request.header.authorization ||
            'Bearer ' + (ctx.cookies.get('token') || '');
        const token = Authorization.split(' ')[1] || '';

        let [ flag1, flag2 ] = [ true, true ];
        // 普通token
        try {
            ctx.state.user = jwt.decode(token, config.secret);
        } catch (e) {
            flag1 = false;
            ctx.state.user = {};
        }

        // admin token【dashboard那边】
        try {
            ctx.state.admin = token
                ? jwt.decode(token, config.adminSecret, false)
                : {};
            ctx.state.admin.admin = true;
        } catch (e) {
            flag2 = false;
            ctx.state.admin = {};
        }

        if (!flag1 && !flag2) {
            // token解析失败，记录log
            app.model.Log.create({
                text: `TOKEN_ERR:path:${ctx.request.path},secret:${config.secret},adminSecret:${config.adminSecret},token:${token}`,
            });
        }

        ctx.state.token = token;
        await next();
    };
};
