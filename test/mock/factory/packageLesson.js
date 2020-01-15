module.exports = app => {
    const { factory } = app;
    const tableName = 'PackageLesson';

    factory.define(tableName, app.model[tableName], {
        userId: factory.chance('integer', { min: 1 }),
        packageId: factory.chance('integer', { min: 1,max:100 }),
		lessonId: factory.chance('integer', { min: 1,max:100 }),
        lessonNo: factory.chance('integer', { min: 1,max:100 }),
    });
};
