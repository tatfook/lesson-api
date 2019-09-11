
const lessonOrganizationClassMembers = require("./lessonOrganizationClassMembers");
const lessonOrganizationPackages = require("./lessonOrganizationPackage");
const lessonOrganizationActivateCodes = require("./lessonOrganizationActivateCode");

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
		DATE,
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationClasses", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		name: {
			type: STRING,
		},

		begin: {
			type: DATE,
			defaultValue: function () {
				return new Date();
			},
		},

		end: {
			type: DATE,
			defaultValue: function () {
				return new Date();
			},
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

		createdAt: {
			type: DATE,
		},

		updatedAt: {
			type: DATE,
		}
	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",

		indexes: [
			{
				unique: true,
				fields: ["organizationId", "name"],
			},
		],
	});

	// model.sync({force:true});


	// model.hasMany(lessonOrganizationClassMembers(app), {
	// 	as: "lessonOrganizationClassMembers",
	// 	foreignKey: "classId",
	// 	sourceKey: "id",
	// 	constraints: false,
	// });

	// model.hasMany(lessonOrganizationPackages(app), {
	// 	as: "lessonOrganizationPackages",
	// 	foreignKey: "classId",
	// 	sourceKey: "id",
	// 	constraints: false,
	// });

	// model.hasMany(lessonOrganizationActivateCodes(app), {
	// 	as: "lessonOrganizationActivateCodes",
	// 	foreignKey: "classId",
	// 	sourceKey: "id",
	// 	constraints: false,
	// });

	app.model.lessonOrganizationClasses = model;

	// app.model.lessonOrganizationActivateCodes = app.model.lessonOrganizationActivateCodes || lessonOrganizationActivateCodes(app);
	// app.model.lessonOrganizationPackages = app.model.lessonOrganizationPackages || lessonOrganizationPackages(app);
	// app.model.lessonOrganizationClassMembers = app.model.lessonOrganizationClassMembers || lessonOrganizationClassMembers(app);

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationActivateCodes, {
		as: "lessonOrganizationActivateCodes",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationPackages, {
		as: "lessonOrganizationPackages",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	app.model.lessonOrganizationClasses.hasMany(app.model.lessonOrganizationClassMembers, {
		as: "lessonOrganizationClassMembers",
		foreignKey: "classId",
		sourceKey: "id",
		constraints: false,
	});

	return model;
};

