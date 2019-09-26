"use strict";

const nodemailer = require("nodemailer");

module.exports = app => {
	const config = app.config.self;

	const transporter = nodemailer.createTransport({
		host: config.email.host,
		port: config.email.port || 587,
		secure: false,
		auth: {
			user: config.email.user,
			pass: config.email.pass,
		},
	});

	const sendEmail = async function (to, subject, html, from) {
		from = from || config.email.from || config.email.user;

		const ok = await new Promise((resolve, reject) => {
			transporter.sendMail({
				from,
				to,
				subject,
				html,
			}, function (err) {
				if (err) {
					console.log(err);
					return resolve(false);
				}

				return resolve(true);
			});
		});

		return ok;
	};

	app.sendEmail = sendEmail;

	return sendEmail;
};
