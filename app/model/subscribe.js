"use strict";

const _ = require("lodash");

module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		JSON,
	} = app.Sequelize;

	const model = app.model.define("subscribes", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: {
			type: BIGINT,
			allowNull: false,
		},

		packageId: {
			type: BIGINT,
			allowNull: false,
		},

		state: { // 0 - 未购买 1 - 已购买
			type: INTEGER,
			defaultValue: 0
		},

		extra: { // 额外数据
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
				fields: ["userId", "packageId"],
			},
		],
	});

	model.getPackagesByUserId = async userId => {
		const sql = `select packages.*, subscribes.createdAt joinAt, subscribes.state subscribeState 
			from subscribes, packages 
			where subscribes.packageId = packages.id and
			subscribes.userId = :userId`;


		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: { userId },
		});

		return list;
	};

	model.getByUserId = async (userId, packageState) => {
		let sql = `select packages.*, subscribes.extra subscribeExtra, subscribes.createdAt joinAt, subscribes.state subscribeState 
			from subscribes, packages 
			where subscribes.packageId = packages.id and
			subscribes.userId = :userId`;

		if (_.isNumber(packageState)) {
			sql += " and packages.state = :packageState";
		}

		const list = await app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
			replacements: { userId, packageState },
		});
		const packages = [];

		for (let i = 0; i < list.length; i++) {
			let data = list[i].get ? list[i].get({ plain: true }) : list[i];
			data.lessons = await app.model.Package.lessons(data.id);
			data.learnedLessons = data.subscribeExtra.learnedLessons || [];
			data.teachedLessons = data.subscribeExtra.teachedLessons || [];

			packages.push(data);
		}

		return packages;
	};

	model.addTeachedLesson = async (userId, packageId, lessonId) => {
		let subscribe = await app.model.Subscribe.findOne({
			where: {
				userId,
				packageId,
			}
		});
		if (!subscribe) return;
		subscribe = subscribe.get({ plain: true });

		const extra = subscribe.extra || {};
		extra.teachedLessons = extra.teachedLessons || [];
		const index = _.findIndex(extra.teachedLessons, val => ~~val === ~~lessonId);
		if (index === -1) {
			extra.teachedLessons.push(lessonId);
			await app.model.Subscribe.update({
				extra,
			}, {
				where: {
					id: subscribe.id,
				}
			});
		}
	};

	model.addLearnedLesson = async (userId, packageId, lessonId) => {
		let subscribe = await app.model.Subscribe.findOne({
			where: {
				userId,
				packageId,
			}
		});
		if (!subscribe) return;
		subscribe = subscribe.get({ plain: true });

		const extra = subscribe.extra || {};
		extra.learnedLessons = extra.learnedLessons || [];
		const index = _.findIndex(extra.learnedLessons, val => ~~val === ~~lessonId);
		if (index === -1) {
			extra.learnedLessons.push(lessonId);
			await app.model.Subscribe.update({
				extra,
			}, {
				where: {
					id: subscribe.id,
				}
			});
		}
	};

	return model;
};
