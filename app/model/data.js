
module.exports = app => {
	const {
		BIGINT,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("datas", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
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

	return model;
};

