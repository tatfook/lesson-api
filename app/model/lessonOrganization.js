
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		TEXT,
		JSON,
		DATE,
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizations", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		name: { // 名称
			type: STRING,
			defaultValue: "",
			unique: true,
		},

		logo: {
			type: TEXT("long"),
		},

		email: {
			type: STRING,
		},

		cellphone: {
			type: STRING,
		},

		loginUrl: {
			type: STRING,
			unique: true,
		},

		userId: { // 组织拥有者
			type: BIGINT,
			defaultValue: 0
		},

		startDate: {
			type: DATE,
		},

		endDate: {
			type: DATE,
		},

		state: { // 0 - 开启  1 - 停用
			type: INTEGER,
		},

		count: { // 用户数量
			type: INTEGER,
			defaultValue: 0,
		},

		privilege: { // 权限  1 -- 允许教师添加学生  2 -- 允许教师移除学生
			type: INTEGER,
			defaultValue: 0,
		},

		location: { // xxx xxx xxx
			type: STRING,
			defaultValue: "",
		},

		visibility: { // 0 - 公开  1 - 不公开
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
	});

	// model.sync({force:true});

	model.getValidOrganizationById = async function (organizationId) {
		// const curdate = new Date();
		return await app.model.LessonOrganization.findOne({
			where: {
				id: organizationId,
				endDate: { $gte: new Date() },
			}
		}).then(o => o && o.toJSON());
	};

	// 获取机构已用人数
	model.getUsedCount = async function (organizationId) {
		const sql = `select count(*) as count from (
			select * from lessonOrganizationClassMembers as locm 
			where locm.organizationId = ${organizationId} 
			and roleId & 1 and (
				classId = 0 or exists (
					select * from lessonOrganizationClasses 
					where id = classId and end > current_timestamp()
					)
			) group by memberId) as t`;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0].count || 0;
	};

	model.getStudentCount = async function (organizationId) {
		return await this.getMemberCount(organizationId, 1);
	};

	model.getMemberCount = async function (organizationId, roleId, classId) {
		const sql = `select count(*) as count from (
			select * from lessonOrganizationClassMembers as locm 
			where locm.organizationId = ${organizationId} and roleId & ${roleId} 
			and classId ${classId === undefined ? ">= 0" : ("= " + classId)}  and (
				classId = 0 or exists (select * from lessonOrganizationClasses where id = classId and end > current_timestamp())
				) group by memberId) as t`;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list[0].count || 0;
	};

	model.getMembers = async function (organizationId, roleId, classId) {
		const sql = `select * from lessonOrganizationClassMembers as locm where locm.organizationId = ${organizationId} and 
		roleId & ${roleId} and classId ${classId == undefined ? ">= 0" : ("= " + classId)}  and (
			classId = 0 or exists (select * from lessonOrganizationClasses where id = classId and end > current_timestamp())
			) group by memberId`;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list;
	};

	model.getTeachers = async function (organizationId, classId) {
		const sql = `select * from lessonOrganizationClassMembers as locm where locm.organizationId = ${organizationId} and
		roleId & 2 and classId ${classId === undefined ? ">= 0" : ("= " + classId)}  and (
			classId = 0 or exists (select * from lessonOrganizationClasses where id = classId)
			) group by memberId`;
		const list = await app.model.query(sql, { type: app.model.QueryTypes.SELECT });
		return list;
	};

	model.associate = () => {
		app.model.LessonOrganization.belongsTo(app.model.User, {
			as: "users",
			foreignKey: "userId",
			targetKey: "id",
			constraints: false,
		});

		app.model.LessonOrganization.hasMany(app.model.LessonOrganizationPackage, {
			as: "lessonOrganizationPackages",
			foreignKey: "organizationId",
			sourceKey: "id",
			constraints: false,
		});

		app.model.LessonOrganization.hasMany(app.model.LessonOrganizationClassMember, {
			as: "lessonOrganizationClassMembers",
			foreignKey: "organizationId",
			sourceKey: "id",
			constraints: false,
		});
	};

	return model;
};

