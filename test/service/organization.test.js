const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/service/organization.test.js', async () => {
    beforeEach(async () => {
        await app.model.LessonOrganizationClassMember.create({
            realname: '',
            memberId: 1,
            classId: 1,
            organizationId: 1,
            roleId: 1,
        });
        await app.model.LessonOrganizationClassMember.create({
            realname: '',
            memberId: 1,
            classId: 2,
            organizationId: 1,
            roleId: 2,
        });
        await app.model.LessonOrganizationClassMember.create({
            realname: '',
            memberId: 1,
            classId: 3,
            organizationId: 1,
            roleId: 64,
        });
    });
    describe('getRoleId', async () => {
        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.organization.getRoleId(1, 1);
            assert(ret === 67);
        });
    });
});
