
module.exports = app => {
	const {
		BIGINT,
		JSON
	} = app.Sequelize;

	const model = app.keepworkModel.define("lessonOrganizationPackages", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},
		
		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		classId: {
			type: BIGINT,
			defaultValue: 0,
		},

		packageId: {
			type: BIGINT,
			defaultValue: 0,
		},
		
		lessons: {
			type: JSON,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		}

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",

		indexes: [
			{
				unique: true,
				fields: ["organizationId", "classId", "packageId"],
			},
		],
	});

	// model.sync({force:true});
	
	app.keepworkModel.lessonOrganizationPackages = model;

	return model;
};

