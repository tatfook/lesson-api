const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/service/userMessage.test.js', () => {
    let userId;
    let organizationId;
    let orgName;
    let msgId;
    beforeEach(async () => {
        // 前置操作
        const userMsg = await app.factory.create('UserMessage');
        userId = userMsg.userId;

        const msg = await app.model.Message.findOne({
            where: { id: userMsg.msgId },
        });
        organizationId = msg.organizationId;
        msgId = msg.id;

        const org = await app.model.LessonOrganization.findOne({
            where: { id: organizationId },
        });
        orgName = org.name;
    });

    describe('getMyMessages', () => {
        beforeEach('do mock', () => {
            const ctx = app.mockContext();

            mock(ctx.model.Message, 'mergeMessage', () => 0);
            app.mockService('keepwork', 'getAllUserByCondition', () => []);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.userMessage.getMyMessages(
                {
                    offset: 0,
                    limit: 10,
                },
                userId,
                organizationId
            );
            assert(ret.count === 1);
            assert(ret.rows[0].userId === userId);
            assert(ret.rows[0].messages.lessonOrganizations.name === orgName);
        });

        it('002', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.userMessage.getMyMessages(
                {
                    offset: 0,
                    limit: 10,
                },
                1,
                1
            );
            assert(ret.count === 0);
        });
    });

    describe('getUnReadCount', () => {
        it('001', async () => {
            const ctx = app.mockContext();

            // 前置操作
            await app.model.LessonOrganizationClassMember.create({
                organizationId,
                memberId: userId,
            });

            const ret = await ctx.service.userMessage.getUnReadCount(userId);
            assert(ret.length === 2);
            assert(ret[0].organizationName === orgName);
            assert(ret[1].organizationName === '系统');
        });
    });

    describe('getIndexOfMessage', () => {
        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.userMessage.getIndexOfMessage(
                msgId,
                organizationId
            );
            assert(ret === 0);
        });
    });
});
