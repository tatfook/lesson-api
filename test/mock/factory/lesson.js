module.exports = app => {
	const { factory } = app;
	const tableName = 'Lesson';

	factory.define(tableName, app.model[tableName], {
		userId: factory.chance('integer', { min: 1 }),
		lessonName: factory.chance('word', {
			length: 5,
		}),
	});
};
