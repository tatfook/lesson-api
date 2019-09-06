
module.exports = app => {
	const { factory } = app;
	const tableName = "users";
	factory.define(tableName, app.model[tableName], {
		username: factory.chance("word", { length: 10 }),
		password: factory.chance("string", { length: 10 }),
		email: factory.chance("email"),
		cellphone: factory.chance("integer", { min: 13000000000, max: 20000000000 }),
		realname: factory.chance("integer", { min: 13000000000, max: 20000000000 }),
	});
};
