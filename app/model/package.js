const _ = require("lodash");
const hooks = require("../common/sequelizeHooks");
const {
	PACKAGE_STATE_AUDIT_SUCCESS
} = require("../common/consts.js");


module.exports = app => {
	const {
		BIGINT,
		STRING,
		INTEGER,
		DATE,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("packages", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		packageName: {
			type: STRING,
			allowNull: false,
			unique: true,
		},

		subjectId: {
			type: BIGINT,
		},

		minAge: {
			type: INTEGER,
			defaultValue: 0,
		},

		maxAge: {
			type: INTEGER,
			defaultValue: 1000,
		},

		state: { //  0 - 初始状态  1 - 审核中  2 - 审核成功  3 - 审核失败  4 - 异常态(审核成功后被改坏可不用此状态 用0代替)
			type: INTEGER,
			defaultValue: 0,
		},

		intro: {
			type: STRING(512),
		},

		rmb: { // 人民币
			type: INTEGER,
			defaultValue: 0,
		},

		coin: {
			type: INTEGER,
			defaultValue: 0,
		},

		auditAt: {
			type: DATE,
		},

		lastClassroomCount: {
			type: INTEGER,
			defaultValue: 0,
		},

		extra: {
			type: JSON,
			defaultValue: {
				coverUrl: "",
			}
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

		const data = await app.model.Package.findOne({ where });

		return data && data.get({ plain: true });
	};

	model.audit = async function (packageId, userId, state) {
		if (~~state !== PACKAGE_STATE_AUDIT_SUCCESS || !userId) {
			app.keepworkModel.lessonOrganizationPackages.destroy({ where: { packageId }});
			return;
		};

		await app.model.Package.update({ auditAt: new Date() }, { where: { id: packageId }});
		await app.model.Subscribe.upsert({ userId, packageId });
	};

	model.addLesson = async function (userId, packageId, lessonId, lessonNo) {
		let data = await app.model.Package.findOne({ where: { userId, id: packageId }});
		if (!data) return false;

		data = await app.model.Lesson.findOne({ where: { id: lessonId }});

		if (!data) return false;
		if (!lessonNo) {
			lessonNo = await app.model.PackageLesson.count({ where: { packageId, lessonId }});
			lessonNo += 1;
		}

		data = await app.model.PackageLesson.create({
			userId,
			packageId,
			lessonId,
			extra: {
				lessonNo,
			},
		});

		if (data) return true;

		return false;
	};

	model.putLesson = async function (userId, packageId, lessonId, lessonNo) {
		return await app.model.PackageLesson.update({ extra: { lessonNo }}, {
			where: {
				userId,
				packageId,
				lessonId,
			}
		});
	};

	model.deleteLesson = async function (userId, packageId, lessonId) {
		// let data = await app.model.Packages.findOne({where: {userId, id: packageId}});
		// if (!data) return false;

		return await app.model.PackageLesson.destroy({
			where: {
				userId,
				packageId,
				lessonId,
			}
		});
	};

	model.lessons = async function (packageId) {
		const sql = `select l.*, pl.extra plExtra from packageLessons as pl, lessons as l 
		   where pl.lessonId = l.id and pl.packageId = :packageId`;

		const lessons = [];
		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: { packageId },
		});

		_.each(list, o => {
			o = o.get ? o.get({ plain: true }) : o;
			o.lessonNo = o.plExtra.lessonNo || 10000;
			delete o.plExtra;
			lessons.push(o);
		});

		return _.sortBy(lessons, ["lessonNo"]);
	};

	model.adminUpdateHook = async function (obj) {
		await this.audit(obj.id, obj.userId, obj.state);
	};

	model.associate = () => {
		app.model.Package.hasMany(app.model.PackageLesson, {
			as: "packageLessons",
			foreignKey: "packageId",
			sourceKey: "id",
			constraints: false,
		});
	};

	hooks(app);

	return model;
};
