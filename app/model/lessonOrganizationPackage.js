
module.exports = app => {
	const {
		BIGINT,
		JSON,
		DATE
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationPackages", {
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
				fields: ["organizationId", "classId", "packageId"],
			},
		],
	});

	// model.sync({force:true});

	app.model.lessonOrganizationPackages = model;

	model.associate = () => {
		app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizations, {
			as: "lessonOrganizations",
			foreignKey: "organizationId",
			targetKey: "id",
			constraints: false,
		});

		app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizationClassMembers, {
			as: "lessonOrganizationClassMembers",
			foreignKey: "classId",
			targetKey: "classId",
			constraints: false,
		});

		app.model.lessonOrganizationPackages.belongsTo(app.model.lessonOrganizationClasses, {
			as: "lessonOrganizationClasses",
			foreignKey: "classId",
			targetKey: "id",
			constraints: false,
		});
	};

	return model;
};

