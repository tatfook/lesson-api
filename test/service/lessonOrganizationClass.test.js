const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/service/lessonOrganizationClass.test.js', async () => {
    describe('getByCondition', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.getByCondition(
                {}
            );
            assert(ret.name === cls.name);
        });
        it('002', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.getByCondition(
                { name: cls.name }
            );
            assert(ret.name === cls.name);
        });
    });

    describe('updateByCondition', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass');
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.updateByCondition(
                { name: 'updated' },
                { id: cls.id }
            );
            assert(ret[0] === cls.id);
        });
    });

    describe('historyClass', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass', {
                status: 2,
            });
            app.mockService('keepwork', 'getAllUserByCondition', () => []);
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.historyClass(
                { offset: 0, limit: 10 },
                cls.organizationId
            );
            assert(ret.count === 1 && ret.rows[0].name === cls.name);
        });
    });

    describe('findByUserIdRoleIdAndOrganizationId', async () => {
        let student;
        beforeEach(async () => {
            student = await app.factory.create(
                'LessonOrganizationClassMember',
                {
                    type: 2,
                    roleId: 1,
                    endTime: '2200-01-01',
                }
            );
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.findByUserIdRoleIdAndOrganizationId(
                {
                    userId: student.memberId,
                    organizationId: student.organizationId,
                    roleId: 1,
                }
            );
            assert(ret.length === 1);
        });
    });

    describe('findAllByCondition', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass');
        });

        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.findAllByCondition(
                {}
            );
            assert(ret.length === 1 && ret[0].name === cls.name);
        });

        it('002', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.findAllByCondition(
                {},
                [
                    {
                        as: 'lessonOrganizationClassMembers',
                        model: app.model.LessonOrganizationClassMember,
                    },
                ]
            );
            assert(ret.length === 1 && ret[0].name === cls.name);
        });
    });

    describe('createClass', async () => {
        let org;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClass.createClass(
                {
                    packages: [
                        {
                            packageId: 1,
                            lessons: [{}],
                        },
                    ],
                    organizationId: org.id,
                    name: '班级名称',
                },
                { organizationId: org.id, roleId: 64, userId: 1, username: '' }
            );
        });
    });

    describe('updateClass 更新班级', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClass.updateClass(
                {
                    packages: [
                        {
                            packageId: 1,
                            lessons: [{}],
                        },
                    ],
                    organizationId: cls.organizationId,
                    name: '班级名称',
                    id: cls.id,
                },
                {
                    organizationId: cls.organizationId,
                    roleId: 64,
                    userId: 1,
                    username: '',
                }
            );
        });
    });

    describe('destroyClass', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass');
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClass.destroyClass(
                cls.id,
                cls.organizationId
            );

            const ret = await app.model.LessonOrganizationClass.findOne({
                where: { id: cls.id, organizationId: cls.organizationId },
            });

            assert(!ret);
        });
    });

    describe('classLastestProject 班级最近项目', async () => {
        let member;
        beforeEach(async () => {
            member = await app.factory.create('LessonOrganizationClassMember');
            app.mockService('keepwork', 'getAllProjectByCondition', () => []);
            app.mockService('keepwork', 'getAllUserByCondition', () => []);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClass.classLastestProject(
                member.classId,
                member.organizationId
            );
            assert(ret);
        });
    });

    describe('closeClass 关闭班级', async () => {
        let cls;
        beforeEach(async () => {
            cls = await app.factory.create('LessonOrganizationClass', {
                status: 1,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClass.closeClass(cls.id);
            const ret = await app.model.LessonOrganizationClass.findOne({
                where: { id: cls.id },
            });
            assert(ret.status === 2);
        });
    });
});
