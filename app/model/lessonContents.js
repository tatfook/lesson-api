const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		TEXT,
		JSON,
	} = app.Sequelize;
	
	const model = app.model.define("lessonContents", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		lessonId: {
			type: BIGINT,
			allowNull: false,
		},

		version: {
			type: INTEGER,
			allowNull: false,
			defaultValue: 0,
		},

		content: {
			type: TEXT,
			defaultValue: "",
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});
	
	model.release = async function (userId, lessonId, content) {
		let count = await app.model.LessonContents.count({
			where: {
				userId,
				lessonId,
			}
		});

		count = count + 1;

		const data = await app.model.LessonContents.create({
			userId,
			version: count,
			lessonId,
			content,
		});

		return data;
	};

	model.content = async function (lessonId, version) {
		const where = { lessonId };
		if (version) where.version = _.toNumber(version);

		const list = await app.model.LessonContents.findAll({
			where,
			limit: 1,
			order: [["version", "DESC"]],
		});

		if (list.length > 0) return list[0].get({ plain: true });

		return {};
	};


	return model;
};
