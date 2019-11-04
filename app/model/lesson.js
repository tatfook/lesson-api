"use strict";

module.exports = app => {
	const {
		BIGINT,
		STRING,
		JSON,
		TEXT,
	} = app.Sequelize;

	const model = app.model.define("lessons", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		lessonName: {
			type: STRING,
			allowNull: false,
		},

		subjectId: {
			type: BIGINT,
		},

		url: {
			type: STRING,
			unique: true,
			// allowNull: false,
		},

		coursewareUrl: { // 课程URL 允许为空
			type: STRING,
		},

		goals: {
			type: TEXT,
		},

		extra: {
			type: JSON,
			defaultValue: {
				coverUrl: "",
				vedioUrl: "",
			},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	model.getById = async function (id, userId) {
		const where = { id };

		if (userId) where.userId = userId;

		const data = await app.model.Lesson.findOne({ where });

		return data && data.get({ plain: true });
	};

	model.addSkill = async function (userId, lessonId, skillId, score) {
		const [lesson, skill] = await Promise.all([
			app.model.Lesson.findOne({ where: { userId, id: lessonId }}),
			app.model.Skill.findOne({ where: { id: skillId }})
		]);

		if (!lesson || !skill) return false;

		const data = await app.model.LessonSkill.create({
			userId,
			lessonId,
			skillId,
			score,
		});

		return !data ? false : true;
	};

	model.getSkills = async function (lessonId) {
		let list = await app.model.LessonSkill.findAll({
			include: [{
				as: "skills",
				model: app.model.Skill,
				attributes: ["skillName"]
			}],
			where: { lessonId }
		});

		return list.map(r => {
			r = r.get();
			r.skillName = r.skills.skillName;
			delete r.skills;
			return r;
		});
	};

	model.getPackagesByLessonId = async function (lessonId) {
		let sql = `select packages.* 
			from packageLessons, packages 
			where packageLessons.packageId = packages.id and
			packageLessons.lessonId = :lessonId`;

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: {
				lessonId,
			}
		});

		return list;
	};

	model.associate = () => {
		app.model.Lesson.hasMany(app.model.PackageLesson, {
			as: "packageLessons",
			foreignKey: "lessonId",
			sourceKey: "id",
			constraints: false,
		});
	};


	return model;
};
