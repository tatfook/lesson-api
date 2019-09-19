
const email = require("./app/common/email.js");
const util = require("./app/common/util.js");
const api = require("./app/common/api.js");

module.exports = async (app) => {
	app.util = util;
	email(app);
	api(app);
};
