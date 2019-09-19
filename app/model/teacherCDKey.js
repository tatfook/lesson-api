const consts = require("../common/consts.js");

const {
	TEACHER_KEY_STATE_USING,
	TEACHER_KEY_STATE_DISABLE,
} = consts;

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("teacherCDKeys", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: { // 谁在使用此激活码
			type: BIGINT,
		},

		key: { // key 激活码
			type: STRING(64),
			allowNull: false,
		},

		state: { // 0 --未使用 1 -- 已使用 2 -- 禁用态
			type: INTEGER,
			defaultValue: 0,
		},

		expire: { // 激活码有效期
			type: BIGINT,
			defaultValue: 1000 * 3600 * 24 * 365,
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

	model.isAvailable = async function (key) {
		let data = await app.model.TeacherCDKey.findOne({ where: { key }});

		if (!data) return false;

		data = data.get({ plain: true });

		const disable = TEACHER_KEY_STATE_USING | TEACHER_KEY_STATE_DISABLE;

		if (data.state & disable) return false;

		return true;
	};

	model.useKey = async function (key, userId) {
		const isAvail = await this.isAvailable(key);
		if (!isAvail) return isAvail;

		await app.model.TeacherCDKey.update({
			state: TEACHER_KEY_STATE_USING,
			userId,
		}, {
			where: { key },
		});

		return true;
	};

	model.associate = () => {
		app.model.TeacherCDKey.belongsTo(app.model.Teacher, {
			as: "teachers",
			foreignKey: "userId",
			targetKey: "userId",
			constraints: false,
		});
	};

	return model;
};
