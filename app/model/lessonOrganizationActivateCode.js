
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		JSON,
		DATE,
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationActivateCodes", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		classId: { // 班级Id
			type: BIGINT,
			defaultValue: 0,
		},

		key: { // 激活码
			type: STRING,
			unique: true,
			allowNull: false,
		},

		state: { // 0 - 未激活 1 - 已激活
			type: INTEGER,
			defaultValue: 0,
		},

		activateUserId: {
			type: BIGINT,
			defaultValue: 0,
		},

		activateTime: {
			type: DATE,
		},

		username: {
			type: STRING,
		},

		realname: {
			type: STRING,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	app.model.lessonOrganizationActivateCodes = model;

	return model;
};

