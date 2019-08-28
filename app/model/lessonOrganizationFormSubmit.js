
/* 机构表单 */

const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationFormSubmits", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: { // 用户 ID
			type: BIGINT,
			defaultValue: 0,
		},

		organizationId: { // 机构 ID
			type: BIGINT,
			defaultValue: 0,
		},

		formId: { // 表单 ID
			type: BIGINT,
			defaultValue: 0,
		},

		state: { // 关联状态 0 - 未处理  1 - 通过  2 - 已停止
			type: INTEGER,
			defaultValue: 0,
		},

		quizzes: { // 包含结果的 quizzes
			type: JSON,
		},

		comment: { // 备注
			type: STRING(1024),
			defaultValue: "",
		},

		extra: { // 附加数据
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	app.model.lessonOrganizationFormSubmits = model;

	return model;
};


