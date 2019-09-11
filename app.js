
const email = require("./app/core/email.js");
const util = require("./app/core/util.js");
const api = require("./app/core/api.js");
const association = require("./app/core/association.js");

module.exports = async (app) => {
	app.util = util;

	email(app);
	api(app);

	association(app); // 定义模型关系
};
