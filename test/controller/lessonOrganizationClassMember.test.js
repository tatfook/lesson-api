const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');

describe('机构学生', () => {
    let cls;
    let cls2;
    let token;
    let organ;
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
            endDate: '2220-01-01',
            activateCodeLimit: { type5: 5, type6: 6, type7: 7 },
        }).then(o => o.toJSON());

        // 创建班级
        cls = await app.model.LessonOrganizationClass.create({
            name: 'clss000',
            organizationId: organ.id,
            status: 1,
        }).then(o => o.toJSON());

        cls2 = await app.model.LessonOrganizationClass.create({
            name: 'clss001',
            organizationId: organ.id,
            status: 1,
        }).then(o => o.toJSON());

        // 添加为管理员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });

        const user = await app.login({ roleId: 67 });
        token = user.token;
    });

    describe('获取教师列表', async () => {
        beforeEach(async () => {
            await app.model.LessonOrganizationClassMember.create({
                organizationId: organ.id,
                classId: cls2.id,
                roleId: 2,
                memberId: 2,
            });
        });
        it('001', async () => {
            let teachers = await app
                .httpRequest()
                .get(
                    `/lessonOrganizationClassMembers/teacher?classId=${cls2.id}`
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
            assert(teachers.data.length === 1);
        });

        it('002', async () => {
            let teachers = await app
                .httpRequest()
                .get(`/lessonOrganizationClassMembers/teacher?classId=999`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
            assert(teachers.data.length === 0);
        });
    });

    describe('学生列表', async () => {
        beforeEach(async () => {
            await app.model.LessonOrganizationClassMember.create({
                organizationId: organ.id,
                classId: cls.id,
                roleId: 1,
                memberId: 2,
                endTime: '2200-01-01',
            });
            await app.model.User.create({ id: 2, username: '' });
        });
        it('001', async () => {
            let students = await app
                .httpRequest()
                .get(
                    `/lessonOrganizationClassMembers/student?classId=${cls.id}`
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
            assert(students.data.count === 1);
        });
        it('002', async () => {
            let students = await app
                .httpRequest()
                .get(`/lessonOrganizationClassMembers/student?classId=999`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
            assert(students.data.count === 0);
        });
    });

    describe('创建成员', async () => {
        it('001', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers')
                .send({
                    memberId: 1,
                    organizationId: organ.id,
                    classIds: [cls.id],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));
        });
    });

    describe('删除成员', async () => {
        let member;
        beforeEach(async () => {
            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: organ.id,
                classId: cls.id,
                roleId: 1,
                memberId: 2,
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .delete(`/lessonOrganizationClassMembers/${member.id}?roleId=1`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const list = await app.model.LessonOrganizationClassMember.findAll({
                where: {
                    id: member.id,
                    roleId: { $in: ['1', '3', '65', '67'] },
                },
            });
            assert(list.length === 0);
        });
    });

    describe('试听转正式', async () => {
        beforeEach('', async () => {
            const cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: organ.id,
                status: 1,
            });
            await app.model.LessonOrganizationClassMember.create({
                organizationId: organ.id,
                memberId: 1,
                roleId: 1,
                classId: cls.id,
                endTime: '2200-01-01',
                type: 1,
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/formal')
                .send({
                    userIds: [1],
                    type: 5,
                    classIds: [1],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body);
        });
    });

    describe('从机构中删除某个用户的某个身份', async () => {
        let member;
        beforeEach(async () => {
            app.mockService(
                'lessonOrganizationClassMember',
                'clearRoleFromOrg',
                () => 0
            );
        });

        it('001', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromOrg')
                .send({
                    memberId: 1,
                    _roleId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('002 没有权限', async () => {
            const token = await app.login({ roleId: 1 }).then(r => r.token);

            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromOrg')
                .send({
                    memberId: 1,
                    _roleId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });

    describe('从班级中删除某个用户的某个身份', async () => {
        let member;
        beforeEach(async () => {
            app.mockService(
                'lessonOrganizationClassMember',
                'clearRoleFromClass',
                () => 0
            );
        });

        it('001', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromClass')
                .send({
                    memberId: 1,
                    _roleId: 1,
                    classId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('002', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromClass')
                .send({
                    memberId: 0,
                    _roleId: 1,
                    classId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
        it('003', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromClass')
                .send({
                    memberId: 1,
                    _roleId: 99,
                    classId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
        it('004', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromClass')
                .send({
                    memberId: 1,
                    _roleId: 1,
                    classId: 0,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('005', async () => {
            const token = await app.login({ roleId: 1 }).then(r => r.token);
            await app
                .httpRequest()
                .post('/lessonOrganizationClassMembers/clearRoleFromClass')
                .send({
                    memberId: 1,
                    _roleId: 1,
                    classId: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });
});
