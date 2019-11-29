const { app, assert } = require('egg-mock/bootstrap');

describe('test/model/message.test.js', () => {
	let userId;

	before(async () => {
		const user = await app.factory.create('User');
		userId = user.id;

		await app.factory.create('Message', { all: 1, createdAt: '2090-10-01' });
	});
	describe('mergeMessage', async () => {
		it('001', async () => {
			await app.model.Message.mergeMessage(userId);

			const list = await app.model.UserMessage.findAll({ where: { userId } });
			assert(list.length === 1);
		});

		it('002', async () => {

			const user = await app.factory.create('User');
			userId = user.id;

			await app.factory.create('Message', { all: 1, createdAt: '2008-10-01' });

			await app.model.Message.mergeMessage(userId);

			const list = await app.model.UserMessage.findAll({ where: { userId } });
			assert(list.length === 0);
		});
	})
});
