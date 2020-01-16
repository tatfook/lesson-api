'use strict';

const Service = require('../common/service.js');
const Err = require('../common/err');
const _ = require('lodash');

const {
    PACKAGE_STATE_UNAUDIT,
    PACKAGE_STATE_AUDITING,
} = require('../common/consts');

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
     * @param {*} condition condition
     */
    async getAllByCondition(condition) {
        const list = await this.ctx.model.Package.findAll({ where: condition });
        return list ? list.map(r => r.get()) : [];
    }

    /**
     * 根据条件分页获取记录
     * @param {*} condition condition
     */
    async getAllAndCountByCondition(condition) {
        const list = await this.ctx.model.Package.findAndCountAll({
            where: condition,
        });
        if (list && list.rows) list.rows.map(r => r.get());
        return list;
    }

    /**
     * 搜索课程包，待优化
     * @param {*} queryOptions queryOptions
     * @param {*} condition condition
     */
    async searchPackages(queryOptions, condition) {
        const data = await this.ctx.model.Package.findAndCountAll({
            ...queryOptions,
            where: condition,
        });

        const list = data.rows;
        for (let i = 0; i < list.length; i++) {
            const pack = list[i].get ? list[i].get({ plain: true }) : list[i];
            pack.lessons = await this.ctx.model.Package.lessons(pack.id);
            list[i] = pack;
        }
        return data;
    }

    /**
     *获取package关联的lesson
     * @param {*} packageId packageId
     */
    async getLessonsOfPackage(packageId) {
        return await this.ctx.model.Package.lessons(packageId);
    }

    /**
     * 获取课程详情 ，待优化
     * @param {*} packageId packageId
     */
    async getPackageDetail(packageId) {
        const data = await this.getByCondition({ id: packageId });
        if (!data) this.ctx.throw(400, Err.ARGS_ERR);

        data.lessons = await this.getLessonsOfPackage(packageId);
        return data;
    }

    /**
     * 创建课程包
     * @param {*} params params
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
            const lessonId = lessons[i];
            records.push({
                userId,
                packageId: id,
                lessonId,
                lessonNo: i + 1,
            });
        }
        if (records.length > 0) {
            await this.ctx.service.packageLesson.bulkCreate(records);
        }
        return pack;
    }

    /**
     * 更新课程包
     * @param {*} params params
     */
    async updatePackage(params) {
        const result = await this.ctx.model.Package.update(params, {
            where: { id: params.id },
        });
        const lessons = params.lessons;
        if (!lessons || !_.isArray(lessons)) return result;

        const records = [];
        for (let i = 0; i < lessons.length; i++) {
            const lessonId = lessons[i];
            records.push({
                userId: params.userId,
                packageId: params.id,
                lessonId,
                lessonNo: i + 1,
            });
        }

        if (records.length) {
            await this.ctx.service.packageLesson.destroyByCondition({
                packageId: params.id,
            });
            await this.ctx.service.packageLesson.bulkCreate(records);
            await this.ctx.service.lessonOrganizationPackage.updateLessonNo(
                params.id,
                records
            );
        }
        return result;
    }

    /**
     * 删除课程包
     * @param {*} userId userId
     * @param {*} packageId packageId
     */
    async destroyPackage(userId, packageId) {
        const retArr = await Promise.all([
            this.ctx.model.Package.destroy({
                where: { id: packageId, userId },
            }),
            this.ctx.service.packageLesson.destroyByCondition({
                userId,
                packageId,
            }),
            this.ctx.service.lessonOrganizationPackage.destroyByCondition({
                packageId,
            }),
        ]);
        return retArr[0];
    }

    /**
     * 审核
     * @param {*} params params
     * @param {*} userId userId
     * @param {*} packageId packageId
     */
    async audit(params, userId, packageId) {
        this.ctx.validate(
            {
                state: [ PACKAGE_STATE_UNAUDIT, PACKAGE_STATE_AUDITING ],
            },
            params
        );

        const data = await this.getByCondition({ id: packageId, userId });
        if (!data) this.ctx.throw(400, Err.NOT_FOUND);

        const result = await this.ctx.model.Package.update(
            { state: params.state },
            { where: { id: packageId } }
        );
        return result;
    }

    /**
     * 按照热度获取package 待优化
     */
    async getPackageByHot() {
        const list = await this.ctx.model.PackageSort.getHots();
        for (let i = 0; i < list.length; i++) {
            const pack = list[i].get ? list[i].get({ plain: true }) : list[i];
            pack.lessons = await this.ctx.model.Package.lessons(pack.id);
            list[i] = pack;
        }

        return list;
    }

    /**
     *
     * @param {*} userId userId
     * @param {*} packageId packageId
     * @param {*} lessonId lessonId
     * @param {*} lessonNo lessonNo
     */
    async addLesson(userId, packageId, lessonId, lessonNo) {
        const [ pkg, lesson ] = await Promise.all([
            this.ctx.model.Package.findOne({
                where: { userId, id: packageId },
            }),
            this.ctx.model.Lesson.findOne({ where: { id: lessonId } }),
        ]);
        if (!pkg || !lesson) return false;

        if (!lessonNo) {
            lessonNo = await this.ctx.model.PackageLesson.count({
                where: { packageId, lessonId },
            });
            lessonNo += 1;
        }

        const data = await this.ctx.model.PackageLesson.create({
            userId,
            packageId,
            lessonId,
            lessonNo,
        });

        if (data) return true;

        return false;
    }

    /**
     *
     * @param {*} userId userId
     * @param {*} packageId packageId
     * @param {*} lessonId lessonId
     * @param {*} lessonNo lessonNo
     */
    async updatePackageLesson(userId, packageId, lessonId, lessonNo) {
        return await this.ctx.service.packageLesson.updateByCondition(
            { lessonNo },
            { userId, packageId, lessonId }
        );
    }

    /**
     *
     * @param {*} userId userId
     * @param {*} packageId packageId
     * @param {*} lessonId lessonId
     */
    async deleteLesson(userId, packageId, lessonId) {
        return await this.ctx.service.packageLesson.destroyByCondition({
            userId,
            packageId,
            lessonId,
        });
    }

    async getAllByConditionAndLessonCount(condition) {
        const ret = await this.ctx.model.Package.findAll({
            attributes: [
                'id',
                'packageName',
                'intro',
                'maxAge',
                'minAge',
                'coverUrl',
            ],
            where: condition,
            include: [
                {
                    as: 'packageLessons',
                    model: this.ctx.model.PackageLesson,
                    require: false,
                },
            ],
        });

        return ret.map(r => {
            r = r.get();
            r.lessonCount = r.packageLessons.length;
            delete r.packageLessons;
            return r;
        });
    }
}

module.exports = PackageService;
