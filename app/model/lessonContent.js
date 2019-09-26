"use strict";

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

		courseware: { // 课件内容
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

	model.release = async function (userId, lessonId, content, courseware) {
		let count = await app.model.LessonContent.count({
			where: {
				userId,
				lessonId,
			}
		});

		count = count + 1;

		const olddata = await model.content(lessonId);
		const data = await app.model.LessonContent.create({
			userId,
			version: count,
			lessonId,
			content: content || olddata.content || "",
			courseware: courseware || olddata.courseware || "",
		});

		return data;
	};

	model.content = async function (lessonId, version) {
		const where = { lessonId };
		if (version) where.version = _.toNumber(version);

		const list = await app.model.LessonContent.findAll({
			where,
			limit: 1,
			order: [["version", "DESC"]],
		});

		if (list.length > 0) return list[0].get({ plain: true });

		return {};
	};


	return model;
};
