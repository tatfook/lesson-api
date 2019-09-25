"use strict";

module.exports = app => {
	const {
		BIGINT,
		TEXT,
	} = app.Sequelize;

	const model = app.model.define("logs", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		text: {
			type: TEXT,
			defaultValue: "",
		}
	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	return model;
};
