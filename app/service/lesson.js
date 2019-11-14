'use strict';

const Service = require('../common/service.js');
const Err = require('../common/err');

class LessonService extends Service {
    /**
     * 通过条件获取Lesson
     * @param {*} condition  必选,对象
     */
    async getByCondition(condition) {
        let data = await this.ctx.model.Lesson.findOne({ where: condition });
        if (data) data = data.get({ plain: true });

        return data;
    }

    /**
     * 按条件分页查找lesson,排序,查找关联的package信息
     * @param {*} condition 查询条件
     * @param {*} order 排序参数
     */
    async getLessonByPageAndSort(condition, order) {
        const ret = await this.ctx.model.Lesson.findAndCountAll({
            include: [
                {
                    as: 'packageLessons',
                    model: this.ctx.model.PackageLesson,
                    attributes: [ 'packageId' ],
                    required: false,
                    include: [
                        {
                            as: 'packages',
                            model: this.ctx.model.Package,
                            required: false,
                        },
                    ],
                },
            ],
            where: condition,
            order,
        });

        ret.rows.map(r => {
            const tmp = r.get();
            tmp.packages = [];

            tmp.packageLessons.forEach(o => {
                tmp.packages.push(o.packages);
            });

            delete tmp.packageLessons;
            return tmp;
        });
        return ret;
    }

    /**
     * 根据lessonId获取packages
     * @param {*} lessonId 必选
     */
    async getPackagesByLessonId(lessonId) {
        return await this.ctx.model.Lesson.getPackagesByLessonId(lessonId);
    }

    /**
     * 创建lesson
     * @param {*} params params
     */
    async createLesson(params) {
        let lesson = await this.ctx.model.Lesson.create(params);
        if (!lesson) this.ctx.throw(500, Err.DB_ERR);
        lesson = lesson.get();

        return lesson;
    }

    /**
     * 更新lesson
     * @param {*} params params
     * @param {*} lessonId lessonId
     */
    async updateLesson(params, lessonId) {
        const result = await this.ctx.model.Lesson.update(params, {
            where: { id: lessonId },
        });
        return result;
    }

    /**
     * 删除lesson
     * @param {*} lessonId lessonId
     * @param {*} userId userId
     */
    async destroyLesson(lessonId, userId) {
        await this.ctx.model.Lesson.destroy({
            where: { id: lessonId, userId },
        });
    }
}

module.exports = LessonService;
