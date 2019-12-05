const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');
const moment = require('moment');

describe('机构', () => {
    let organ;
    let cls;
    let token;
    beforeEach(async () => {
        // 创建机构
        organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
        }).then(o => o.toJSON());

        // 创建班级
        cls = await app.model.LessonOrganizationClass.create({
            name: 'clss000',
            organizationId: organ.id,
            begin: new Date(),
            end: new Date().getTime() + 1000 * 60 * 60 * 24,
        }).then(o => o.toJSON());

        // 创建班级成员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 1,
            classId: cls.id,
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 2,
            roleId: 2,
            classId: cls.id,
        });

        token = await app.login({ roleId: 64 }).then(o => o.token);
    });

    describe('修改机构', async () => {
        it('001', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({ endDate: '2019-01-01' })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));

            const org = await app.model.LessonOrganization.findOne({
                where: { id: organ.id },
            }).then(o => o.toJSON());

            assert(moment(org.endDate).format('YYYY-MM-DD') === '2019-01-01');
        });

        it('002', async () => {
            const token = await app.adminLogin().then(o => o.token);
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({ endDate: '2019-01-01' })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));

            const org = await app.model.LessonOrganization.findOne({
                where: { id: organ.id },
            }).then(o => o.toJSON());
        });
    });

    describe('');

    // it('001 机构', async () => {

    //     // 修改机构过期时间

    //     const token2 = await app.login().then(o => o.token);
    //     assert.ok(token2);

    //     // 我的机构
    //     let org = await app
    //         .httpRequest()
    //         .get('/lessonOrganizations')
    //         .set('Authorization', `Bearer ${token2}`)
    //         .expect(200)
    //         .then(res => res.body);
    //     assert(org.data.length === 1);

    //     const adminToken = await app.adminLogin().then(o => o.token);

    //     // 更改用户密码
    //     const ret = await app
    //         .httpRequest()
    //         .post('/organizations/changepwd')
    //         .send({
    //             memberId: user.id,
    //             password: '456789',
    //             classId: cls.id,
    //         })
    //         .set('Authorization', `Bearer ${adminToken}`)
    //         .expect(200);

    //     assert(ret);

    //     await app
    //         .httpRequest()
    //         .post('/lessonOrganizations/login')
    //         .send({
    //             organizationId: organ.id,
    //             username: 'qizhibiao1',
    //             password: '123456',
    //         })
    //         .expect(400)
    //         .then(res => res.body.token)
    //         .catch(e => console.log(e));

    //     await app
    //         .httpRequest()
    //         .post('/lessonOrganizations/login')
    //         .send({
    //             organizationId: organ.id,
    //             username: 'qizhibiao1',
    //             password: '456789',
    //         })
    //         .expect(200)
    //         .then(res => res.body.token)
    //         .catch(e => console.log(e));
    // });

    // it('002 机构 创建机构 更新机构', async () => {
    //     const adminToken = await app.adminLogin().then(o => o.token);
    //     assert.ok(adminToken);

    //     const ctx = app.mockContext();
    //     await ctx.service.keepwork.createRecord({
    //         resources: 'users',
    //         id: 490,
    //         username: 'dev123',
    //         password: md5('123456'),
    //         roleId: 64,
    //     });

    //     // 创建机构
    //     let organ = await app
    //         .httpRequest()
    //         .post('/lessonOrganizations')
    //         .send({
    //             name: 'organ002',
    //             count: 1,
    //             usernames: ['qizhibiao1'],
    //             packages: [
    //                 {
    //                     packageId: 1,
    //                     lessons: [{ lessonId: 1, lessonNo: 1 }],
    //                 },
    //             ],
    //         })
    //         .set('Authorization', `Bearer ${adminToken}`)
    //         .expect(200)
    //         .then(res => res.body);

    //     // 更新机构
    //     await app
    //         .httpRequest()
    //         .put(`/lessonOrganizations/${organ.data.id}`)
    //         .send({
    //             name: 'newname',
    //             logo: 'https://www.baidu.com',
    //             usernames: ['dev123'],
    //         })
    //         .set('Authorization', `Bearer ${adminToken}`)
    //         .expect(200)
    //         .then(res => res.body);

    //     // 机构获取
    //     organ = await app
    //         .httpRequest()
    //         .get(`/lessonOrganizations/${organ.data.id}`)
    //         .set('Authorization', `Bearer ${adminToken}`)
    //         .expect(200)
    //         .then(res => res.body);

    //     assert(
    //         organ.data.name === 'newname' &&
    //         organ.data.logo === 'https://www.baidu.com'
    //     );

    //     // 登录机构
    //     const token = await app
    //         .httpRequest()
    //         .post('/lessonOrganizations/login')
    //         .send({
    //             organizationId: organ.data.id,
    //             username: 'dev123',
    //             password: '123456',
    //         })
    //         .expect(200)
    //         .then(res => res.body)
    //         .catch(e => console.log(e));

    //     // 课程包列表
    //     organ = await app
    //         .httpRequest()
    //         .get(`/lessonOrganizations/packages`)
    //         .set('Authorization', `Bearer ${token.data.token}`)
    //         .expect(200)
    //         .then(res => res.body);

    //     assert(organ.data.length === 1 && organ.data[0].packageId === 1);

    //     // 课程详情
    //     let detail = await app
    //         .httpRequest()
    //         .get('/lessonOrganizations/packageDetail?packageId=1&classId=0')
    //         .set('Authorization', `Bearer ${token.data.token}`)
    //         .expect(200)
    //         .then(res => res.body);
    //     assert(detail.data.id && detail.data.packageId);
    // });
});
