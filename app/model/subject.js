"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("subjects", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		subjectName: {
			type: STRING(64),
			unique: true,
			allowNull: false,
		},

		enSubjectName: {
			type: STRING(64),
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

	return model;
};
