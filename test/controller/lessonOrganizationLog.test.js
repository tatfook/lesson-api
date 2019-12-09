const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');

describe('机构', () => {
    let organ;
    let token;
    beforeEach(async () => {
        app.mockService('keepwork', 'getAllUserByCondition', () => {
            return [{ id: 1, username: 'u' }];
        });
        app.mockService('keepwork', 'getUserDatas', () => {
            return { tokens: ['XXX'] };
        });
        app.mockService('keepwork', 'setUserDatas', () => 0);
        app.mockService('keepwork', 'updateUser', () => 0);

        // 创建机构
        organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
            endDate: '2119-01-01',
        }).then(o => o.toJSON());

        // 管理员创建
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });

        // 登录机构
        token = await app
            .httpRequest()
            .post('/lessonOrganizations/login')
            .send({
                organizationId: organ.id,
                username: 'user001',
                password: '123456',
            })
            .expect(200)
            .then(res => res.body.data.token)
            .catch(e => console.log(e));

        // 1
        await app
            .httpRequest()
            .put('/lessonOrganizations/' + organ.id)
            .send({ privilege: 1 })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));
        // 2
        await app
            .httpRequest()
            .put('/lessonOrganizations/' + organ.id)
            .send({ privilege: 2 })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 创建班级 3
        const cls = await app
            .httpRequest()
            .post('/lessonOrganizationClasses')
            .send({
                organizationId: organ.id,
                name: 'class000',
                begin: new Date(),
                end: new Date().getTime() + 1000 * 60 * 60 * 24,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));
        // 4
        const cls2 = await app
            .httpRequest()
            .post('/lessonOrganizationClasses')
            .send({
                organizationId: organ.id,
                name: 'class001',
                begin: new Date(),
                end: new Date().getTime() + 1000 * 60 * 60 * 24,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        //   更新班级5
        await app
            .httpRequest()
            .put('/lessonOrganizationClasses/' + cls.data.id)
            .send({ name: 'class0000', end: '2110-01-01', packages: [] })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 添加老师6
        let member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [0],
                memberId: 1,
                realname: 'xiaoyao',
                roleId: 2,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 老师改名7
        await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [0],
                memberId: 1,
                realname: 'xiaoyao1',
                roleId: 2,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 移除老师8
        await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [],
                memberId: 1,
                realname: 'xiaoyao',
                roleId: 2,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 测试生成激活码9
        await app
            .httpRequest()
            .post('/lessonOrganizationActivateCodes')
            .send({ organizationId: organ.id, count: 20, classId: cls.data.id })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data)
            .catch(e => console.log(e));

        // 添加班级老师10
        member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [0, cls.data.id],
                memberId: 1,
                realname: 'xiaoyao',
                roleId: 2,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 移除班级老师11
        member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [0],
                memberId: 1,
                realname: 'xiaoyao',
                roleId: 2,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 添加班级学生12
        member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [cls.data.id, cls2.data.id],
                memberId: 1,
                realname: 'xiaoyao',
                roleId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 移除班级学生 并改名13
        member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [cls.data.id],
                memberId: 2,
                realname: 'xiaoyao1',
                roleId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 改密码14
        await app
            .httpRequest()
            .post('/organizations/changepwd')
            .send({
                organizationId: organ.id,
                classId: cls.data.id,
                memberId: 2,
                password: 'test123',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));

        // 移除学生15
        member = await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                organizationId: organ.id,
                classIds: [],
                memberId: 2,
                realname: 'xiaoyao1',
                roleId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body)
            .catch(e => console.log(e));
    });

    describe('获取机构日志', async () => {
        it('001', async () => {
            const logs = await app
                .httpRequest()
                .post('/organizations/log')
                .send({ organizationId: organ.id })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));
            assert(logs.count > 15);
        });
    });
});
