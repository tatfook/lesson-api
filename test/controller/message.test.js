const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/message.test.js', () => {
	before(async () => {
		await app.model.Message.truncate();
		await app.model.UserMessage.truncate();
		await app.model.Log.truncate();
	});

	it('001 发送机构消息', async () => {
		const user = await app.login({ id: 1, roleId: 2 });
		const token = user.token;

		const ret = await app
			.httpRequest()
			.post('/messages')
			.send({
				msg: { type: 3, text: '纯文本消息' },
				userIds: [{ userId: 1, roleId: 1 }],
				sendSms: 0
			})
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);

	});
});
