
"use strict";

const tableName = "lessonOrganizationClasses";
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
				"attribute": "organizationId",
				"order": "ASC"
			},
			{
				"attribute": "name",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "lesson_organization_classes_organization_id_name"
	}
];

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
			STRING,
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

			"name": {
				type: STRING(255),
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},
			"begin": {
				type: DATE,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,

			},
			"end": {
				type: DATE,
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
