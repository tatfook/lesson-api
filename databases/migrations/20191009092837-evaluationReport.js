"use strict";

module.exports = {
	up: (queryInterface, Sequelize) => {
		const {
			BIGINT,
			STRING,
			INTEGER,
			JSON,
			DATE
		} = Sequelize;

		return queryInterface.sequelize.transaction(t => Promise.all([
			queryInterface.addColumn("lessonOrganizations", "QRCode", { type: Sequelize.STRING(256) }, { transaction: t }),
			queryInterface.addColumn("lessonOrganizations", "propaganda", { type: Sequelize.STRING(256) }, { transaction: t }),
			queryInterface.addColumn("lessonOrganizationClassMembers", "parentPhoneNum", { type: Sequelize.STRING(11) }, { transaction: t }),
			queryInterface.createTable("evaluationUserReports", {
				id: {
					type: BIGINT,
					autoIncrement: true,
					primaryKey: true,
				},
				userId: {
					type: BIGINT,
					defaultValue: 0,
				},

				reportId: {
					type: BIGINT,
					defaultValue: 0,
				},

				star: {
					type: INTEGER,
					defaultValue: 1,
				},

				spatial: {
					type: INTEGER,
					defaultValue: 1,
				},

				collaborative: {
					type: INTEGER,
					defaultValue: 1,
				},

				creative: {
					type: INTEGER,
					defaultValue: 1,
				},
				logical: {
					type: INTEGER,
					defaultValue: 1,
				},
				compute: {
					type: INTEGER,
					defaultValue: 1,
				},
				coordinate: {
					type: INTEGER,
					defaultValue: 1,
				},
				comment: {
					type: STRING(256),
					defaultValue: "",
				},
				mediaUrl: {
					type: JSON,
					defaultValue: [],
				},
				isSend: {
					type: INTEGER,
					defaultValue: 0
				},
				createdAt: {
					allowNull: false,
					type: DATE
				},

				updatedAt: {
					allowNull: false,
					type: DATE
				},
			}, {
				underscored: false,
				charset: "utf8mb4",
				collate: "utf8mb4_bin",
				indexes: [
					{
						fields: ["userId"],
					},
					{
						fields: ["reportId"],
					},
				],
				transaction: t
			}),
			queryInterface.createTable("evaluationReports", {
				id: {
					type: BIGINT,
					autoIncrement: true,
					primaryKey: true,
				},

				userId: {
					type: BIGINT,
					defaultValue: 0,
				},

				name: {
					type: STRING,
					allowNull: false
				},

				type: {
					type: INTEGER,
					defaultValue: 1,
				},

				classId: {
					type: BIGINT,
					defaultValue: 0,
				},

				createdAt: {
					allowNull: false,
					type: DATE
				},

				updatedAt: {
					allowNull: false,
					type: DATE
				},
			}, {
				underscored: false,
				charset: "utf8mb4",
				collate: "utf8mb4_bin",
				indexes: [
					{
						fields: ["userId"],
					},
					{
						fields: ["classId"],
					},
				],
				transaction: t
			})
		]));
	},

	down: (queryInterface, Sequelize) => {
		return queryInterface.sequelize.transaction(t => Promise.all([
			queryInterface.removeColumn("lessonOrganizations", "QRCode", { transaction: t }),
			queryInterface.removeColumn("lessonOrganizations", "propaganda", { transaction: t }),
			queryInterface.removeColumn("lessonOrganizationClassMembers", "parentPhoneNum", { transaction: t }),
			queryInterface.dropTable("evaluationUserReports", { transaction: t }),
			queryInterface.dropTable("evaluationReports", { transaction: t })
		]));
	}
};
