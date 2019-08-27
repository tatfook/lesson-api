'use strict';

module.exports = {
	up: (queryInterface, Sequelize) => {
		const {
			BIGINT,
			STRING,
			INTEGER,
			TEXT,
			DATE,
			JSON,
		} = Sequelize;

		return queryInterface.createTable('packages', { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			userId: {
				type: BIGINT,
				allowNull: false,
			},

			packageName: {
				type: STRING,
				allowNull: false,
				unique: true,
			},

			subjectId: {
				type: BIGINT,
			},

			minAge: {
				type: INTEGER,
				defaultValue: 0,
			},

			maxAge: {
				type: INTEGER,
				defaultValue: 1000,
			},

			state: { //  0 - 初始状态  1 - 审核中  2 - 审核成功  3 - 审核失败  4 - 异常态(审核成功后被改坏可不用此状态 用0代替)
				type: INTEGER,
				defaultValue: 0,
			},

			intro: {
				type: STRING(512),
			},

			rmb: {
				type: INTEGER,
				defaultValue: 0,
			},

			coin: {
				type: INTEGER,
				defaultValue: 0,
			},

			extra: {
				type: JSON,
				defaultValue: {
					coverUrl: "",
				}
			},

			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},

			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			},

			}, {
				underscored: false,
				charset: "utf8mb4",
				collate: 'utf8mb4_bin',
			});
	},

	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('packages');
	}
};
