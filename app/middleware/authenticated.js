"use strict";

const jwt = require("../common/jwt.js");

module.exports = (options, app) => {
	const config = app.config.self;
	return async function (ctx, next) {
		const Authorization = ctx.request.header.authorization || ("Bearer " + (ctx.cookies.get("token") || ""));
		const token = Authorization.split(" ")[1] || "";

		// 普通token
		try {
			ctx.state.user = jwt.decode(token, config.secret);
		} catch (e) {
			ctx.state.user = {};
		}

		// admin token【dashboard那边】
		try {
			ctx.state.admin = token ? jwt.decode(token, config.adminSecret, false) : {};
			ctx.state.admin.admin = true;
		} catch (e) {
			ctx.state.admin = {};
		}

		ctx.state.token = token;
		await next();
	};
};
