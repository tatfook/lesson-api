"use strict";

module.exports = (options, app) => {
	// 全局捕获异常
	return async function (ctx, next) {
		try {
			await next();
		} catch (e) {
			let [status, errMsg] = [500, "服务器异常"];

			if (e.status) { // 内部主动throw的错误
				[status, errMsg] = [e.status, e.message];
			}

			app.model.Log.create({ text: e.stack || e.message });

			ctx.helper.fail({ ctx, status, errMsg });
		}
	};
};