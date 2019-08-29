
"use strict";

const tableName = "lessonOrganizations";
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
				"attribute": "name",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "name"
	},
	{
		"primary": false,
		"fields": [
			{
				"attribute": "loginUrl",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "loginUrl"
	}
];

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
			STRING,
			TEXT,
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

			"name": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},

			"logo": {
				type: TEXT("long"),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},
			"email": {
				type: STRING(256),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"cellphone": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"loginUrl": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"userId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"startDate": {
				type: DATE,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"endDate": {
				type: DATE,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},

			"state": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
			},

			"count": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"privilege": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},
			"location": {
				type: STRING(256),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: ""
			},
			"visibility": {
				type: INTEGER,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
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
