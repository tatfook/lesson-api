"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("skills", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		skillName: {
			type: STRING(64),
			unique: true,
			allowNull: false,
		},

		enSkillName: {
			type: STRING(64),
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

	model.associate = () => {
		app.model.Skill.hasMany(app.model.LessonSkill, {
			as: "lessonSkills",
			foreignKey: "skillId",
			sourceKey: "id",
			constraints: false,
		});
	};

	return model;
};
