
const consts = require("../core/consts.js");
// const { 
// 	TEACHER_PRIVILEGE_TEACH,
// } = consts;

module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("teachers", {
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

		key: { // 使用的激活码 
			type: STRING(64),
			allowNull: false,
		},

		privilege: { // 权限
			type: INTEGER,
			defaultValue: 0,
		},

		school: { // 学校信息
			type: STRING(128),
			defaultValue: "",
		},

		startTime: { // 有效期开始时间
			type: BIGINT,
			defaultValue: 0,
		},

		endTime: { // 有效期结束时间
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
	
	model.isAllowTeach = async function (userId) {
		let user = await app.model.Teachers.findOne({ where: { userId }});
		if (!user) return false;
		user = user.get({ plain: true });

		const curtime = new Date().getTime();

		if (curtime > user.endTime || curtime < user.startTime) return false;

		return true;
		// const privilege = user.privilege;

		// return privilege & TEACHER_PRIVILEGE_TEACH;
	};
	
	model.getByUserId = async function (userId) {
		return await app.model.teachers.findOne({ where: { userId }}).then(o => o && o.toJSON());
	};

	app.model.teachers = model;
	return model;
};
