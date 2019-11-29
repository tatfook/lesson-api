'use strict';

module.exports = app => {
	const { factory } = app;
	const tableName = 'LessonOrganizationClassMember';

	const roleIds = [1, 2, 3, 64, 65, 66, 67];

	factory.define(tableName, app.model[tableName], {
		organizationId: app.factory.assoc('LessonOrganization', 'id'),
		classId: app.factory.assoc('LessonOrganizationClassId', 'id'),
		memberId: app.factory.chance('integer', {
			min: 1
		}),
		roleId: roleIds[app.factory.chance('integer', {
			min: 0,
			max: 6
		})],
		realname: app.factory.chance('word', { length: 6 })
	});
};
