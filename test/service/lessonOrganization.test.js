const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');

describe('test/service/lessonOrganization.test.js', async () => {
    describe('mergeRoleIdAndGenToken', async () => {
        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.lessonOrganization.mergeRoleIdAndGenToken(
                {
                    members: [{ roleId: 1 }, { roleId: 2 }],
                    userId: 1,
                    username: 'user',
                    organizationId: 1,
                    loginUrl: '',
                },
                {
                    secret: 'abc',
                }
            );
            assert(ret.token && ret.roleId === 3);
        });
    });

    describe('getByCondition', async () => {
        let org;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getByCondition({
                id: org.id,
            });
            assert(ret.name === org.name);
        });
    });

    describe('getUserOrganizations 获取用户加入的机构', async () => {
        let member;
        beforeEach(async () => {
            member = await app.factory.create('LessonOrganizationClassMember', {
                memberId: 1,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getUserOrganizations(
                1
            );
            assert(ret.length === 1 && ret[0].id === member.organizationId);
        });
    });

    describe('createOrganization', async () => {
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.createOrganization(
                {
                    name: 'org1',
                }
            );
            assert(ret);
        });

        it('002 add packages and admin', async () => {
            app.mockService('keepwork', 'getAllUserByCondition', () => [
                { id: 1 },
                { id: 2 },
            ]);
            app.mockService('keepwork', 'updateUser', () => 0);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.createOrganization(
                {
                    name: 'org1',
                    packages: [
                        {
                            packageId: 1,
                            lessons: [],
                        },
                    ],
                    usernames: ['jack', 'owen'],
                }
            );
            assert(ret);

            const orgPkg = await app.model.LessonOrganizationPackage.findAll();
            assert(orgPkg.length === 1);

            const members = await app.model.LessonOrganizationClassMember.findAll();
            assert(
                members.length === 2 && _.every(members, o => o.roleId === 64)
            );
        });
    });

    describe('fixedClassPackage', async () => {
        let orgPkg;
        beforeEach(async () => {
            orgPkg = await app.factory.create('LessonOrganizationPackage');
        });
        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganization.fixedClassPackage(
                orgPkg.organizationId,
                [
                    {
                        packageId: orgPkg.packageId,
                    },
                ]
            );

            const ret = await app.model.LessonOrganizationPackage.findAll();
            assert(ret.length === 1);
        });
        it('002', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganization.fixedClassPackage(
                orgPkg.organizationId,
                [
                    {
                        packageId: 999,
                    },
                ]
            );

            const ret = await app.model.LessonOrganizationPackage.findAll();
            assert(ret.length === 0);
        });
    });

    describe('updateOrganization', async () => {
        let org;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
        });
        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganization.updateOrganization(
                {
                    name: 'name1',
                    endDate: '2009-12-12',
                    privilege: 1,
                },
                org,
                { userId: 1, roleId: 64, username: '' }
            );
        });

        it('002 dashbord管理员', async () => {
            const ctx = app.mockContext();
            ctx.state.admin = { userId: 1 };
            await ctx.service.lessonOrganization.updateOrganization(
                {
                    name: 'name1',
                    endDate: '2009-12-12',
                    privilege: 1,
                },
                org,
                { userId: 1, roleId: 64, username: '' }
            );
        });
    });

    describe('getPackage', async () => {
        let orgPkg;
        beforeEach(async () => {
            orgPkg = await app.factory.create('LessonOrganizationPackage');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getPackage(
                orgPkg.packageId,
                orgPkg.classId,
                null,
                null,
                orgPkg.organizationId
            );
            assert(ret);
        });
        it('002', async () => {
            await app.factory.create('LessonOrganizationClassMember', {
                organizationId: orgPkg.organizationId,
                classId: orgPkg.classId,
                memberId: 1,
                roleId: 1,
            });
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getPackage(
                orgPkg.packageId,
                undefined,
                1,
                1,
                orgPkg.organizationId
            );
            assert(ret);
        });
    });

    describe('getPackageDetail', async () => {
        let orgPkg;
        beforeEach(async () => {
            orgPkg = await app.factory.create('LessonOrganizationPackage');
            app.mockService('lessonOrganization', 'getPackage', () => ({
                lessons: [{ lessonId: 1 }],
            }));
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getPackageDetail(
                orgPkg.packageId,
                orgPkg.classId,
                1,
                1,
                orgPkg.organizationId
            );
            assert(ret);
        });
        it('002', async () => {
            app.mockService('lessonOrganization', 'getPackage', () => 0);

            try {
                const ctx = app.mockContext();
                const ret = await ctx.service.lessonOrganization.getPackageDetail(
                    orgPkg.packageId,
                    undefined,
                    null,
                    null,
                    orgPkg.organizationId
                );
                assert(ret);
            } catch (e) {
                assert(e.message === '参数错误');
            }
        });
    });

    describe('getMemberCountByRoleId', async () => {
        it('001', async () => {
            const member = await app.factory.create(
                'LessonOrganizationClassMember',
                { roleId: 1 }
            );

            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getMemberCountByRoleId(
                member.organizationId
            );
            assert(ret.studentCount === 1 && ret.teacherCount === 0);
        });

        it('002', async () => {
            const member = await app.factory.create(
                'LessonOrganizationClassMember',
                { roleId: 2 }
            );

            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getMemberCountByRoleId(
                member.organizationId
            );
            assert(ret.studentCount === 0 && ret.teacherCount === 1);
        });
    });

    describe('getOrgPackages', async () => {
        let orgPkg;
        beforeEach(async () => {
            orgPkg = await app.factory.create('LessonOrganizationPackage');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getOrgPackages(
                orgPkg.organizationId
            );
            assert(ret.length === 1);
        });
    });

    describe('checkUserInvalid', async () => {
        beforeEach(async () => {
            await app.factory.create('User', { username: 'qzb' });
        });

        it('001', async () => {
            const ctx = app.mockContext();
            try {
                const ret = await ctx.service.lessonOrganization.checkUserInvalid(
                    'abc',
                    1
                );
            } catch (e) {
                assert(e.message === '用户不存在');
            }
        });
        it('002', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganization.checkUserInvalid('qzb', 1);
        });

        it('003', async () => {
            await app.model.LessonOrganizationClassMember.create({
                memberId: 1,
                organizationId: 1,
                roleId: 2,
            });
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganization.checkUserInvalid('qzb', 1);
            } catch (e) {
                assert(e.message === '已经是该机构的老师');
            }
        });
    });

    describe('getClassAndMembers', async () => {
        beforeEach(async () => {
            let ret = await app.model.LessonOrganizationClass.create({
                organizationId: 1,
                status: 1,
            });
            await app.factory.create('LessonOrganizationClassMember', {
                classId: ret.id,
                organizationId: 1,
                roleId: 1,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getClassAndMembers(
                1,
                1,
                1
            );
            assert(ret.length === 1 && ret[0].studentList.length === 1);
        });
    });

    describe('getUserOrgInfo', async () => {
        let member;
        beforeEach(async () => {
            member = await app.factory.create('LessonOrganizationClassMember', {
                roleId: 1,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getUserOrgInfo(
                member.memberId,
                1
            );
            assert(ret[0].id === member.organizationId);
        });

        it('002', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganization.getUserOrgInfo(
                member.memberId,
                2
            );
            assert(ret.length === 0);
        });
    });

    describe('checkActivateCodeLimit', async () => {
        let org;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            await app.factory.createMany('LessonOrganizationActivateCode', 10, {
                organizationId: org.id,
                state: 0,
                type: 5,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganization.checkActivateCodeLimit(
                org.id,
                { type5: 20, type6: 20, type7: 20 }
            );
        });
        it('002', async () => {
            try {
                const ctx = app.mockContext();
                const ret = await ctx.service.lessonOrganization.checkActivateCodeLimit(
                    org.id,
                    { type5: 9, type6: 20, type7: 20 }
                );
            } catch (e) {
                assert(e.message === '激活码上限错误');
            }
        });
    });
});
