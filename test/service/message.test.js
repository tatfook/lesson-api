const { app, mock, assert } = require('egg-mock/bootstrap');
const axios = require('axios');

describe('test/service/message.test.js', () => {
    describe('getCellPhone', () => {
        it('001', async () => {
            const ctx = app.mockContext();

            mock(
                ctx.model.LessonOrganizationClassMember,
                'getMembersAndRoleId',
                () => {
                    return [];
                }
            );

            mock(ctx.model.LessonOrganizationClassMember, 'findAll', () => {
                return [
                    { parentPhoneNum: '13509450686' },
                    { parentPhoneNum: '13509450686' },
                ];
            });

            const list = await ctx.service.message.getCellPhone(
                1,
                [1],
                [{ userId: 1, roleId: 1 }]
            );

            assert(list.length === 1);
        });
    });

    describe('pushAndSendSms', () => {
        beforeEach('do mock', () => {
            const ctx = app.mockContext();
            mock(
                ctx.model.LessonOrganizationClassMember,
                'getUserIdsByOrganizationId',
                () => {
                    return [1, 2, 3, 4];
                }
            );
            mock(ctx.model.UserMessage, 'bulkCreate', () => 0);
            mock(ctx.helper, 'curl', () => {
                return {};
            });
            mock(ctx.model.LessonOrganization, 'findOne', () => {
                return { name: '机构名称' };
            });
            app.mockService('user', 'sendSms', () => true);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            mock(ctx.helper, 'curl', () => {
                return {};
            });

            await ctx.service.message.pushAndSendSms({
                sendSms: 0,
                userIds: [{ userId: 1 }],
            });
        });

        it('002', async () => {
            const ctx = app.mockContext();

            mock(ctx.helper, 'curl', () => {
                return {};
            });

            app.mockService('message', 'getCellPhone', () => {
                return ['13590450686'];
            });

            await ctx.service.message.pushAndSendSms({
                sendSms: 1,
                userIds: [{ userId: 1 }],
                msg: { text: '' },
            });
        });
    });

    describe('createMsg', () => {
        beforeEach('do mock', () => {
            const ctx = app.mockContext();

            mock(ctx.model.Message, 'create', () => {
                return { name: '机构名称' };
            });
            app.mockService('keepwork', 'getAllUserByCondition', () => {
                return [{ portrait: '' }];
            });
            app.mockService(
                'lessonOrganizationClassMember',
                'getByCondition',
                () => {
                    return { realname: '' };
                }
            );
            app.mockService('message', 'pushAndSendSms', () => 0);
        });

        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.message.createMsg(
                {
                    sendSms: 1,
                    msg: {
                        type: 3,
                        text: '纯本文',
                    },
                },
                { userId: 1, roleId: 2, organizationId: 1, username: '' },
                2
            );
        });

        it('002', async () => {
            const ctx = app.mockContext();

            try {
                await ctx.service.message.createMsg(
                    {
                        sendSms: 1,
                        msg: {
                            type: 3,
                            text: '纯本文',
                        },
                    },
                    { userId: 1, roleId: 1, organizationId: 1, username: '' },
                    2
                );
            } catch (e) {
                assert(e.message === '没有权限');
            }
        });
    });

    describe('getMessages', () => {
        beforeEach('do mock', () => {
            const ctx = app.mockContext();

            mock(ctx.model.Message, 'findAndCountAll', () => {
                return { rows: [{ id: 1 }], count: 1 };
            });
            mock(ctx.model.UserMessage, 'getClassNamesByMsgId', () => {
                return [{ msgId: 1, sendTo: '这些班级,那些班级' }];
            });
            app.mockService('keepwork', 'getAllUserByCondition', () => {
                return [{ portrait: '' }];
            });
            app.mockService(
                'lessonOrganizationClassMember',
                'getByCondition',
                () => {
                    return { realname: '' };
                }
            );
            app.mockService('message', 'pushAndSendSms', () => 0);
        });

        it('001 admin消息', async () => {
            const ctx = app.mockContext();

            mock(ctx.model.LessonOrganizationClassMember, 'findAll', () => {
                return [{ memberId: 1 }];
            });

            const ret = await ctx.service.message.getMessages(null, 1, 64, 1);
            assert(
                ret.count === 1 &&
                    ret.rows[0].id === 1 &&
                    ret.rows[0].sendTo === '这些班级,那些班级'
            );
        });
        it('002 teacher消息', async () => {
            const ctx = app.mockContext();

            const ret = await ctx.service.message.getMessages(null, 1, 2, 1);
            assert(
                ret.count === 1 &&
                    ret.rows[0].id === 1 &&
                    ret.rows[0].sendTo === '这些班级,那些班级'
            );
        });
    });

    describe('createRegisterMsg', () => {
        beforeEach('do mock', () => {
            const ctx = app.mockContext();

            mock(ctx.model.Message, 'create', () => {
                return {
                    then: () => {
                        return { id: 1 };
                    },
                };
            });
            mock(ctx.model.UserMessage, 'create', () => {
                return {
                    then: () => {
                        return { id: 1 };
                    },
                };
            });
        });

        it('001', async () => {
            const ctx = app.mockContext();

            await ctx.service.message.createRegisterMsg({
                id: 1,
                username: 'jack',
            });
        });
    });
});
