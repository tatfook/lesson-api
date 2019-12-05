const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');

describe('lesson organization class', () => {
    let orgId;
    let token;
    beforeEach(async () => {
        app.mockService('keepwork', 'getAllUserByCondition', () => {
            return [{ id: 1, username: 'u' }];
        });
        app.mockService('keepwork', 'getUserDatas', () => {
            return { tokens: ['XXX'] };
        });
        app.mockService('keepwork', 'setUserDatas', () => 0);
        // 创建机构
        const organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
        }).then(o => o.toJSON());
        // 创建班级成员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });
        // 登录机构
        const data = await app
            .httpRequest()
            .post('/lessonOrganizations/login')
            .send({
                organizationId: organ.id,
                username: 'user009',
                password: '123456',
            })
            .expect(200)
            .then(res => res.body.data)
            .catch(e => console.log(e));
        token = data.token;
        orgId = organ.id;
    });

    describe('创建班级', async () => {
        it('001', async () => {
            const cls = await app
                .httpRequest()
                .post('/lessonOrganizationClasses')
                .send({
                    name: 'clss000',
                    organizationId: orgId,
                    begin: new Date(),
                    end: new Date().getTime() + 1000 * 60 * 60 * 24,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
            assert(cls);
        });
        it('002', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClasses')
                .send({
                    name: '',
                    organizationId: orgId,
                    begin: new Date(),
                    end: new Date().getTime() + 1000 * 60 * 60 * 24,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(res => res.body);
        });
    });

    describe('获取班级列表', async () => {
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: orgId, end: '2200-10-01'
            });
            await app.factory.create('LessonOrganizationClassMember', {
                classId: cls.id,
                organizationId: orgId,
                memberId: 1,
                roleId: 64
            });
        });
        it('001', async () => {
            const list = await app
                .httpRequest()
                .get('/lessonOrganizationClasses')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(list.length === 1);
        });
        it('002', async () => {
            const list = await app
                .httpRequest()
                .get('/lessonOrganizationClasses?roleId=64')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(list.length === 1);
        });
    });

    describe('获取历史班级', async () => {
        beforeEach(async () => {
            await app.factory.create('LessonOrganizationClass', {
                end: '2019-01-01',
                organizationId: 1
            });
        });
        it('001', async () => {
            const cls = await app
                .httpRequest()
                .get('/lessonOrganizationClasses/history')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(cls.count === 1);
        });
    });

    describe('更新班级', async () => {
        let id;
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass');
            id = cls.id;
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizationClasses/' + id)
                .send({
                    name: '修改的名字'
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            const ret = await app.model.LessonOrganizationClass.findOne({ where: { id } });
            assert(ret.name === '修改的名字');
        });
    });

    describe('删除班级', async () => {
        let id;
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: 1
            });
            id = cls.id;
        });

        it('001', async () => {
            await app
                .httpRequest()
                .delete('/lessonOrganizationClasses/' + id)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            const ret = await app.model.LessonOrganizationClass.findOne({ where: { id } });
            assert(!ret);
        });
    });

    describe('班级最近项目', async () => {
        let id;
        beforeEach(async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: 1
            });
            id = cls.id;
            await app.factory.create('LessonOrganizationClassMember', {
                organizationId: 1,
                classId: cls.id,
                memberId: 1
            });

            app.mockService('keepwork', 'getAllProjectByCondition', () => {
                return []
            });
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .get('/lessonOrganizationClasses/' + id + '/project')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret.length === 1)
        })
    });
});
