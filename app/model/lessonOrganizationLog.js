
module.exports = app => {
	const {
		BIGINT,
		STRING,
		TEXT,
		JSON,
		DATE
	} = app.Sequelize;

	const model = app.model.define("lessonOrganizationLogs", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		organizationId: {
			type: BIGINT,
			defaultValue: 0,
		},

		type: {
			type: STRING,
			defaultValue: "",
		},

		description: {
			type: TEXT,
		},

		handleId: {
			type: BIGINT,
			defaultValue: 0,
		},

		username: {
			type: STRING,
			defaultValue: "",
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

	app.model.LessonOrganizationLog = model;

	model.classroomLog = async function ({ classroom = {}, lr, action = "create", username, handleId, organizationId }) {
		const log = {
			organizationId: organizationId || classroom.organizationId,
			type: "课堂",
			handleId,
			username,
		};

		if (action === "create") {
			log.description = `创建课堂, 课堂ID: C${classroom.key}, 《${classroom.extra.packageName}》, ${classroom.extra.lessonNo}: ${classroom.extra.lessonName}`;
		} else if (action === "dismiss") {
			log.description = `下课, 课堂ID: C${classroom.key}, 《${classroom.extra.packageName}》, ${classroom.extra.lessonNo}: ${classroom.extra.lessonName}`;
		} else if (action === "join") {
			log.description = `进入课堂, 课堂ID: C${classroom.key}`;
		} else if (action === "quit") {
			log.description = `离开课堂, 课堂ID: C${classroom.key}`;
		} else if (action === "learn") {
			const packageId = lr.packageId;
			const lessonId = lr.lessonId;
			const pkg = await app.model.Package.findOne({ where: { id: packageId }});
			const lesson = await app.model.Lesson.findOne({ where: { id: lessonId }});
			const packageLesson = await app.model.PackageLesson.findOne({ where: { packageId: packageId, lessonId: lessonId }});
			const packageName = pkg.packageName;
			const lessonName = lesson.lessonName;
			const lessonNo = packageLesson.extra.lessonNo;

			log.description = `自学课程,《${packageName}》, ${lessonNo}: ${lessonName}`;
		} else {
			return;
		}
		await app.model.LessonOrganizationLog.create(log);
	};

	return model;
};

