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

		return queryInterface.createTable('teacherCDKeys', { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			userId: {  // 谁在使用此激活码
				type: BIGINT,
			},

			key: {
				type: STRING(64),
				allowNull: false,
			},

			state: {
				type: INTEGER,
				defaultValue: 0, // 0 --未使用 1 -- 已使用 2 -- 禁用态
			},
			
			extra: {
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
		return queryInterface.dropTable('teacherCDKeys');
	}
};
