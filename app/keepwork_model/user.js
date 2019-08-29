
const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		TEXT,
		BOOLEAN,
		JSON,
	} = app.Sequelize;

	const attrs = {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		username: {
			type: STRING(48),
			unique: true,
			allowNull: false,
		},

		password: {
			type: STRING(48),
			allowNull: false,
		},

		roleId: {
			type: INTEGER,
			defaultValue: 0,
		},

		email: { // 邮箱
			type: STRING(64),
			unique: true,
		},

		cellphone: { // 绑定手机号
			type: STRING(24),
			unique: true,
		},

		realname: { // 实名手机号
			type: STRING(24),
		},

		nickname: { // 昵称
			type: STRING(48),
		},

		portrait: {
			type: STRING(1024),
		},

		sex: {
			type: STRING(4),
		},

		description: {
			type: STRING(512),
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

	app.keepworkModel.illegalUsers = app.keepworkModel.define("illegalUsers", attrs, opts);

	const model = app.keepworkModel.define("users", attrs, opts);

	// model.sync({force:true});

	model.get = async function (id) {
		if (_.toNumber(id)) {
			return await this.getById(_.toNumber(id));
		}

		return await this.getByName(id);
	};

	model.getByName = async function (username) {
		const data = await app.keepworkModel.Users.findOne({
			where: { username },
			attributes: {
				exclude: ["password"],
			},
		});

		return data && data.get({ plain: true });
	};

	model.getBaseInfoById = async function (userId) {
		const attributes = [["id", "userId"], "username", "nickname", "portrait", "description"];

		const data = await app.keepworkModel.Users.findOne({ where: { id: userId }, attributes });
		if (!data) return {};

		const user = data.get({ plain: true });
		user.id = user.userId;

		return user;
	};

	model.getById = async function (userId) {
		const data = await app.keepworkModel.Users.findOne({
			where: { id: userId },
			attributes: {
				exclude: ["password"],
			},
		});

		return data && data.get({ plain: true });
	};

	model.getUsers = async function (userIds = []) {
		const attributes = [["id", "userId"], "username", "nickname", "portrait", "description"];
		const list = await app.keepworkModel.Users.findAll({
			attributes,
			where: {
				id: {
					[app.Sequelize.Op.in]: userIds,
				}
			}
		});

		const users = {};
		_.each(list, o => {
			o = o.get ? o.get({ plain: true }) : o;
			users[o.userId] = o;
		});

		return users;
	};

	app.keepworkModel.Users = model;
	return model;
};


