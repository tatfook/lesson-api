'use strict';

const Service = require('../common/service.js');

class PackageLessonService extends Service {
    /**
     * 查找这些packageId分别有多少Lesson数量
     * @param {*} packageIds packageIds
     */
    async getLessonCountByPackageIds(packageIds = []) {
        if (packageIds.length === 0) return {};

        const list = await this.ctx.model.PackageLesson.getLessonCountByPackageIds(
            packageIds
        );

        const count = {};

        list.forEach(r => {
            count[r.packageId] = r.count;
        });

        return count;
    }

    /**
     * 通过条件获取packageLesson
     * @param {*} condition  必选,对象
     */
    async getByCondition(condition) {
        let data = await this.ctx.model.PackageLesson.findOne({
            where: condition,
        });
        if (data) data = data.get({ plain: true });

        return data;
    }

    /**
     * 根据条件更新
     * @param {*} params params
     * @param {*} condition condition
     */
    async updateByCondition(params, condition) {
        return await this.ctx.model.PackageLesson.update(params, {
            where: condition,
        });
    }

    /**
     *
     * @param {*} packageLessons packageLessons
     */
    async bulkCreate(packageLessons) {
        return await this.ctx.model.PackageLesson.bulkCreate(packageLessons);
    }

    async destroyByCondition(condition) {
        return await this.ctx.model.PackageLesson.destroy({ where: condition });
    }
}

module.exports = PackageLessonService;
