const md5 = require('blueimp-md5');
const { app, assert } = require('egg-mock/bootstrap');
const moment = require('moment');

describe('机构', () => {
    let organ;
    let cls;
    let token;
    let user1;
    beforeEach(async () => {
        // 创建机构
        organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            loginUrl: '/thisisaloginurl',
        }).then(o => o.toJSON());

        // 创建班级
        cls = await app.model.LessonOrganizationClass.create({
            name: 'clss000',
            organizationId: organ.id,
            status: 1,
        }).then(o => o.toJSON());

        // 创建班级成员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            realname: 'qzb',
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
        user1 = await app.factory.create('User', { id: 1 });

        const pkg = await app.model.Package.create({
            userId: 1,
            packageName: 'name',
            auditAt: '2019-10-01',
        });
        await app.model.LessonOrganizationPackage.create({
            organizationId: organ.id,
            classId: cls.id,
            packageId: pkg.id,
            lessons: [{ lessonId: 1 }],
        });

        token = await app.login({ roleId: 64 }).then(o => o.token);
    });

    // describe('登录机构', async () => {
    //     beforeEach(async () => {
    //         app.mockService('keepwork', 'getAllUserByCondition', () => {
    //             return [
    //                 {
    //                     id: 1,
    //                     username: 'qzb',
    //                 },
    //             ];
    //         });
    //     });
    //     it('001', async () => {
    //         await app
    //             .httpRequest()
    //             .post('/lessonOrganizations/login')
    //             .send({
    //                 organizationId: organ.id,
    //                 username: 'qzb',
    //                 password: '123456',
    //             })
    //             .expect(200)
    //             .then(res => res.body.token)
    //             .catch(e => console.log(e));
    //     });
    //     it('002 用户不存在', async () => {
    //         app.mockService('keepwork', 'getAllUserByCondition', () => []);
    //         await app
    //             .httpRequest()
    //             .post('/lessonOrganizations/login')
    //             .send({
    //                 organizationId: organ.id,
    //                 username: 'qzb',
    //                 password: '123456',
    //             })
    //             .expect(400);
    //     });
    //     it('003 机构不存在', async () => {
    //         app.mockService('keepwork', 'getAllUserByCondition', () => []);
    //         await app
    //             .httpRequest()
    //             .post('/lessonOrganizations/login')
    //             .send({
    //                 organizationId: 999,
    //                 username: 'qzb',
    //                 password: '123456',
    //             })
    //             .expect(400);
    //     });
    // });

    // describe('刷新token', async () => {
    //     beforeEach(async () => {
    //         app.mockService('user', 'setToken', () => 0);
    //     });
    //     it('001', async () => {
    //         const newToken = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/token')
    //             .send({
    //                 organizationId: organ.id,
    //                 username: 'qzb',
    //                 password: '123456',
    //             })
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(o => o.body.data);
    //         assert(newToken);
    //     });
    //     it('002', async () => {
    //         await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/token')
    //             .send({
    //                 organizationId: 999,
    //                 username: 'qzb',
    //                 password: '123456',
    //             })
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(400);
    //     });
    // });

    describe('修改机构', async () => {
        beforeEach(async()=>{
            app.mockService('lessonOrganization','createAdminForOrganization',()=>0);
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    loginUrl:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));

            const org = await app.model.LessonOrganization.findOne({
                where: { id: organ.id },
            }).then(o => o.toJSON());

            assert(moment(org.endDate).format('YYYY-MM-DD') === '2019-01-01');
        });

        it('002 缺失name', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    loginUrl:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('003 缺失loginUrl', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('004 缺失startDate', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    loginUrl:'whatever',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
        
        it('005 缺失endDate', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    loginUrl:'whatever',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('006 缺失type', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    loginUrl:'whatever',
                    visibility:1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('007 缺失visibility', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    type: 1,
                    loginUrl:'whatever',
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('008 缺失activateCodeLimit', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    type: 1,
                    visibility:1,
                    loginUrl:'whatever',
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
        it('009 管理员修改', async () => {
            const token = await app.adminLogin().then(o => o.token);
            await app
                .httpRequest()
                .put('/lessonOrganizations/' + organ.id)
                .send({ 
                    name:'whatever',
                    startDate:'2008-01-01',
                    type: 1,
                    visibility:1,
                    loginUrl:'whatever',
                    usernames:['what'],
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    endDate: '2019-02-01' 
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data)
                .catch(e => console.log(e));

            const org = await app.model.LessonOrganization.findOne({
                where: { id: organ.id },
            }).then(o => o.toJSON());

            assert(moment(org.endDate).format('YYYY-MM-DD') === '2019-02-01');
        });
    });

    // describe('获取用户机构', async () => {
    //     let token;
    //     beforeEach(async () => {
    //         token = await app.login().then(o => o.token);
    //         assert.ok(token);
    //     });
    //     it('001', async () => {
    //         let org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(res => res.body);
    //         assert(org.data.length === 1);
    //     });
    // });

    // describe('获取机构详情', async () => {
    //     it('001', async () => {
    //         let org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/' + organ.id)
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(res => res.body.data);

    //         assert(org.name === 'org0000');
    //     });
    //     it('002 机构不存在', async () => {
    //         await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/' + 999)
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(404);
    //     });
    // });

    // describe('用loginUrl获取机构', async () => {
    //     it('001', async () => {
    //         const org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getByUrl?url=' + organ.loginUrl)
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(r => r.body.data);

    //         assert(
    //             org.name === 'org0000' && org.loginUrl === '/thisisaloginurl'
    //         );
    //     });
    //     it('002 url错误', async () => {
    //         const org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getByUrl?url=abc')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(404);
    //     });
    // });

    // describe('用name获取机构', async () => {
    //     it('001', async () => {
    //         const org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getByName?name=' + organ.name)
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(r => r.body.data);

    //         assert(
    //             org.name === 'org0000' && org.loginUrl === '/thisisaloginurl'
    //         );
    //     });
    //     it('002 name错误', async () => {
    //         const org = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getByName?name=abc')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(404);
    //     });
    // });

    describe('创建机构', async () => {
        let adminToken;
        beforeEach(async () => {
            adminToken = await app.adminLogin().then(o => o.token);
            app.mockService('keepwork', 'getAllUserByCondition', () => [
                { id: 1 },
            ]);
            app.mockService('keepwork', 'updateUser', () => 0);
        });
        it('001', async () => {
            let organ = await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    loginUrl:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .then(res => res.body);
        });

        it('002 缺失name', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    loginUrl:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('003 缺失loginUrl', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('004 缺失startDate', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    loginUrl:'whatever',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
        
        it('005 缺失endDate', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations' )
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    loginUrl:'whatever',
                    visibility:1,
                    type: 1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('006 缺失type', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    loginUrl:'whatever',
                    visibility:1,
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('007 缺失visibility', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    type: 1,
                    loginUrl:'whatever',
                    activateCodeLimit:{type5:2,type6:2,type7:2},
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });

        it('008 缺失activateCodeLimit', async () => {
            await app
                .httpRequest()
                .post('/lessonOrganizations')
                .send({
                    name:'whatever',
                    startDate:'2008-01-01',
                    type: 1,
                    visibility:1,
                    loginUrl:'whatever',
                    usernames:['what'],
                    endDate: '2019-01-01',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(422);
        });
    });

    // describe('查询课程包', async () => {
    //     it('001', async () => {
    //         const list = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/packages?classId=' + cls.id)
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(r => r.body.data);

    //         assert(list.length === 1);
    //     });
    //     it('002', async () => {
    //         const list = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/packages?')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(r => r.body.data);

    //         assert(list.length === 1);
    //     });
    // });

    // describe('机构课程包', async () => {
    //     it('001', async () => {
    //         const list = await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/getOrgPackages?organizationId=' +
    //                 organ.id
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(r => r.body.data);

    //         assert(list.length === 1);
    //     });
    // });

    // describe('checkUserInvalid', async () => {
    //     it('001', async () => {
    //         await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/checkUserInvalid?organizationId=' +
    //                 organ.id +
    //                 '&username=abc'
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(400);
    //     });
    //     it('002', async () => {
    //         const list = await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/checkUserInvalid?organizationId=' +
    //                 organ.id +
    //                 '&username=' +
    //                 user1.username
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200);
    //     });
    // });

    // describe('getRealNameInOrg', async () => {
    //     it('001', async () => {
    //         const ret = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getRealNameInOrg')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(o => o.body.data);
    //         assert(ret === 'qzb');
    //     });

    //     it('002', async () => {
    //         const token = await app.login({ id: 2 }).then(o => o.token);
    //         const ret = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/getRealNameInOrg')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(o => o.body.data);
    //         assert(!ret);
    //     });
    // });

    // describe('获取机构各角色的人数', async () => {
    //     it('001', async () => {
    //         const ret = await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/getMemberCountByRole?organizationId=' +
    //                 organ.id
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(o => o.body.data);
    //         assert(ret.studentCount === 1 && ret.teacherCount === 1);
    //     });
    //     it('002', async () => {
    //         const ret = await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/getMemberCountByRole?organizationId=999'
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(o => o.body.data);
    //         assert(ret.studentCount === 0 && ret.teacherCount === 0);
    //     });
    // });

    // describe('课程包详情页', async () => {
    //     it('001', async () => {
    //         let detail = await app
    //             .httpRequest()
    //             .get(
    //                 '/lessonOrganizations/packageDetail?packageId=1&classId=1&roleId=1'
    //             )
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(res => res.body);
    //         assert(detail);
    //     });
    // });

    // describe('获取机构的所有班级，嵌套返回所有成员', async () => {
    //     it('001', async () => {
    //         let detail = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/classAndMembers?_roleId=1')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(res => res.body.data);

    //         assert(
    //             detail.length === 1 &&
    //             detail[0].teacherList.length === 1 &&
    //             detail[0].studentList.length === 1
    //         );
    //     });
    // });

    // describe('获取学生加入的全部机构', async () => {
    //     it('001', async () => {
    //         let list = await app
    //             .httpRequest()
    //             .get('/lessonOrganizations/userOrgInfo')
    //             .set('Authorization', `Bearer ${token}`)
    //             .expect(200)
    //             .then(res => res.body.data);
    //         assert(list.allOrgs.length === 1);
    //     });
    // });
});
