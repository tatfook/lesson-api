
const md5 = require("blueimp-md5");
const { app, mock, assert } = require("egg-mock/bootstrap");
const loadFactory = require("./factory.js");


module.exports = app => {
	app.mock = app.mock || {};

	app.login = async (user = {}) => {
		// 伪造token
		user.username = user.username || "user0001";
		user.password = md5("123456");
		user.id = user.id || 1;
		user.roleId = user.roleId || 1;

		const token = app.util.jwt_encode({
			userId: user.id,
			roleId: user.roleId,
			username: user.username
		}, app.config.self.secret, 3600 * 24 * 2);
		return { token };
		// user = await app.factory.create("users", user).then(o => o.toJSON());
		// return await app.httpRequest().post(`/api/v0/users/login`).send({
		// 	username: user.username,
		// 	password: "123456",
		// }).expect(res => assert(res.statusCode === 200)).then(res => res.body);
	};

	app.adminLogin = async () => {
		await app.model.admins.create({ username: "user001", password: md5("123456") });
		return await app.httpRequest().post(`/api/v0/admins/login`).send({
			username: "user001",
			password: "123456",
		}).expect(res => assert(res.statusCode === 200)).then(res => res.body);
	};

	loadFactory(app);
};
