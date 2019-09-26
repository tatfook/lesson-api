"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("subjects", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		subjectName: {
			type: STRING(64),
			unique: true,
			allowNull: false,
		},

		enSubjectName: {
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

	model.getSkills = async function (subjectId) {
		return await app.model.Skill.findAll({ where: { subjectId }});
	};

	model.getOne = async function (subjectId) {
		let subject = await app.model.Subject.findOne({ where: { id: subjectId }});
		if (!subject) return;

		subject = subject.get({ plain: true });

		subject.skills = await this.getSkills(subjectId);

		return subject;
	};

	model.gets = async function () {
		const list = await app.model.Subject.findAll();

		const subjects = [];
		for (let i = 0; i < list.length; i++) {
			const subject = list[i].get({ plain: true });
			subjects.push(subject);
			subject.skills = await this.getSkills(subject.id);
		}

		return subjects;
	};

	return model;
};
