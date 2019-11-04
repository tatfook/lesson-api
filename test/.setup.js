
const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require("lodash");
const Chance = require("chance");
const loader = require("./setup/loader.js");


before(() => {
	loader(app);
	app.chance = new Chance();
});

afterEach(async () => {
	const tables = await app.model.query(`show tables`, { type: app.model.QueryTypes.SHOWTABLES }).then(list => _.filter(list, o => o != "SequelizeMeta"));
	const opts = { restartIdentity: true, cascade: true };
	const list = [];
	_.each(tables, tableName => list.push(app.model[tableName] && app.model[tableName].truncate(opts)));
	await Promise.all(list);
});
