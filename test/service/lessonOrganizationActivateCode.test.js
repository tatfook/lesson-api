const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');

describe('test/service/lessonOrganizationActivateCode.test.js', async () => {
    describe('createActivateCode 创建激活码', async () => {
        beforeEach(async () => {
            await app.model.LessonOrganization.create({
                id: 1,
                endDate: '2220-01-01',
            });
        });
        it('001 没有权限', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                    {
                        count: 1,
                        type: 5,
                    },
                    { userId: 1, organizationId: 1, roleId: 1, username: '' }
                );
            } catch (e) {
                assert(e.message === '没有权限');
            }
        });
        it('002 班级失效1', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                    {
                        count: 1,
                        type: 5,
                        classIds: [1],
                    },
                    { userId: 1, organizationId: 1, roleId: 64, username: '' }
                );
            } catch (e) {
                assert(e.message === '班级失效');
            }
        });
        it('003 班级失效2', async () => {
            await app.model.LessonOrganizationClass.create({
                id: 1,
                status: 2,
            });
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                    {
                        count: 1,
                        type: 5,
                        classIds: [1],
                    },
                    { userId: 1, organizationId: 1, roleId: 64, username: '' }
                );
            } catch (e) {
                assert(e.message === '班级失效');
            }
        });
        it('004 机构不存在', async () => {
            await app.model.LessonOrganizationClass.create({
                id: 1,
                status: 1,
                organizationId: 2,
            });
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                    {
                        count: 1,
                        type: 5,
                        classIds: [1],
                    },
                    { userId: 1, organizationId: 2, roleId: 64, username: '' }
                );
            } catch (e) {
                assert(e.message === '机构不存在');
            }
        });
        it('005 超出激活码上限', async () => {
            await app.model.LessonOrganizationClass.create({
                id: 1,
                status: 1,
                organizationId: 1,
            });
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                    {
                        count: 1,
                        type: 5,
                        classIds: [1],
                    },
                    { userId: 1, organizationId: 1, roleId: 64, username: '' }
                );
            } catch (e) {
                assert(e.message === '已经超出激活码数量上限');
            }
        });
        it('006 创建成功', async () => {
            await app.model.LessonOrganization.create({
                id: 2,
                name: 'org2',
                endDate: '2220-01-01',
            });
            await app.model.LessonOrganizationClass.create({
                id: 1,
                status: 1,
                organizationId: 2,
            });
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationActivateCode.createActivateCode(
                {
                    count: 1,
                    type: 5,
                    classIds: [1],
                },
                { userId: 1, organizationId: 2, roleId: 64, username: '' }
            );
        });
    });

    describe('findAllActivateCodeAndCount 激活码列表', async () => {
        let codes;
        beforeEach(async () => {
            codes = await app.factory.createMany(
                'LessonOrganizationActivateCode',
                10
            );
        });
        it('001', async () => {
            const ctx = app.mockContext();

            const {
                count,
                rows,
            } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount(
                {
                    offset: 0,
                    limit: 10,
                },
                {}
            );
            assert(count === 10);
        });
        it('002 筛选state=1', async () => {
            const ctx = app.mockContext();

            const {
                count,
                rows,
            } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount(
                {
                    offset: 0,
                    limit: 10,
                },
                { state: 1 }
            );
            assert(count === _.filter(codes, o => o.state === 1).length);
        });
        it('003 偏移量', async () => {
            const ctx = app.mockContext();

            const {
                count,
                rows,
            } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount(
                {
                    offset: 1,
                    limit: 10,
                },
                {}
            );
            assert(count === 10 && rows.length === 9);
        });
    });

    describe('getCountByCondition 获得count', async () => {
        let codes;
        beforeEach(async () => {
            codes = await app.factory.createMany(
                'LessonOrganizationActivateCode',
                10
            );
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const count = await ctx.service.lessonOrganizationActivateCode.getCountByCondition(
                {}
            );
            assert(count === 10);
        });
        it('002', async () => {
            const ctx = app.mockContext();
            const count = await ctx.service.lessonOrganizationActivateCode.getCountByCondition(
                {
                    state: 1,
                }
            );
            assert(count === _.filter(codes, o => o.state === 1).length);
        });
    });
    describe('getByCondition', async () => {
        beforeEach(async () => {
            await app.factory.createMany('LessonOrganizationActivateCode', 10);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            const code = await ctx.service.lessonOrganizationActivateCode.getByCondition(
                {
                    id: 1,
                }
            );
            assert(code.id === 1);
        });
    });
    describe('updateByCondition', async () => {
        beforeEach(async () => {
            await app.factory.createMany('LessonOrganizationActivateCode', 10);
        });
        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationActivateCode.updateByCondition(
                {
                    state: 2,
                },
                {
                    id: 1,
                }
            );
            const code = await app.model.LessonOrganizationActivateCode.findOne(
                { where: { id: 1 } }
            );
            assert(code.state === 2);
        });
    });

    describe('useActivateCode 学生使用激活码激活', async () => {
        let key;
        let organizationId;
        beforeEach(async () => {
            const code = await app.factory.create(
                'LessonOrganizationActivateCode',
                {
                    type: 1,
                    state: 0,
                }
            );
            key = code.key;
            organizationId = code.organizationId;
            app.mockService(
                'lessonOrganizationClassMember',
                'updateUserVipAndTLevel',
                () => 0
            );
        });
        it('001 ', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                {
                    key,
                    realname: '',
                    organizationId,
                },
                {
                    userId: 1,
                    username: '',
                }
            );
        });
        it('002 无效激活码', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                    {
                        key: 'key',
                        realname: '',
                        organizationId,
                    },
                    {
                        userId: 1,
                        username: '',
                    }
                );
            } catch (e) {
                assert(e.message === '无效激活码');
            }
        });

        it('003 加上家长手机号', async () => {
            const ctx = app.mockContext();

            await app.redis.set('verifCode:13590450686', '123456');
            await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                {
                    key,
                    realname: '',
                    organizationId,
                    parentPhoneNum: '13590450686',
                    verifCode: '123456',
                },
                {
                    userId: 1,
                    username: '',
                }
            );
            const member = await app.model.LessonOrganizationClassMember.findOne(
                { where: { memberId: 1 } }
            );
            assert(member.parentPhoneNum === '13590450686');
        });

        it('004 激活码与机构不匹配', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                    {
                        key,
                        realname: '',
                        organizationId: organizationId + 1,
                    },
                    {
                        userId: 1,
                        username: '',
                    }
                );
            } catch (e) {
                assert(e.message === '激活码不属于这个机构');
            }
        });

        it('005 无效机构', async () => {
            await app.model.LessonOrganization.update(
                { endDate: '2200-01-01' },
                { where: {} }
            );

            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                    {
                        key,
                        realname: '',
                        organizationId: organizationId,
                    },
                    {
                        userId: 1,
                        username: '',
                    }
                );
            } catch (e) {
                assert(e.message === '班级已经结束');
            }
        });

        it('006 激活码没有分配班级', async () => {
            await app.model.LessonOrganizationActivateCode.update(
                { classIds: [] },
                { where: {} }
            );

            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationActivateCode.useActivateCode(
                {
                    key,
                    realname: '',
                    organizationId: organizationId,
                },
                {
                    userId: 1,
                    username: '',
                }
            );
        });
    });

    describe('studentRecharge 学生续费', async () => {
        let student;
        let code;
        beforeEach(async () => {
            student = await app.factory.create(
                'LessonOrganizationClassMember',
                {
                    type: 2,
                    roleId: 1,
                    endTime: '2200-01-01',
                }
            );
            code = await app.factory.create('LessonOrganizationActivateCode', {
                type: 5,
                state: 0,
                organizationId: student.organizationId,
            });
        });
        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                {
                    key: code.key,
                    realname: '',
                },
                {
                    userId: student.memberId,
                    username: '',
                    organizationId: student.organizationId,
                }
            );
        });
        it('002 班级成员不存在', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                    {
                        key: code.key,
                        realname: '',
                    },
                    {
                        userId: 1,
                        username: '',
                        organizationId: student.organizationId,
                    }
                );
            } catch (e) {
                assert(e.message === '班级成员不存在');
            }
        });

        it('003 无效激活码', async () => {
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                    {
                        key: 'key',
                        realname: '',
                    },
                    {
                        userId: student.memberId,
                        username: '',
                        organizationId: student.organizationId,
                    }
                );
            } catch (e) {
                assert(e.message === '无效激活码');
            }
        });
        it('004 激活码不属于这个机构', async () => {
            await app.model.LessonOrganizationActivateCode.update(
                { organizationId: 999 },
                { where: {} }
            );
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                    {
                        key: code.key,
                        realname: '',
                    },
                    {
                        userId: student.memberId,
                        username: '',
                        organizationId: student.organizationId,
                    }
                );
            } catch (e) {
                assert(e.message === '激活码不属于这个机构');
            }
        });
        it('005 用的试用激活码 应该报错', async () => {
            await app.model.LessonOrganizationActivateCode.update(
                { type: 1 },
                { where: {} }
            );
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                    {
                        key: code.key,
                        realname: '',
                    },
                    {
                        userId: student.memberId,
                        username: '',
                        organizationId: student.organizationId,
                    }
                );
            } catch (e) {
                assert(e.message === '无效激活码');
            }
        });

        it('006 无效机构', async () => {
            await app.model.LessonOrganization.update(
                { endDate: '2009-01-01' },
                { where: {} }
            );
            const ctx = app.mockContext();
            try {
                await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                    {
                        key: code.key,
                        realname: '',
                    },
                    {
                        userId: student.memberId,
                        username: '',
                        organizationId: student.organizationId,
                    }
                );
            } catch (e) {
                assert(e.message === '机构不存在');
            }
        });

        it('007 激活码没有分配班级', async () => {
            await app.model.LessonOrganizationActivateCode.update(
                { classIds: [] },
                { where: {} }
            );
            const ctx = app.mockContext();

            await ctx.service.lessonOrganizationActivateCode.studentRecharge(
                {
                    key: code.key,
                    realname: '',
                },
                {
                    userId: student.memberId,
                    username: '',
                    organizationId: student.organizationId,
                }
            );
        });
    });

    describe('getUsedStatus 激活码使用情况', async () => {
        let student;
        let code;
        beforeEach(async () => {
            student = await app.factory.create(
                'LessonOrganizationClassMember',
                {
                    type: 2,
                    roleId: 1,
                    endTime: '2200-01-01',
                }
            );
            code = await app.factory.create('LessonOrganizationActivateCode', {
                type: 5,
                state: 0,
                organizationId: student.organizationId,
            });
        });

        it('001', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.lessonOrganizationActivateCode.getUsedStatus(
                student.organizationId
            );
            assert(
                ret.remainder.type5 === 9 &&
                    ret.remainder.type6 === 10 &&
                    ret.remainder.type7 === 10
            );
            assert(
                ret.used.type5 === 0 &&
                    ret.used.type6 === 0 &&
                    ret.used.type7 === 0
            );
        });
    });

    describe('setInvalid 设为无效', async () => {
        let student;
        let code;
        beforeEach(async () => {
            student = await app.factory.create(
                'LessonOrganizationClassMember',
                {
                    type: 2,
                    roleId: 1,
                    endTime: '2200-01-01',
                }
            );
            code = await app.factory.create('LessonOrganizationActivateCode', {
                type: 5,
                state: 0,
                organizationId: student.organizationId,
            });
        });

        it('001', async () => {
            const ctx = app.mockContext();
            await ctx.service.lessonOrganizationActivateCode.setInvalid([
                code.id,
            ]);
            const ret = await ctx.model.LessonOrganizationActivateCode.findOne({
                where: { id: code.id },
            });
            assert(ret.state === 2);
        });
    });
});
