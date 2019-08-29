
const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		JSON,
	} = app.Sequelize;

	const model = app.keepworkModel.define("userdatas", {
		userId: {
			type: BIGINT,
			primaryKey: true,
		},

		data: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	model.get = async function (userId) {
		const data = await app.keepworkModel.userdatas.findOne({ where: { userId }}).then(o => o && o.toJSON()) || {};

		return data.data || {};
	};

	model.set = async function (userId, data) {
		return await app.keepworkModel.userdatas.upsert({ userId, data });
	};

	// model.sync({force:true}).then(() => {
	// console.log("create table successfully");
	// });

	app.keepworkModel.userdatas = model;
	return model;
};
