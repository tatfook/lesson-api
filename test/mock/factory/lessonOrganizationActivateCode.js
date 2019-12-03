'use strict';

module.exports = app => {
    const { factory } = app;
    const tableName = 'LessonOrganizationActivateCode';

    factory.define(tableName, app.model[tableName], {
        organizationId: app.factory.assoc('LessonOrganization', 'id'),
        classId: app.factory.assoc('LessonOrganizationClass', 'id'),
        key: factory.chance('string', {
            length: 5,
        }),
        state: factory.chance('integer', {
            min: 0,
            max: 1,
        }),
        name: factory.chance('string', {
            length: 5,
        }),
    });
};
