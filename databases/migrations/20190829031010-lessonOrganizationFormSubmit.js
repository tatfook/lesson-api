"use strict";

const tableName = "lessonOrganizationFormSubmits";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
			INTEGER,
			STRING,
			TEXT,
			DATE,
			JSON } = Sequelize;

		await queryInterface.createTable(tableName, {
			"id": {
				type: BIGINT,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},

			"userId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},
			"organizationId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},
			"formId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},
			"state": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},
			"quizzes": {
				type: JSON,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false
			},
			"comment": {
				type: STRING(1024),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},
			"extra": {
				type: JSON,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false
			},
			"createdAt": {
				type: DATE,
				allowNull: false,
				primaryKey: false,
				autoIncrement: false,

			},

			"updatedAt": {
				type: DATE,
				allowNull: false,
				primaryKey: false,
				autoIncrement: false,
			},
		}, {
			underscored: false,
			charset: "utf8mb4",
			collate: "utf8mb4_bin",
		});
	},

	down: async (queryInterface, Sequelize) => {
		return queryInterface.dropTable(tableName);
	}
};
