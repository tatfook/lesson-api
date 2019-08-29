"use strict";
const tableName = "lessonOrganizationLogs";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
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

			"organizationId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"type": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},

			"description": {
				type: TEXT("long"),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
			},

			"handleId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"username": {
				type: STRING(255),
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
