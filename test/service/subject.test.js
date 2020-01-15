const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/service/subject.test.js', async () => {
    describe('findAllByCondition', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '偷' });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.subject.findAllByCondition({
                subjectName: '偷',
            });
            assert(ret.length === 1);
        });
    });

    describe('getByCondition', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '偷' });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.subject.getByCondition({
                subjectName: '偷',
            });
            assert(ret);
        });
    });

    describe('createSubject', async () => {
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.subject.createSubject({
                subjectName: '偷',
            });
            assert(ret);
        });
    });

    describe('updateByCondition', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '偷' });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.subject.updateByCondition(
                { subjectName: '摸' },
                { id: 1 }
            );
            const ret = await app.model.Subject.findOne({ subjectName: '摸' });
            assert(ret);
        });
    });

    describe('destoryByCondition', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '偷' });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.subject.destoryByCondition({ subjectName: '偷' });
            const ret = await app.model.Subject.findOne({ subjectName: '偷' });
            assert(!ret);
        });
    });
});
