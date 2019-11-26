const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/userMessage.test.js', () => {
	it('001 我的消息列表', async () => {
		const user = await app.login({ id: 1, roleId: 1 });
		const token = user.token;

		app.mockService('userMessage', 'getMyMessages', () => {
			return {};
		});

		await app
			.httpRequest()
			.get('/userMessages')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);
	});

	it('002 设置本人某些消息【当前页】已读', async () => {
		const user = await app.login({ id: 1, roleId: 1 });
		const token = user.token;

		app.mockService('userMessage', 'updateByCondition', () => {
			return;
		});

		await app
			.httpRequest()
			.put('/userMessages/status')
			.send({ ids: [1] })
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);
	});

	it('003 设置本人某些消息【当前页】已读 id空 应该失败', async () => {
		const user = await app.login({ id: 1, roleId: 1 });
		const token = user.token;

		app.mockService('userMessage', 'updateByCondition', () => {
			return;
		});

		await app
			.httpRequest()
			.put('/userMessages/status')
			.send({ ids: [] })
			.set('Authorization', `Bearer ${token}`)
			.expect(400)
			.then(res => res.body.data);
	});

	it('004 各个机构和系统的未读消息数', async () => {
		const user = await app.login({ id: 1, roleId: 1 });
		const token = user.token;

		app.mockService('userMessage', 'getUnReadCount', () => {
			return;
		});

		await app
			.httpRequest()
			.get('/userMessages/unReadCount')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);
	});

	it('005 获取某个消息在列表中的位置', async () => {
		const user = await app.login({ id: 1, roleId: 1 });
		const token = user.token;

		app.mockService('userMessage', 'getIndexOfMessage', () => {
			return;
		});

		await app
			.httpRequest()
			.get('/userMessages/indexOfMessage?id=1&organizationId=1')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.then(res => res.body.data);
	});

});