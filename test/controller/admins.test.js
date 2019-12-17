const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/admins.test.js', () => {
    let token;
    beforeEach(async () => {
        await app.factory.create('User', { username: 'test' });
        token = await app.adminLogin().then(o => o.token);
    });

    describe('执行select语句', async () => {
        it('001 正确示范', async () => {
            const users = await app
                .httpRequest()
                .post('/admins/query')
                .send({ sql: 'select * from users' })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(users.length === 1);
        });

        it('002 带分号不行', async () => {
            const users = await app
                .httpRequest()
                .post('/admins/query')
                .send({ sql: 'select * from users;' })
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(res => JSON.parse(res.text));
            assert(users.message === 'SQL不合法');
        });

        it('003 其他非select语句不行', async () => {
            const users = await app
                .httpRequest()
                .post('/admins/query')
                .send({ sql: 'delete from users' })
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(res => JSON.parse(res.text));
            assert(users.message === 'SQL不合法');
        });
    });

    describe('查询某个表', async () => {
        it('001 正确示范', async () => {
            const users = await app
                .httpRequest()
                .post('/admins/user/query')
                .send({ where: { id: { $gt: 0 } } })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(users.count === 1);
        });

        it('002 model不存在', async () => {
            await app
                .httpRequest()
                .post('/admins/abc/query')
                .send({ where: { id: { $gt: 0 } } })
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(res => res.body.data);
        });
    });

    describe('更新user的vip和t等级', async () => {
        before(async () => {
            await app.factory.create('LessonOrganizationClassMember');
            app.mockService('keepwork', 'updateUser', () => 0);
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .get('/admins/task/once/vipTLevelUpdate')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret);
        });
    });

    describe('search接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .post('/admins/user/search')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret);
        });
    });

    describe('index接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .get('/admins/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret.count === 1 && ret.rows[0].username === 'test');
        });
    });

    describe('show接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .get('/admins/user/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret.username === 'test');
        });
    });

    describe('create接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .post('/admins/user')
                .send({
                    username: 'test2',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret.username === 'test2');
        });
    });

    describe('bulkCreate接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .post('/admins/user/bulk')
                .send({
                    datas: [{ username: 'abc' }],
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(ret.length === 1 && ret[0].username === 'abc');
        });
    });

    describe('update接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .put('/admins/user/1')
                .send({
                    username: 'abc',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(ret.length === 1);
        });
    });

    describe('destroy接口', async () => {
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .delete('/admins/user/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(ret === 1);
        });
    });
});
