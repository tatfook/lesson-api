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

		return queryInterface.createTable('learnRecords', { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			userId: {
				type: BIGINT,
				allowNull: false,
			},

			packageId: {
				type: BIGINT,
				allowNull: false,
			},

			lessonId: {
				type: BIGINT,
				allowNull: false,
			},

			classroomId: {
				type: BIGINT,
				defaultValue: 0,
			},

			state: { // 0 -- 课堂学习  1 -- 自学
				type: INTEGER,
				defaultValue: 0,
			},

			extra: {
				type: JSON,
				defaultValue: {},
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
		return queryInterface.dropTable('learnRecords');
	}
};
