
module.exports = app => {
	const {
		BIGINT,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("tutors", {
		id: { // 记录id
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: { // 用户id
			type: BIGINT,
			allowNull: false,
			unique: true,
		},

		tutorId: { // 导师id
			type: BIGINT,
		},

		startTime: { // 开始时间
			type: BIGINT,
			defaultValue: 0,
		},

		endTime: { // 结束时间
			type: BIGINT,
			defaultValue: 0,
		},

		extra: { // 额外数据
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});
	
	model.getByUserId = async function (userId) {
		return await app.model.tutors.findOne({ where: { userId }}).then(o => o && o.toJSON());
	};
	
	app.model.tutors = model;
	return model;
};
