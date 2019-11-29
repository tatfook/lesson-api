const { app, assert } = require('egg-mock/bootstrap');

describe('test/model/userMessage.test.js', () => {
    let userId;
    let orgName;
    before(async () => {
        const userMsg = await app.factory.create('UserMessage');
        userId = userMsg.userId;

        const org = await app.model.LessonOrganization.findOne();
        orgName = org.name;

        const cls = await app.factory.create('LessonOrganizationClass', {
            organizationId: org.id,
        });
        await app.factory.create('LessonOrganizationClassMember', {
            memberId: userId,
            organizationId: org.id,
            classId: cls.id,
            roleId: 1,
        });
    });

    describe('getUnReadCount', async () => {
        it('001', async () => {
            const list = await app.model.UserMessage.getUnReadCount(userId);
            assert(list.length === 2);
            assert(list[0].organizationName === orgName);
            assert(list[1].organizationName === '系统');
        });

        it('002', async () => {
            const list = await app.model.UserMessage.getUnReadCount(userId);
            assert(list.length === 1);
            assert(list[0].organizationName === '系统');
        });
    });
});
