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

		return queryInterface.createTable('packageSorts', { 
			id: {
				type: BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},

			packageId: {          // 课程包ID
				type: BIGINT,
				unique: true,
				allowNull: false,
			},

			hotNo: {              // 热门序号
				type: INTEGER,
				defaultValue: 0,  // 
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
		return queryInterface.dropTable('packageSorts');
	}
};
