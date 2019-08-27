
const axios = require("axios");
// const jwt = require("jwt-simple");
const jwt = require("../core/jwt.js");

module.exports = (options, app) => {
	const config = app.config.self;
	return async function (ctx, next) {
		const Authorization = ctx.request.header.authorization || ("Bearer " + (ctx.cookies.get("token") || ""));
		const token = Authorization.split(" ")[1] || "";
		const headers = { "Authorization": Authorization };
		let user = undefined;

		try {
			user = jwt.decode(token, config.secret);
			// 验证token是否有效
			if (this.app.config.env !== "unittest") {
				await axios.get(config.coreServiceBaseUrl + "users/profile", { headers }).catch(e => { user = undefined; });
			}
		} catch (e) {
		}

		ctx.state.token = token;
		ctx.state.user = user || {};

		await next();
	};
};
