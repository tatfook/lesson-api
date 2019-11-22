const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/message.test.js', () => {
	before(async () => {
		await app.model.Message.truncate();
		await app.model.UserMessage.truncate();
		await app.model.Log.truncate();
	});

	it('001 发送消息', async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app
			.httpRequest()
			.post('/messages')
			.send({
				name: '这是名字',
				type: 1,
				classId: 1,
			})
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);

		assert(report.id === 1);
	});
});
