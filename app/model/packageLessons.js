
const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("packageLessons", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		packageId: {
			type: BIGINT,
			allowNull: false,
		},

		lessonId: {
			type: BIGINT,
			allowNull: false,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",

		indexes: [
			{
				unique: true,
				fields: ["packageId", "lessonId"],
			},
		],
	});

	// model.sync({force:true});

	model.getLessonCountByPackageIds = async function (packageIds = []) {
		if (packageIds.length === 0) return {};

		const sql = `select packageId, count(*) as count from packageLessons group by packageId having packageId in (:packageIds)`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				packageIds,
			},
		});

		const count = {};

		_.each(list, o => {count[o.packageId] = o.count;});

		return count;
	};

	app.model.packageLessons = model;

	return model;
};


