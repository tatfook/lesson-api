
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

		const data = await app.model.Lessons.findOne({ where });

		return data && data.get({ plain: true });
	};

	model.addSkill = async function (userId, lessonId, skillId, score) {
		let data = await app.model.Lessons.findOne({
			where: {
				userId,
				id: lessonId,
			}
		});
		if (!data) return false;

		data = await app.model.Skills.findOne({ where: { id: skillId }});
		if (!data) return false;

		data = await app.model.LessonSkills.create({
			userId,
			lessonId,
			skillId,
			score,
		});
		if (!data) return false;

		return true;
	};

	model.getSkills = async function (lessonId) {
		const skills = [];
		const list = await app.model.LessonSkills.findAll({
			where: {
				lessonId,
			}
		});
		for (let i = 0; i < list.length; i++) {
			let lessonSkill = list[i].get({ plain: true });
			let skill = await app.model.Skills.findOne({
				where: { id: lessonSkill.skillId },
			});
			if (skill) {// 据说这个一定是真
				skill = skill.get({ plain: true });
				lessonSkill.skillName = skill.skillName;
			}
			skills.push(lessonSkill);
		}

		return skills;
	};

	model.deleteSkill = async function (userId, lessonId, skillId) {
		return await app.model.LessonSkills.destroy({
			where: {
				userId,
				lessonId,
				skillId,
			}
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

	app.model.lessons = model;

	return model;
};
