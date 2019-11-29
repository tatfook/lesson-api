'use strict';

module.exports = app => {
    const { factory } = app;
    const tableName = 'LessonOrganizationClass';

    factory.define(tableName, app.model[tableName], {
        organizationId: app.factory.assoc('LessonOrganization', 'id'),
        name: factory.chance('string', {
            length: 5,
        }),
    });
};
