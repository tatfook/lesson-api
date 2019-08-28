
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
};
