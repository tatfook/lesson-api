"use strict";

module.exports = (options, app) => {
	// 全局捕获异常
	return async function (ctx, next) {
		try {
			await next();
		} catch (e) {
			let status = 500;
			let errMsg = "服务器异常";
			if (e.status) { // 内部throw的错误
				status = e.status;
				errMsg = e.message;
			} else {
				app.model.Log.create({ text: e.stack });
			}

			ctx.helper.fail({ ctx, status, errMsg });
		}
	};
};