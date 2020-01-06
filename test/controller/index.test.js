const { app } = require('egg-mock/bootstrap');

describe('test/controller/index.test.js', () => {
    before(async () => {
        await app.factory.create('User');
    });
    it('should status 200', async () => {
        await app
            .httpRequest()
            .get('/index')
            .expect(200);
    });
});
