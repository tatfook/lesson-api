module.exports = app => {
	const { factory } = app;
	const tableName = 'Package';

	factory.define(tableName, app.model[tableName], {
		userId: factory.chance('integer', { min: 1 }),
		packageName: factory.chance('string', { length: 5 }),
		subjectId: factory.chance('integer', { min: 1 }),
	});
};
