module.exports = app => {
    const { factory } = app;
    const tableName = 'LessonOrganization';

    factory.define(tableName, app.model[tableName], {
        name: factory.chance('string', {
            length: 5,
        }),
        endDate: '2220-01-01',
    });
};
