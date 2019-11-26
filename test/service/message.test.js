const { app, mock, assert } = require('egg-mock/bootstrap');
const axios = require('axios');

describe('test/service/message.test.js', () => {

	describe('getCellPhone', () => {
		it('001', async () => {
			const ctx = app.mockContext();

			mock(ctx.model.LessonOrganizationClassMember,
				'getMembersAndRoleId', () => {
					return []
				});

			mock(ctx.model.LessonOrganizationClassMember,
				'findAll', () => {
					return [
						{ parentPhoneNum: '13509450686' },
						{ parentPhoneNum: '13509450686' }
					]
				});

			const list = await ctx
				.service
				.message
				.getCellPhone(1, [1], [{ userId: 1, roleId: 1 }]);

			assert(list.length === 1);
		});
	});

	describe('pushAndSendSms', () => {

		beforeEach('do mock', () => {
			const ctx = app.mockContext();
			mock(ctx.model.LessonOrganizationClassMember,
				'getUserIdsByOrganizationId', () => {
					return [1, 2, 3, 4]
				});
			mock(ctx.model.UserMessage, 'bulkCreate', () => 0);
			mock(ctx.helper, 'curl', () => {
				return {}
			});
			mock(ctx.model.LessonOrganization, 'findOne', () => { return { name: '机构名称' } });
			app.mockService('user', 'sendSms', () => true);
		});

		it('001', async () => {
			const ctx = app.mockContext();

			mock(ctx.helper, 'curl', () => {
				return {}
			});

			await ctx.service.message.pushAndSendSms({ sendSms: 0, userIds: [{ userId: 1 }] })
		});

		it('002', async () => {
			const ctx = app.mockContext();

			mock(ctx.helper, 'curl', () => {
				return {}
			});

			app.mockService('message', 'getCellPhone', () => {
				return ['13590450686']
			});

			await ctx.service.message.pushAndSendSms({
				sendSms: 1,
				userIds: [{ userId: 1 }],
				msg: { text: '' }
			})
		});
	});

	describe('createMsg', () => {
		it('001', async () => {

		});
	});
});
