const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');
const moment = require('moment')

describe('test/service/lesssonOrganizationClassMember.test.js', async () => {
    describe('getByCondition', async () => {
        beforeEach(async () => {
            await app.model.LessonOrganizationClassMember.create({
                memberId: 1,
                organizationId: 1,
                roleId: 1,
                type: 2,
                endTime: '2220-10-10',
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getByCondition(
                { type: 2 }
            );
            assert(ret.memberId === 1 && ret.organizationId === 1);
        });
    });

    describe('getAllByCondition', async () => {
        let members;
        beforeEach(async () => {
            members = await app.factory.createMany(
                'LessonOrganizationClassMember',
                10
            );
        });
        it('001', async () => {
            const f = _.filter(members, o => o.type === 1);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getAllByCondition(
                { type: 1 }
            );
            assert(ret.length === f.length);
        });
    });

    describe('getAllAndExtraByCondition', async () => {
        let members;
        beforeEach(async () => {
            members = await app.factory.createMany(
                'LessonOrganizationClassMember',
                10
            );
        });
        it('001', async () => {
            const f = _.filter(members, o => o.type === 1);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getAllAndExtraByCondition(
                [
                    {
                        as: 'lessonOrganizationClasses',
                        model: ctx.model.LessonOrganizationClass,
                    },
                ],
                { type: 1 }
            );
            assert(
                ret.length === f.length &&
                _.every(ret, o => o.lessonOrganizationClasses)
            );
        });
    });

    describe('destroyByCondition', async () => {
        let members;
        beforeEach(async () => {
            members = await app.factory.createMany(
                'LessonOrganizationClassMember',
                10
            );
        });
        it('001', async () => {
            const f = _.filter(members, o => o.type === 1);
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.destroyByCondition({
                type: 1,
            });

            const count = await app.model.LessonOrganizationClassMember.count();
            assert(count === members.length - f.length);
        });
    });

    describe('updateByCondition', async () => {
        let member;
        beforeEach(async () => {
            member = await app.model.LessonOrganizationClassMember.create({
                memberId: 1,
                organizationId: 1,
                roleId: 1,
                type: 2,
                endTime: '2220-10-10',
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.updateByCondition(
                { type: 1 },
                { id: member.id }
            );

            const ret = await app.model.LessonOrganizationClassMember.findOne({
                where: { id: member.id },
            });
            assert(ret.type === 1);
        });
    });

    describe('create', async () => {
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.create({
                memberId: 1,
                organizationId: 1,
                roleId: 1,
                type: 2,
                endTime: '2220-10-10',
            });

            const ret = await app.model.LessonOrganizationClassMember.findOne(
                {}
            );
            assert(ret.type === 2 && ret.memberId === 1);
        });
    });

    describe('getTeachers', async () => {
        let org;
        let cls;
        let members;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: org.id,
            });
            members = await app.factory.createMany(
                'LessonOrganizationClassMember',
                10,
                {
                    organizationId: org.id,
                    classId: cls.id,
                    roleId: 2,
                }
            );

            app.mockService('keepwork', 'getAllUserByCondition', () => []);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getTeachers(
                org.id,
                cls.id
            );
            assert(ret.length === 10 && _.every(ret, o => o.classes));
        });

        it('002', async () => {
            app.mockService('keepwork', 'getAllUserByCondition', () => [
                { id: members[0].memberId, username: 'abc' },
            ]);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getTeachers(
                org.id,
                cls.id
            );
            assert(ret.length === 10 && _.some(ret, o => o.username === 'abc'));
        });
    });

    describe('getStudents', async () => {
        let org;
        let cls;
        let members;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', {
                organizationId: org.id,
            });
            members = await app.factory.createMany(
                'LessonOrganizationClassMember',
                10,
                {
                    organizationId: org.id,
                    classId: cls.id,
                    roleId: 1,
                    endTime: '2200-01-01',
                }
            );

            app.mockService('keepwork', 'getAllUserByCondition', () => []);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getStudents(
                org.id,
                cls.id
            );
            assert(ret.count === 10 && _.every(ret.rows, o => o.classes));
        });

        it('002', async () => {
            app.mockService('keepwork', 'getAllUserByCondition', () => [
                { id: members[0].memberId, username: 'abc' },
            ]);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getStudents(
                org.id,
                cls.id
            );
            assert(ret.count === 10 && _.some(ret.rows, o => o.users));
        });

        it('003', async () => {
            const f = _.filter(members, o => o.type === 2);
            const ctx = app.mockContext();
            const ret = await ctx.service.lessonOrganizationClassMember.getStudents(
                org.id,
                cls.id,
                2
            );
            assert(ret.count === f.length);
        });
    });

    describe('createMember', async () => {
        let org;
        let member;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 1
            });

            app.mockService('lessonOrganizationClassMember', 'updateUserVipAndTLevel', () => 0);
            app.mockService('keepwork', 'getAllUserByCondition', () => [{ id: 1 }]);
        });
        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.createMember({
                memberId: member.memberId,
                roleId: 1,
                organizationId: 1,
                realname: 'abc'
            }, {
                organizationId: 1, roleId: 64, userId: 1, username: ''
            });
        });

        it('002 指定班级', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.createMember({
                memberId: member.memberId,
                roleId: 1,
                organizationId: 1,
                classId: [cls.id, 2]
            }, {
                organizationId: 1, roleId: 64, userId: 1, username: ''
            });
        });

        it('003 带memberName', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.createMember({
                memberName: 'abc',
                roleId: 1,
                organizationId: 1,
                classId: [cls.id, 2]
            }, {
                organizationId: 1, roleId: 64, userId: 1, username: ''
            });
        });

        it('004 带memberName， 添加老师', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.createMember({
                memberName: 'abc',
                roleId: 2,
                organizationId: 1,
                classId: [cls.id, 2]
            }, {
                organizationId: 1, roleId: 64, userId: 1, username: ''
            });
        });

        it('005 机构不存在', async () => {
            const ctx = app.mockContext();
            let catched
            try {
                await ctx.service.lessonOrganizationClassMember.createMember({
                    memberName: 'abc',
                    roleId: 2,
                    organizationId: 2,
                    classId: [cls.id, 2]
                }, {
                    organizationId: 2, roleId: 64, userId: 1, username: ''
                });
            } catch (e) {
                catched = true;
                assert(e.message === '机构不存在');
            }
            assert(catched);
        });

        it('006 没有权限', async () => {
            const ctx = app.mockContext();
            let catched
            try {
                await ctx.service.lessonOrganizationClassMember.createMember({
                    memberName: 'abc',
                    roleId: 2,
                    organizationId: 1,
                    classId: [cls.id, 2]
                }, {
                    organizationId: 1, roleId: 1, userId: 1, username: ''
                });
            } catch (e) {
                catched = true;
                assert(e.message === '没有权限');
            }
            assert(catched);
        });
    });

    describe('destroyMember', async () => {
        let org;
        let cls;
        let member;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 3
            });

            app.mockService('lessonOrganizationClassMember', 'updateUserVipAndTLevel', () => 0);
        });
        it('001 删除学生', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.destroyMember({
                roleId: 1,
            }, {
                organizationId: org.id, roleId: 64, userId: 1, username: 'abc'
            }, member.id);

            const ret = await app.model.LessonOrganizationClassMember.findOne();
            assert(ret.roleId === 2);
        });

        it('002 删除老师', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.destroyMember({
                roleId: 2,
            }, {
                organizationId: org.id, roleId: 64, userId: 1, username: 'abc'
            }, member.id);

            const ret = await app.model.LessonOrganizationClassMember.findOne();
            assert(ret.roleId === 1);
        });

        it('003', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationClassMember.destroyMember({
                    roleId: 2,
                }, {
                    organizationId: org.id, roleId: 1, userId: 1, username: 'abc'
                }, member.id);
            } catch (e) {
                assert(e.message === '没有权限');
            }
        });

        it('004 机构不存在', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.destroyMember({
                    roleId: 2,
                }, {
                    organizationId: 999, roleId: 64, userId: 1, username: 'abc'
                }, member.id);
            } catch (e) {
                assert(e.message === '机构不存在');
            }
        });
    });

    describe('clearRoleFromOrg', async () => {
        beforeEach(async () => {
            await app.factory.create('LessonOrganizationClassMember', {
                memberId: 1,
                roleId: 67,
                classId: 1,
                organizationId: 1,
            });
        });
        it('001 删除学生', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.clearRoleFromOrg(
                1,
                1,
                1
            );

            const ret = await ctx.model.LessonOrganizationClassMember.findOne();
            assert(ret.roleId === 66);
        });

        it('002 教师', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.clearRoleFromOrg(
                1,
                2,
                1
            );

            const ret = await ctx.model.LessonOrganizationClassMember.findOne();
            assert(ret.roleId === 65);
        });

        it('003 删除学生和老师', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.clearRoleFromOrg(
                1,
                3,
                1
            );

            const ret = await ctx.model.LessonOrganizationClassMember.findOne();
            assert(ret.roleId === 64);
        });
    });

    describe('updateUserVipAndTLevel', async () => {
        let org;
        let member;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 1
            });
            app.mockService('keepwork', 'updateUser', () => 0);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationClassMember.updateUserVipAndTLevel(1);
        });
    });

    describe('toFormal 试听转正式', async () => {
        let org;
        let member;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 1
            });
            app.mockService('keepwork', 'updateUser', () => 0);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.toFormal([1], 1, [1], {});
            } catch (e) {
                assert(e.message === '正式学生类型错误');
            }
        });

        it('002', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.toFormal([2], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级成员不存在');
            }
        });

        it('003', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.toFormal([1], 5, [2], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级id错误');
            }
        });

        it('004', async () => {
            const ctx = app.mockContext();
            await app.factory.createMany('LessonOrganizationActivateCode', 10, {
                organizationId: org.id,
                classIds: [cls.id]
            });
            try {
                await ctx.service.lessonOrganizationClassMember.toFormal([1], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '已经超出激活码数量上限');
            }
        });

        it('005', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.toFormal([1], 5, [1], {
                organizationId: org.id,
                userId: 1,
                username: 'abc'
            });

            const ret = await app.model.LessonOrganizationClassMember.findOne();
            assert(ret.type === 2
                && moment(ret.endTime).format('YYYY-MM-DD') === moment().add(3, 'month').format('YYYY-MM-DD'));

        });
    });

    describe('recharge 续费', async () => {
        let org;
        let member;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 1,
                endTime: '2200-01-01'
            });
            app.mockService('keepwork', 'updateUser', () => 0);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.recharge([1], 1, [1], {});
            } catch (e) {
                assert(e.message === '正式学生类型错误');
            }
        });

        it('002', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.recharge([2], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级成员不存在');
            }
        });

        it('003', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.recharge([1], 5, [2], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级id错误');
            }
        });
        it('004', async () => {
            const ctx = app.mockContext();
            await app.factory.createMany('LessonOrganizationActivateCode', 10, {
                organizationId: org.id,
                classIds: [cls.id]
            });
            try {
                await ctx.service.lessonOrganizationClassMember.recharge([1], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '已经超出激活码数量上限');
            }
        });
        it('005', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.recharge([1], 5, [1], {
                organizationId: org.id,
                userId: 1,
                username: 'abc'
            });

            const ret = await app.model.LessonOrganizationClassMember.findOne();
            assert(ret.type === 2
                && moment(ret.endTime).format('YYYY-MM-DD') === '2200-04-01');

        });
    });

    describe('reactivate 重新激活学生', async () => {
        let org;
        let member;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });

            member = await app.model.LessonOrganizationClassMember.create({
                organizationId: org.id,
                classId: cls.id,
                memberId: 1,
                roleId: 1,
                endTime: '2200-01-01'
            });
            app.mockService('keepwork', 'updateUser', () => 0);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.reactivate([1], 0, [1], {});
            } catch (e) {
                assert(e.message === '正式学生类型错误');
            }
        });

        it('002', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.reactivate([2], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级成员不存在');
            }
        });

        it('003', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.lessonOrganizationClassMember.reactivate([1], 5, [2], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '班级id错误');
            }
        });
        it('004', async () => {
            const ctx = app.mockContext();
            await app.factory.createMany('LessonOrganizationActivateCode', 10, {
                organizationId: org.id,
                classIds: [cls.id]
            });
            try {
                await ctx.service.lessonOrganizationClassMember.reactivate([1], 5, [1], {
                    organizationId: org.id,
                    userId: 1,
                    username: 'abc'
                });
            } catch (e) {
                assert(e.message === '已经超出激活码数量上限');
            }
        });

        it('005', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationClassMember.reactivate([1], 5, [1], {
                organizationId: org.id,
                userId: 1,
                username: 'abc'
            });

            const ret = await app.model.LessonOrganizationClassMember.findOne();
            assert(ret.type === 2
                && moment(ret.endTime).format('YYYY-MM-DD') === moment().add(3, 'month').format('YYYY-MM-DD'));

        });
    });

    describe('historyStudents', async () => {
        let org;
        let cls;
        beforeEach(async () => {
            org = await app.factory.create('LessonOrganization');
            cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });
            await app.factory.createMany('LessonOrganizationClassMember', 10, {
                endTime: '2008-01-01',
                classId: cls.id,
                organizationId: org.id,
                roleId: 1
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.lessonOrganizationClassMember.historyStudents({
                classId: cls.id,
                organizationId: org.id,
                queryOptions: { offset: 0, limit: 10 }
            });

            assert(ret.count === 10);
        });
    });
});
