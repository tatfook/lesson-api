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

		return queryInterface.createTable('users', { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			username: {  // keepwork username
				type: STRING(64),
				unique: true,
				allowNull: false,
			},

			nickname: {  // lesson昵称或真是姓名
				type: STRING(64),
			},
			
			coin: {      // 知识币
				type: INTEGER,
				defaultValue: 0,
			},

			lockCoin: {   // 待解锁的知识币
				type: INTEGER,
				defaultValue: 0,
			},

			identify: {  // 身份
				type: INTEGER,  // 0 = 默认 1 - 学生  2 - 教师 4 - 申请老师
				defaultValue: 0,
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
		return queryInterface.dropTable('users');
	}
};
