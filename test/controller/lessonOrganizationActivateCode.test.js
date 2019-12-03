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
            begin: new Date(),
            end: new Date().getTime() + 1000 * 60 * 60 * 24,
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
                    organizationId: orgId,
                    count: 20,
                    classId,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));
            assert(ret.length === 20);
        });

        it('002 无效机构 应该失败', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationActivateCodes')
                .send({
                    organizationId: 999,
                    count: 20,
                    classId,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
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
    });

    describe('激活用户', async () => {
        let key;
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: orgId,
                end: '2900-10-01',
            });
            const code = await app.factory.create(
                'LessonOrganizationActivateCode',
                {
                    organizationId: orgId,
                    state: 0,
                    classId: cls.id,
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

    // it('001 机构激活码', async () => {
    //     const user = await app.login({ organizationId: 1, roleId: 67 });
    //     const token = user.token;

    //     // 无效机构
    //     const user2 = await app.login({ organizationId: 999 });
    //     const token2 = user2.token;
    //     await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes')
    //         .send({
    //             organizationId: 999,
    //             count: 20,
    //             classId: cls.id,
    //         })
    //         .set('Authorization', `Bearer ${token2}`)
    //         .expect(403);

    //     //  测试获取激活码
    //     let Activecode = await app
    //         .httpRequest()
    //         .get('/lessonOrganizationActivateCodes?organizationId=' + organ.id)
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(200)
    //         .then(res => res.body)
    //         .catch(e => console.log(e));

    //     assert(
    //         Activecode.data.count === 20 && Activecode.data.rows.length === 20
    //     );

    //     // 获取机构的激活码
    //     Activecode = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/search')
    //         .send({
    //             state: 0,
    //             classId: cls.id,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(200)
    //         .then(res => res.body);
    //     assert(Activecode.data.count === 20);

    //     // 使用激活码
    //     app.mockService('keepwork', 'updateUser', () => 0);
    //     let member = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/activate')
    //         .send({
    //             key: Activecode.data.rows[0].key,
    //             realname: 'a',
    //             organizationId: organ.id,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(200)
    //         .then(res => res.body);
    //     assert(member);

    //     // 一个码只能用一次
    //     let ret = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/activate')
    //         .send({
    //             key: Activecode.data.rows[0].key,
    //             realname: '',
    //             organizationId: organ.id,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(400)
    //         .then(res => res.body);
    //     // assert(ret.code === 2);

    //     // // 应该少了一个
    //     Activecode = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/search')
    //         .send({
    //             state: 0,
    //             classId: cls.id,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(200)
    //         .then(res => res.body);
    //     assert(Activecode.data.count === 19);

    //     // 激活码不属于这个机构
    //     ret = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/activate')
    //         .send({
    //             key: Activecode.data.rows[0].key,
    //             realname: '',
    //             organizationId: 999,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(400)
    //         .then(res => res.body);
    //     // assert(ret.code === 7);

    //     // // 已经是该班级学生
    //     ret = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/activate')
    //         .send({
    //             key: Activecode.data.rows[0].key,
    //             realname: '',
    //             organizationId: organ.id,
    //         })
    //         .set('Authorization', `Bearer ${token}`)
    //         .expect(400)
    //         .then(res => res.body);
    //     // assert(ret.code === 6);

    //     // // 人数已达上限
    //     const user2token = await app.login({ id: 2 }).then(res => res.token);
    //     ret = await app
    //         .httpRequest()
    //         .post('/lessonOrganizationActivateCodes/activate')
    //         .send({
    //             key: Activecode.data.rows[0].key,
    //             realname: '',
    //             organizationId: organ.id,
    //         })
    //         .set('Authorization', `Bearer ${user2token}`)
    //         .expect(400)
    //         .then(res => res.body);
    //     // assert(ret.code === 5);
    // });
});
