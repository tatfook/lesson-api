
const email = require("./app/core/email.js");
const util = require("./app/core/util.js");
const api = require("./app/core/api.js");

module.exports = async (app) => {
	app.util = util;
	email(app);
	api(app);
};
