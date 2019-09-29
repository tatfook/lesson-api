"use strict";

const _ = require("lodash");
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("lessonSkills", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		lessonId: {
			type: BIGINT,
			allowNull: false,
		},

		skillId: {
			type: BIGINT,
		},

		score: {
			type: INTEGER,
			defaultValue: 0,
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",

		indexes: [
			{
				unique: true,
				fields: ["lessonId", "skillId"],
			},
		],
	});

	model.getSkillsByLessonId = async lessonId => {
		const sql = `
		select lessonSkills.*,skills.skillName skillName,skills.enSkillName enSkillName
		from lessonSkills, skills 
		where lessonSkills.skillId = skills.id and lessonSkills.lessonId = :lessonId
		`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: { lessonId },
		});

		return list.map(r => r.get ? r.get() : r);
	};

	model.associate = () => {
		app.model.LessonSkill.belongsTo(app.model.Skill, {
			as: "skills",
			foreignKey: "skillId",
			targetKey: "id",
			constraints: false,
		});
	};

	return model;
};
