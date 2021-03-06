module.exports = app => {
    const { factory } = app;
    const tableName = 'LessonOrganization';

    factory.define(tableName, app.model[tableName], {
        name: factory.chance('string', {
            length: 5,
        }),
        endDate: '2220-01-01',
        activateCodeLimit: {
            type5: 10,
            type6: 10,
            type7: 10,
        },
    });
};
