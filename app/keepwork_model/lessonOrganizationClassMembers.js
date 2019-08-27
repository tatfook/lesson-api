
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		JSON,
	} = app.Sequelize;

	const model = app.keepworkModel.define("lessonOrganizationClassMembers", {
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
	
	app.keepworkModel.lessonOrganizationClassMembers = model;

	return model;
};

