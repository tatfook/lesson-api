// const lessonOrganizations = require("./lessonOrganization");
// const Users = require("./users");
// const lessonOrganizationPackages = require("./lessonOrganizationPackage");
// const lessonOrganizationClasses = require("./lessonOrganizationClass");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		JSON,
		DATE
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationClassMembers", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		classId: { // 0 -- 则为机构成员
			type: BIGINT,
			defaultValue: 0,
		},

		memberId: { // 成员id
			type: BIGINT,
			defaultValue: 0,
		},

		realname: { // 真实姓名
			type: STRING,
		},

		roleId: { // 角色  1 -- 学生  2 -- 教师  64 -- 管理员
			type: INTEGER,
			defaultValue: 0,
		},

		privilege: { // 权限
			type: INTEGER,
			defaultValue: 0,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},
		createdAt: {
			type: DATE,
		},

		updatedAt: {
			type: DATE,
		}

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",

		indexes: [
			{
				name: "organizationId-classId-memberId",
				unique: true,
				fields: ["organizationId", "classId", "memberId"],
			},
		],
	});

	// model.sync({force:true});


	// model.belongsTo(lessonOrganizations(app), {
	// 	as: "lessonOrganizations",
	// 	foreignKey: "organizationId",
	// 	targetKey: "id",
	// 	constraints: false,
	// });

	// model.belongsTo(lessonOrganizationClasses(app), {
	// 	as: "lessonOrganizationClasses",
	// 	foreignKey: "classId",
	// 	targetKey: "id",
	// 	constraints: false,
	// });

	// model.belongsTo(Users(app), {
	// 	as: "users",
	// 	foreignKey: "memberId",
	// 	targetKey: "id",
	// 	constraints: false,
	// });

	// model.hasMany(lessonOrganizationPackages(app), {
	// 	as: "lessonOrganizationPackages",
	// 	foreignKey: "classId",
	// 	sourceKey: "classId",
	// 	constraints: false,
	// });

	app.model.lessonOrganizationClassMembers = model;

	return model;
};

