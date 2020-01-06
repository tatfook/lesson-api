'use strict';

module.exports = app => {
    const { factory } = app;
    const tableName = 'LessonOrganizationPackage';

    factory.define(tableName, app.model[tableName], {
        organizationId: app.factory.assoc('LessonOrganization', 'id'),
        classId: app.factory.assoc('LessonOrganizationClass', 'id'),
        packageId: app.factory.assoc('Package', 'id'),
        lessons: [],
    });
};
