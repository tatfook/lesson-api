
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

	app.model.lessonOrganizationClasses = model;

	return model;
};

