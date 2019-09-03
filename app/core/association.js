
module.exports = app => {
	const users = app.model.users;
	const tutors = app.model.tutors;

	users.hasOne(tutors, {
		as: "student",
		foreignKey: "userId",
		constraints: false,
	});

	tutors.belongsTo(users, {
		as: "student",
		foreignKey: "userId",
		targetKey: "id",
		constraints: false,
	});

	users.hasOne(tutors, {
		as: "tutor",
		foreignKey: "tutorId",
		constraints: false,
	});

	tutors.belongsTo(users, {
		as: "tutor",
		foreignKey: "tutorId",
		targetKey: "id",
		constraints: false,
	});

	app.model.users.hasOne(app.model.teachers, {
		as: "teachers",
		foreignKey: "userId",
		constraints: false,
	});

	app.model.teachers.belongsTo(app.model.users, {
		as: "users",
		foreignKey: "userId",
		targetKey: "id",
		constraints: false,
	});

	app.model.teachers.hasMany(app.model.teacherCDKeys, {
		as: "teacherCDKeys",
		foreignKey: "userId",
		sourceKey: "userId",
		constraints: false,
	});

	app.model.teacherCDKeys.belongsTo(app.model.teachers, {
		as: "teachers",
		foreignKey: "userId",
		targetKey: "userId",
		constraints: false,
	});

	app.model.packages.hasMany(app.model.packageLessons, {
		as: "packageLessons",
		foreignKey: "packageId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.packageLessons.belongsTo(app.model.packages, {
		as: "packages",
		foreignKey: "packageId",
		targetKey: "id",
		constraints: false,
	});

	app.model.lessons.hasMany(app.model.packageLessons, {
		as: "packageLessons",
		foreignKey: "lessonId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.packageLessons.belongsTo(app.model.lessons, {
		as: "lessons",
		foreignKey: "lessonId",
		targetKey: "id",
		constraints: false,
	});

	// app.model.users.hasMany(app.model.lessonOrganizations, {
	// 	as: "lessonOrganizations",
	// 	foreignKey: "userId",
	// 	sourceKey: "id",
	// 	constraints: false,
	// });

	// app.model.lessonOrganizations.belongsTo(app.model.users, {
	// 	as: "users",
	// 	foreignKey: "userId",
	// 	targetKey: "id",
	// 	constraints: false,
	// });

	app.model.lessonOrganizations.hasMany(app.model.lessonOrganizationPackages, {
		as: "lessonOrganizationPackages",
		foreignKey: "organizationId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizations, {
		as: "lessonOrganizations",
		foreignKey: "organizationId",
		targetKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizations.hasMany(app.model.lessonOrganizationClassMembers, {
		as: "lessonOrganizationClassMembers",
		foreignKey: "organizationId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClassMembers.belongsTo(app.model.lessonOrganizations, {
		as: "lessonOrganizations",
		foreignKey: "organizationId",
		targetKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationClassMembers, {
		as: "lessonOrganizationClassMembers",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClassMembers.belongsTo(app.model.lessonOrganizationClasses, {
		as: "lessonOrganizationClasses",
		foreignKey: "classId",
		targetKey: "id",
		constraints: false,
	});

	// app.model.users.hasOne(app.model.lessonOrganizationClassMembers, {
	// 	as: "lessonOrganizationClassMembers",
	// 	foreignKey: "memberId",
	// 	sourceKey: "id",
	// 	constraints: false,
	// });

	// app.model.lessonOrganizationClassMembers.belongsTo(app.model.users, {
	// 	as: "users",
	// 	foreignKey: "memberId",
	// 	targetKey: "id",
	// 	constraints: false,
	// });

	app.model.lessonOrganizationClassMembers.hasMany(app.model.lessonOrganizationPackages, {
		as: "lessonOrganizationPackages",
		foreignKey: "classId",
		sourceKey: "classId",
		constraints: false,
	});

	app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizationClassMembers, {
		as: "lessonOrganizationClassMembers",
		foreignKey: "classId",
		targetKey: "classId",
		constraints: false,
	});

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationPackages, {
		as: "lessonOrganizationPackages",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizationClasses, {
		as: "lessonOrganizationClasses",
		foreignKey: "classId",
		targetKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationActivateCodes, {
		as: "lessonOrganizationActivateCodes",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationActivateCodes.belongsTo(app.model.lessonOrganizationClasses, {
		as: "lessonOrganizationClasses",
		foreignKey: "classId",
		targetKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationForms.hasMany(app.model.lessonOrganizationFormSubmits, {
		as: "lessonOrganizationFormSubmits",
		foreignKey: "formId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationFormSubmits.belongsTo(app.model.lessonOrganizationForms, {
		as: "lessonOrganizationForms",
		foreignKey: "formId",
		targetKey: "id",
		constraints: false,
	});

};
