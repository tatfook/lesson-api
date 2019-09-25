"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
		DATE,
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationClasses", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		name: {
			type: STRING,
		},

		begin: {
			type: DATE,
			defaultValue: function () {
				return new Date();
			},
		},

		end: {
			type: DATE,
			defaultValue: function () {
				return new Date();
			},
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
				unique: true,
				fields: ["organizationId", "name"],
			},
		],
	});

	// model.sync({force:true});

	model.findByUserIdRoleIdAndOrganizationIdSql = async function name(params) {
		const sql = `
		SELECT DISTINCT c.* FROM lessonOrganizationClasses c
		LEFT JOIN lessonOrganizationClassMembers m on m.classId = c.id
		where m.organizationId = :organizationId and m.roleId & :roleId
		and m.memberId= :memberId and c.end >=now() 
		`;
		console.log("-----------90---------", params);
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				organizationId: params.organizationId,
				roleId: params.roleId,
				memberId: params.userId
			}
		});

		return list;
	};

	model.associate = () => {
		app.model.LessonOrganizationClass.hasMany(app.model.LessonOrganizationActivateCode, {
			as: "lessonOrganizationActivateCodes",
			foreignKey: "classId",
			sourceKey: "id",
			constraints: false,
		});

		app.model.LessonOrganizationClass.hasMany(app.model.LessonOrganizationPackage, {
			as: "lessonOrganizationPackages",
			foreignKey: "classId",
			sourceKey: "id",
			constraints: false,
		});

		app.model.LessonOrganizationClass.hasMany(app.model.LessonOrganizationClassMember, {
			as: "lessonOrganizationClassMembers",
			foreignKey: "classId",
			sourceKey: "id",
			constraints: false,
		});
	};

	return model;
};

