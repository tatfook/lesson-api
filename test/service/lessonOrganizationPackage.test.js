const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');
const moment = require('moment');

describe('test/service/lessonOrganizationPackage.test.js', async () => {
    describe('destroyByCondition', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.createMany(
                'LessonOrganizationPackage',
                10
            );
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationPackage.destroyByCondition({
                id: pkgs[0].id,
            });
        });
    });

    describe('findAllByCondition', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.createMany(
                'LessonOrganizationPackage',
                10
            );
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const filterPkgs = _.filter(pkgs, o => o.classId > 2);
            const ret = await ctx.service.lessonOrganizationPackage.findAllByCondition(
                {
                    classId: { $gt: 2 },
                }
            );
            assert(ret.length === filterPkgs.length);
        });
    });

    describe('findAllAndExtraByCondition', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.createMany(
                'LessonOrganizationPackage',
                10
            );
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const filterPkgs = _.filter(pkgs, o => o.classId > 2);
            const ret = await ctx.service.lessonOrganizationPackage.findAllAndExtraByCondition(
                [
                    {
                        as: 'lessonOrganizationClasses',
                        model: ctx.model.LessonOrganizationClass,
                    },
                ],
                {
                    classId: { $gt: 2 },
                }
            );
            assert(ret.length === filterPkgs.length);
            assert(_.every(ret, o => o.lessonOrganizationClasses));
        });
    });

    describe('findAllEntrance', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.createMany(
                'LessonOrganizationPackage',
                10
            );
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const filterPkgs = _.filter(
                pkgs,
                o => o.classId === 1 && o.organizationId === 1
            );
            const ret = await ctx.service.lessonOrganizationPackage.findAllEntrance(
                1,
                1
            );
            assert(ret.length === filterPkgs.length);
        });
        it('002', async () => {
            const ctx = app.mockContext();
            const filterPkgs = _.filter(
                pkgs,
                o => o.classId === 1 && o.organizationId === 1
            );
            const ret = await ctx.service.lessonOrganizationPackage.findAllEntrance(
                1,
                null,
                1,
                64
            );
            assert(ret.length === 0);
        });
    });

    describe('dealWithPackageList', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.createMany(
                'LessonOrganizationPackage',
                10
            );
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationPackage.dealWithPackageList(
                [
                    {
                        packageId: 1,
                        lessons: [],
                        lessonOrganizationClasses: [],
                    },
                ],
                64
            );
        });
    });

    describe('updateLessonNo', async () => {
        let pkgs;
        beforeEach(async () => {
            pkgs = await app.factory.create('LessonOrganizationPackage', {
                organizationId: 1,
                lessons: [{ lessonId: 1, lessonNo: 8 }],
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationPackage.updateLessonNo(1, [
                { lessonId: 1, lessonNo: 9 },
            ]);
            const ret = await ctx.model.LessonOrganizationPackage.findOne({
                where: { id: pkgs.id },
            });
            assert(ret.lessons[0].lessonNo === 9);
        });
    });
});
