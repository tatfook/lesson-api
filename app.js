"use strict";

const email = require("./app/common/email.js");
const api = require("./app/common/api.js");
const sms = require("./app/common/sms");

module.exports = async (app) => {
	email(app);
	api(app);
	sms(app);
};
