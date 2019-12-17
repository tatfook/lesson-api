const md5 = require('blueimp-md5');
const { app, mock, assert } = require('egg-mock/bootstrap');

describe('机构激活码', () => {
    let token;
    let orgId;
    let classId;
    beforeEach(async () => {
        const user = await app.login({ organizationId: 1, roleId: 67 });
        token = user.token;

        // 创建机构
        const organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
            endDate: new Date('2200-01-01'),
        }).then(o => o.toJSON());
        assert(organ.id);
        orgId = organ.id;
        // 创建班级
        let cls = await app.model.LessonOrganizationClass.create({
            name: 'clss000',
            organizationId: organ.id,
            status: 1,
        }).then(o => o.toJSON());
        assert(cls.id);
        classId = cls.id;

        // 添加为管理员
        let mem = await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: user.id,
            roleId: 64,
            classId: 0,
        });
        assert(mem.id);
    });

    describe('创建激活码', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .post('/lessonOrganizationActivateCodes')
                .send({
                    count: 20,
                    classIds: [classId],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));
            assert(ret.length === 20 && ret[0].classIds.length === 1);
        });
        it('002', async () => {
            const ret = await app
                .httpRequest()
                .post('/lessonOrganizationActivateCodes')
                .send({
                    count: 20,
                    classIds: [],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));
            assert(ret.length === 20 && ret[0].classIds.length === 0);
        });
    });

    describe('获取激活码', async () => {
        beforeEach(async () => {
            await app.factory.create('LessonOrganizationActivateCode', {
                organizationId: orgId,
            });
        });
        it('001', async () => {
            let Activecode = await app
                .httpRequest()
                .get('/lessonOrganizationActivateCodes?organizationId=' + orgId)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body)
                .catch(e => console.log(e));

            assert(
                Activecode.data.count === 1 && Activecode.data.rows.length === 1
            );
        });
        it('002 没有权限', async () => {
            const user = await app.login({ organizationId: 1, roleId: 1 });
            const token = user.token;
            await app
                .httpRequest()
                .get('/lessonOrganizationActivateCodes?organizationId=' + orgId)
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });
    });

    describe('学生使用激活码', async () => {
        let key;
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: orgId,
                status: 1,
            });
            const code = await app.factory.create(
                'LessonOrganizationActivateCode',
                {
                    organizationId: orgId,
                    state: 0,
                    classIds: [cls.id],
                    type: 5,
                }
            );
            key = code.key;

            app.mockService('keepwork', 'updateUser', () => 0);
        });
        it('001', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationActivateCodes/activate')
                .send({
                    key,
                    realname: 'abc',
                    organizationId: orgId,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body)
                .catch(e => console.log(e));
        });
    });

    // describe('激活码使用情况', async () => {
    //     beforeEach(async () => {

    //     });
    //     it('001', async () => {

    //     });
    // });
});
