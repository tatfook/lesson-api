const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/users.test.js', () => {
    let token;
    beforeEach(async () => {
        token = await app.login().then(o => o.token);
    });

    describe('获取当前用户', async () => {
        beforeEach(async () => {
            app.mockService('keepwork', 'getAccountsAndRoles', () => [
                {},
                {},
                {},
            ]);
        });
        it('001', async () => {
            const data = await app
                .httpRequest()
                .get('/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(data.username === 'user0001');
        });
    });

    describe('获取当前用户信息', async () => {
        beforeEach(async () => {
            app.mockService('keepwork', 'getAccountsAndRoles', () => [
                {},
                {},
                {},
            ]);
        });
        it('001', async () => {
            const data = await app
                .httpRequest()
                .get('/users/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(data.username === '');
        });
    });

    describe('创建用户,token里面的id和username', async () => {
        it('001', async () => {
            const data = await app
                .httpRequest()
                .post('/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);

            assert(data.username === 'user0001');
        });
    });

    describe('更新用户', async () => {
        beforeEach(async () => {
            await app
                .httpRequest()
                .post('/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put('/users/1')
                .send({
                    nickname: 'nickname',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);

            const user = await app.model.User.findOne({ where: { id: 1 } });
            assert(user.nickname === 'nickname');
        });
    });
});
