const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');

describe('机构学生', () => {
    beforeEach(async () => {
        app.mockService('keepwork', 'getAllUserByCondition', () => { return [{ id: 1, username: 'u' }] });
        app.mockService('keepwork', 'getUserDatas', () => { return { tokens: ['XXX'] } });
        app.mockService('keepwork', 'setUserDatas', () => 0);
        app.mockService('keepwork', 'updateUser', () => 0);
    });

    it('001 机构学生添加', async () => {
        const user = await app.login({ roleId: 67 });
        const token = user.token;

        // 创建机构
        const organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
        }).then(o => o.toJSON());

        // 创建班级
        let cls = await app.model.LessonOrganizationClass.create({
            name: 'clss000',
            organizationId: organ.id,
            begin: new Date(),
            end: new Date().getTime() + 1000 * 60 * 60 * 24,
        }).then(o => o.toJSON());

        let cls2 = await app.model.LessonOrganizationClass.create({
            name: 'clss001',
            organizationId: organ.id,
            begin: new Date(),
            end: new Date().getTime() + 1000 * 60 * 60 * 24,
        }).then(o => o.toJSON());

        // 添加为管理员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });

        // 测试接口添加学生
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

        await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                memberId: 1,
                organizationId: organ.id,
                classIds: [0],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data)
            .catch(e => console.log(e));

        await app
            .httpRequest()
            .post('/lessonOrganizationClassMembers')
            .send({
                memberId: 1,
                organizationId: organ.id,
                classIds: [cls.id, cls2.id],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data)
            .catch(e => console.log(e));

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

        // 学生
        let students = await app
            .httpRequest()
            .get(`/lessonOrganizationClassMembers/student?classId=${cls.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert(students.data.count === 1);

        // // 移除班级成员
        await app.httpRequest().delete(`/lessonOrganizationClassMembers/${students.data.rows[0].id}?roleId=1`)
            .set("Authorization", `Bearer ${token}`).expect(200);

        students = await app
            .httpRequest()
            .get(`/lessonOrganizationClassMembers/student?classId=${cls2.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert(students.data.count === 0);

        // 教师
        let teachers = await app
            .httpRequest()
            .get(`/lessonOrganizationClassMembers/teacher?classId=${cls2.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert(teachers.data.length === 0);

        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            classId: cls2.id,
            roleId: 2,
            memberId: 2,
        });

        teachers = await app
            .httpRequest()
            .get(`/lessonOrganizationClassMembers/teacher?classId=${cls2.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert(teachers.data.length === 1);
    });
});
