'use strict';

const Service = require('../common/service.js');
const { CLASS_MEMBER_ROLE_ADMIN } = require('../common/consts.js');
const _ = require('lodash');

class LessonOrgPackageService extends Service {
    /**
     * 根据条件删除机构课程包
     * @param {*} condition condition
     */
    async destroyByCondition(condition) {
        return await this.ctx.model.LessonOrganizationPackage.destroy({
            where: condition,
        });
    }

    async findAllByCondition(condition) {
        const ret = await this.ctx.model.LessonOrganizationPackage.findAll({
            where: condition,
        });
        return ret ? ret.map(r => r.get()) : [];
    }

    /**
     *
     * @param {*} include include
     * @param {*} condition condition
     */
    async findAllAndExtraByCondition(include, condition) {
        const ret = await this.ctx.model.LessonOrganizationPackage.findAll({
            include,
            where: condition,
        });
        return ret ? ret.map(r => r.get()) : [];
    }

    /**
     * 查询课程包入口
     * @param {*} organizationId organizationId
     * @param {*} classId classId
     * @param {*} userId userId
     * @param {*} roleId roleId
     */
    async findAllEntrance(organizationId, classId, userId, roleId) {
        let list = [];

        if (classId) {
            list = await this.findAllByCondition({ organizationId, classId });
        } else {
            list = await this.findAllAndExtraByCondition(
                [
                    {
                        as: 'lessonOrganizationClassMembers',
                        model: this.ctx.model.LessonOrganizationClassMember,
                        where: {
                            memberId: userId,
                            classId:
                                roleId & CLASS_MEMBER_ROLE_ADMIN
                                    ? { $gte: 0 }
                                    : { $gt: 0 },
                        },
                    },
                    {
                        as: 'lessonOrganizationClasses',
                        model: this.ctx.model.LessonOrganizationClass,
                    },
                ],
                {
                    organizationId,
                }
            );
        }
        return list;
    }

    // 合并课程
    mergePackages(list = [], roleId) {
        const pkgmap = {};
        // 合并课程
        _.each(list, o => {
            if (
                roleId &&
                o.lessonOrganizationClassMembers &&
                !(o.lessonOrganizationClassMembers.roleId & roleId)
            ) {
                return;
            }

            if (pkgmap[o.packageId]) {
                pkgmap[o.packageId].lessons = (
                    pkgmap[o.packageId].lessons || []
                ).concat(o.lessons || []);
                pkgmap[o.packageId].lessons = _.uniqBy(
                    pkgmap[o.packageId].lessons,
                    'lessonId'
                );
                if (
                    pkgmap[o.packageId].lessonOrganizationClasses &&
                    o.lessonOrganizationClasses &&
                    pkgmap[o.packageId].lessonOrganizationClasses.end <
                        o.lessonOrganizationClasses.end
                ) {
                    pkgmap[o.packageId].lessonOrganizationClasses =
                        o.lessonOrganizationClasses;
                }
            } else {
                pkgmap[o.packageId] = o;
            }
        });

        list = [];
        _.each(pkgmap, o => list.push(o));

        return list;
    }

    /**
     * controller/lessonOrganization.js里面的packages方法用，暂且放这儿
     * @param {*} packageList packageList
     * @param {*} roleId roleId
     */
    async dealWithPackageList(packageList, roleId) {
        packageList = this.mergePackages(packageList, roleId);

        const pkgIds = _.map(packageList, o => o.packageId);
        const pkgs = await this.ctx.model.Package.findAll({
            where: { id: { [this.ctx.model.Op.in]: pkgIds } },
        }).then(list => _.map(list, o => o.toJSON()));

        _.each(packageList, o => {
            o.package = _.find(pkgs, p => ~~p.id === ~~o.packageId);
        });

        return packageList;
    }

    /**
     * 批量创建机构packages
     * @param {*} packageArr packageArr
     */
    async bulkCreate(packageArr) {
        return await this.ctx.model.LessonOrganizationPackage.bulkCreate(
            packageArr
        );
    }

    // 同步更新机构的课程包顺序
    async updateLessonNo(packageId, lessonNo) {
        const orgPackages = await this.ctx.model.LessonOrganizationPackage.findAll(
            { where: { packageId } }
        );

        const taskArr = [];
        for (let i = 0; i < orgPackages.length; i++) {
            const lessons = orgPackages[i].get().lessons;
            for (let j = 0; j < lessons.length; j++) {
                const index = _.findIndex(
                    lessonNo,
                    o => o.lessonId === lessons[j].lessonId
                );
                if (index > -1) {
                    lessons[j] = {
                        lessonId: lessonNo[index].lessonId,
                        lessonNo: lessonNo[index].lessonNo,
                    };
                }
            }
            taskArr.push(async function() {
                return await this.ctx.model.LessonOrganizationPackage.update(
                    {
                        lessons,
                    },
                    {
                        where: {
                            id: orgPackages[i].id,
                        },
                    }
                );
            });
        }

        await Promise.all(taskArr.map(r => r.call(this)));
    }
}

module.exports = LessonOrgPackageService;
