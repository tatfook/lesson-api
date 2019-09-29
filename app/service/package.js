"use strict";

const Service = require("../common/service.js");
const Err = require("../common/err");
const {
	PACKAGE_STATE_UNAUDIT,
	PACKAGE_STATE_AUDITING,
	PACKAGE_STATE_AUDIT_SUCCESS,
	PACKAGE_SUBSCRIBE_STATE_BUY
} = require('../common/consts');
const _ = require('lodash');

class PackageService extends Service {
	/**
	 * 通过条件获取package
	 * @param {*} condition  必选,对象
	 */
	async getByCondition(condition) {
		let data = await this.ctx.model.Package.findOne({ where: condition });
		if (data) data = data.get({ plain: true });

		return data;
	}

	/**
	 * 根据条件获取全部记录
	 * @param {*} condition 
	 */
	async getAllByCondition(condition) {
		let list = await this.ctx.model.Package.findAll({ where: condition });
		return list ? list.map(r => r.get()) : [];
	}

	/**
	 * 根据条件分页获取记录
	 * @param {*} condition 
	 */
	async getAllAndCountByCondition(condition) {
		let list = await this.ctx.model.Package.findAndCountAll({ where: condition });
		if (list && list.rows) list.rows.map(r => r.get());
		return list;
	}

	/**
	 * 搜索课程包，待优化
	 * @param {*} queryOptions 
	 * @param {*} condition 
	 */
	async searchPackages(queryOptions, condition) {
		const data = await this.ctx.model.Package.findAndCountAll({ ...queryOptions, where: condition });

		const list = data.rows;
		for (let i = 0; i < list.length; i++) {
			let pack = list[i].get ? list[i].get({ plain: true }) : list[i];
			pack.lessons = await this.ctx.model.Package.lessons(pack.id);
			list[i] = pack;
		}
		return data;
	}

	/**
	 *获取package关联的lesson
	 * @param {*} packageId 
	 */
	async getLessonsOfPackage(packageId) {
		return await this.ctx.model.Package.lessons(packageId);
	}

	/**
	 * 获取课程详情 ，待优化
	 * @param {*} packageId 
	 * @param {*} userId 
	 */
	async getPackageDetail(packageId, userId) {
		let data = await this.getByCondition({ id: packageId });
		if (!data) this.ctx.throw(400, Err.ARGS_ERR);

		data.lessons = await this.getLessonsOfPackage(packageId);
		data.learnedLessons = [];
		data.teachedLessons = [];
		if (!userId) return data;

		for (let i = 0; i < data.lessons.length; i++) {
			let lesson = data.lessons[i];

			const [isLearned, isTeached] = await Promise.all([
				this.ctx.service.learnRecord.packageIsLearned(userId, packageId, lesson.id),
				this.ctx.service.classroom.isTeached(userId, packageId, lesson.id)
			]);
			if (isLearned) data.learnedLessons.push(lesson.id);
			if (isTeached) data.teachedLessons.push(lesson.id);
		}

		const subscribe = await this.ctx.service.subscribe.getByCondition({ userId, packageId });
		data.isSubscribe = subscribe ? true : false;
		data.isBuy = (subscribe && subscribe.state == PACKAGE_SUBSCRIBE_STATE_BUY) ? true : false;

		return data;
	}

	/**
	 * 创建课程包
	 * @param {*} params 
	 */
	async createPackage(params) {
		let pack = await this.ctx.model.Package.create(params);
		if (!pack) this.ctx.throw(500, Err.DB_ERR);
		pack = pack.get({ plain: true });

		const id = pack.id;
		const records = [];

		const lessons = params.lessons;
		const userId = params.userId;
		if (!lessons || !_.isArray(lessons)) return pack;

		for (let i = 0; i < lessons.length; i++) {
			let lessonId = lessons[i];
			records.push({ userId, packageId: id, lessonId, extra: { lessonNo: i + 1 } });
		}
		if (records.length > 0) {
			await this.ctx.service.packageLesson.bulkCreate(records);
		}

		await this.ctx.service.subscribe.upsertSubscribe({ userId, packageId: pack.id });
		return pack;
	}

	/**
	 * 更新课程包
	 * @param {*} params 
	 */
	async updatePackage(params) {
		const result = await this.ctx.model.Package.update(params, { where: { id: params.id } });
		const lessons = params.lessons;
		if (!lessons || !_.isArray(lessons)) return result;

		const records = [];
		for (let i = 0; i < lessons.length; i++) {
			let lessonId = lessons[i];
			records.push({
				userId: params.userId,
				packageId: params.id,
				lessonId,
				extra: { lessonNo: i + 1 }
			});
		}

		if (records.length) {
			await this.ctx.service.packageLesson.destroyByCondition({ packageId: id });
			await this.ctx.service.packageLesson.bulkCreate(records);
		}
		return result;
	}

	/**
	 * 删除课程包
	 * @param {*} userId 
	 * @param {*} packageId 
	 */
	async destroyPackage(userId, packageId) {
		const retArr = await Promise.all([
			this.ctx.model.Package.destroy({ where: { id: packageId, userId } }),
			this.ctx.service.packageLesson.destroyByCondition({ userId, packageId }),
			this.ctx.service.lessonOrganizationPackage.destroyByCondition({ packageId })
		]);
		return retArr[0];
	}

	/**
	 * 申请审核
	 * @param {*} packageId 
	 */
	async applyAudit(packageId) {
		const data = await this.getByCondition({ id: packageId });
		if (!data) this.ctx.throw(400, Err.NOT_FOUND);

		data.state = PACKAGE_STATE_AUDITING;

		const result = await this.ctx.model.Package.update(data, { where: { id: packageId } });
		return result;
	}

	/**
	 * 审核
	 * @param {*} params 
	 * @param {*} userId 
	 */
	async audit(params, userId, packageId) {
		this.ctx.validate({
			state: [PACKAGE_STATE_UNAUDIT, PACKAGE_STATE_AUDITING],
		}, params);

		const data = this.getByCondition({ id: packageId, userId });
		if (!data) this.ctx.throw(400, Err.NOT_FOUND);

		const result = await this.ctx.model.Package.update({ state: params.state }, { where: { id: packageId } });
		return result;
	}

	/**
	 * 课程包订阅
	 * @param {*} packageId 
	 * @param {*} userId 
	 */
	async subscribe(packageId, userId) {
		const _package = await this.getByCondition({ id: packageId });
		if (!_package) return this.ctx.throw(400, Err.PACKAGE_NOT_EXISTS);
		if (_package.userId == userId) return this.ctx.throw(400, Err.CANT_BUY_SELF_PACKAGE);

		const isTeacher = await this.model.Teacher.isAllowTeach(userId);
		const isFree = (_package.rmb || _package.coin) ? false : true;
		if (!isTeacher && !isFree) this.ctx.throw(400, Err.CANT_BUY);

		await this.ctx.service.subscribe.upsertSubscribe({ userId, packageId });
	}


	async subscribePackage(userId, packageId, amount = { rmb: 0, coin: 0, bean: 0 }) {
		const data = await this.ctx.service.subscribes.getByCondition({ userId, packageId, state: PACKAGE_SUBSCRIBE_STATE_BUY });
		if (data) this.ctx.throw(400, Err.ALREADY_SUBSCRIBE);

		const _package = await this.getByCondition({ id: packageId });
		if (!_package) return this.ctx.throw(400, Err.PACKAGE_NOT_EXISTS);
		if (_package.userId === userId) return this.ctx.throw(400, Err.CANT_BUY_SELF_PACKAGE);

		const rmb = amount.rmb || 0;
		const coin = amount.coin || 0;
		if (rmb !== _package.rmb && coin !== _package.coin) return this.ctx.throw(400, Err.AMOUNT_ERR);
		const lockCoin = _package.rmb;

		// 购买成功  增加待解锁知识币 
		await Promise.all([
			this.app.keepworkModel.accounts.increment({ lockCoin }, { where: { userId } }),
			await this.ctx.service.subscribe.upsertSubscribe({ userId, packageId, state: PACKAGE_SUBSCRIBE_STATE_BUY })
		])
	}

	/**
	 * 按照热度获取package 待优化
	 */
	async getPackageByHot() {
		const list = await this.ctx.model.PackageSort.getHots();
		for (let i = 0; i < list.length; i++) {
			let pack = list[i].get ? list[i].get({ plain: true }) : list[i];
			pack.lessons = await this.ctx.model.Package.lessons(pack.id);
			list[i] = pack;
		}

		return list;
	}


	async teach(userId) {
		let packages = [];
		const subscribes = await this.ctx.model.Subscribe.getPackagesByUserId(userId);

		packages = _.uniqBy(packages.concat(subscribes), "id");

		const packageIds = [];
		for (let i = 0; i < packages.length; i++) {
			let pack = packages[i];
			pack = pack.get ? pack.get({ plain: true }) : pack;
			pack.joinAt = pack.joinAt || pack.createdAt;
			let obj = await this.ctx.model.Classroom.getLastTeach(userId, pack.id);
			pack.lastTeachDate = obj ? obj.createdAt : "";
			packageIds.push(pack.id);
			packages[i] = pack;
		}

		const lessonCount = await this.ctx.service.packageLesson.getLessonCountByPackageIds(packageIds);
		_.each(packages, (o, i) => o.lessonCount = lessonCount[o.id]);

		packages = _.orderBy(packages, ["lastTeachDate", "createdAt"], ["desc", "desc"]);
		return packages;
	}

	/**
	 * 
	 * @param {*} userId 
	 * @param {*} packageId 
	 * @param {*} lessonId 
	 * @param {*} lessonNo 
	 */
	async addLesson(userId, packageId, lessonId, lessonNo) {
		const [pkg, lesson] = await Promise.all([
			this.ctx.model.Package.findOne({ where: { userId, id: packageId } }),
			this.ctx.model.Lesson.findOne({ where: { id: lessonId } })
		]);
		if (!pkg || !lesson) return false;

		if (!lessonNo) {
			lessonNo = await this.ctx.model.PackageLesson.count({ where: { packageId, lessonId } });
			lessonNo += 1;
		}

		const data = await this.ctx.model.PackageLesson.create({
			userId,
			packageId,
			lessonId,
			extra: {
				lessonNo,
			}
		});

		if (data) return true;

		return false;
	}

	/**
	 * 
	 * @param {*} userId 
	 * @param {*} packageId 
	 * @param {*} lessonId 
	 * @param {*} lessonNo 
	 */
	async updatePackageLesson(userId, packageId, lessonId, lessonNo) {
		return await this.ctx.service.packageLesson.updateByCondition({ extra: { lessonNo } }, { userId, packageId, lessonId });
	}

	/**
	 * 
	 * @param {*} userId 
	 * @param {*} packageId 
	 * @param {*} lessonId 
	 */
	async deleteLesson(userId, packageId, lessonId) {
		return await this.ctx.service.packageLesson.destroyByCondition({ userId, packageId, lessonId })
	}


}

module.exports = PackageService;