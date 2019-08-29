"use strict";

const tableName = "lessonOrganizationForms";

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

			"state": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"type": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"name": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},

			"title": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},
			"description": {
				type: STRING(1024),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},

			"text": {
				type: TEXT("long"),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false
			},
			"quizzes": {
				type: JSON,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false
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
