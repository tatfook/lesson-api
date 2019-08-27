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

		return queryInterface.createTable("coins", { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			userId: {
				type: BIGINT,
				allowNull: false,
			},

			type: {
				type: INTEGER,
				defaultValue: 0,
			},
			
			amount: {      // 金额
				type: INTEGER,
				defaultValue: 0,
			},

			desc: {
				type:STRING,
			},

			extra: {     // 额外数据
				type: JSON,
				defaultValue:{},
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
		return queryInterface.dropTable('coins');
	}
};
