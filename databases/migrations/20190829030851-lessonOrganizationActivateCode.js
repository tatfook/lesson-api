
"use strict";

const tableName = "lessonOrganizationActivateCodes";
const indexes = [
	{
		"primary": true,
		"fields": [
			{
				"attribute": "id",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "PRIMARY"
	},
	{
		"primary": false,
		"fields": [
			{
				"attribute": "key",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "key"
	}
];

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
			STRING,
			INTEGER,
			DATE,
			JSON,
		} = Sequelize;
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

			"classId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"key": {
				type: STRING(255),
				allowNull: false,
				primaryKey: false,
				autoIncrement: false,

			},

			"state": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"activateUserId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"activateTime": {
				type: DATE,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"username": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"realname": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"extra": {
				type: JSON,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

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

		for (let i = 0; i < indexes.length; i++) {
			const index = indexes[i];
			if (index.primary) continue;
			await queryInterface.addIndex(tableName, index);
		}


	},

	down: async (queryInterface, Sequelize) => {
		return queryInterface.dropTable(tableName);
	}
};
