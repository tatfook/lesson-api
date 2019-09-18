"use strict";

module.exports = {
	success: ({ ctx, status = 200, res = null }) => {
		ctx.status = status;
		ctx.body = {
			message: "请求成功",
			data: res
		};
	},
	fail: ({ ctx, status = 500, errMsg }) => {
		ctx.status = status;
		ctx.body = {
			message: errMsg,
			data: {}
		};
	}
};