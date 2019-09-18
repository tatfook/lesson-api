"use strict";

module.exports = (options, app) => {
	// 全局捕获异常
	return async function (ctx, next) {
		try {
			await next();
		} catch (e) {
			console.log("--------没关系啊，你不是抓到我了吗？O(∩_∩)O---------");
			ctx.helper.fail({ ctx, status: 500, errMsg: "服务器异常" });
			app.model.Log.create({ text: e.stack });
		}
	};
};