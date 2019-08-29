
"use strict";

const tableName = "lessonOrganizationPackages";
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
				"attribute": "classId",
				"order": "ASC"
			},
			{
				"attribute": "packageId",
				"order": "ASC"
			}
		],
		"unique": true,
		"name": "lesson_organization_packages_organization_id_class_id_package_id"
	}
];

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const {
			BIGINT,
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

			"packageId": {
				type: BIGINT,
				allowNull: true,
				primaryKey: false,
				autoIncrement: false,
				defaultValue: "0"
			},

			"lessons": {
				type: JSON,
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
