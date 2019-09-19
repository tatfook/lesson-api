
module.exports = app => {
	const {
		BIGINT,
		STRING,
		DATE,
		JSON,
	} = app.Sequelize;

	const attrs = {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			unique: true,
			allowNull: false,
		},

		// kid: {
		// type: BIGINT,
		// },

		// registerUsername: {     // 注册用户名
		// type: STRING(48),
		// },

		name: {
			type: STRING(48), // 用户姓名
		},

		email: {
			type: STRING(64),
		},

		qq: {
			type: STRING(24), // qq号
		},

		birthdate: { // 出生年月
			type: DATE,
		},

		school: { // 学校
			type: STRING,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},
	};

	const opts = {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	};

	const model = app.model.define("userinfos", attrs, opts);

	// model.sync({force:true});

	app.model.userinfos = model;

	return model;
};


