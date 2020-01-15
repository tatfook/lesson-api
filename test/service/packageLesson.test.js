const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/service/packageLesson.test.js', async () => {
    describe('getLessonCountByPackageIds', async () => {
        beforeEach(async () => {
            await app.factory.createMany('PackageLesson', 4, { packageId: 1 });
            await app.factory.createMany('PackageLesson', 2, { packageId: 2 });
            await app.factory.createMany('PackageLesson', 3, { packageId: 3 });
        });
        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.packageLesson.getLessonCountByPackageIds(
                [1, 2, 3]
            );
            assert(ret['1'] === 4);
            assert(ret['2'] === 2);
            assert(ret['3'] === 3);
        });
    });

    describe('getByCondition', async () => {
        beforeEach(async () => {
            await app.factory.create('PackageLesson', { packageId: 1 });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.packageLesson.getByCondition({
                packageId: 1,
            });
            assert(ret);
        });
    });

    describe('updateByCondition', async () => {
        beforeEach(async () => {
            await app.factory.create('PackageLesson', { packageId: 1 });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.packageLesson.updateByCondition(
                { packageId: 2 },
                { packageId: 1 }
            );
            const ret = await app.model.PackageLesson.findOne({
                where: { packageId: 2 },
            });
            assert(ret);
        });
    });

    describe('bulkCreate', async () => {
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.packageLesson.bulkCreate([
                { userId: 1, packageId: 2, lessonId: 1, lessonNo: 2 },
            ]);
            assert(ret.length === 1);
        });
    });

    describe('destroyByCondition', async () => {
        beforeEach(async () => {
            await app.factory.create('PackageLesson', { packageId: 1 });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.packageLesson.destroyByCondition({
                packageId: 1,
            });
            const ret = await app.model.PackageLesson.findAll({
                where: { packageId: 1 },
            });
            assert(!ret.length);
        });
    });
});
