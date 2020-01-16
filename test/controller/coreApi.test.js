const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/coreApi.test.js', async () => {
    describe('createRegisterMsg', async () => {
        it('001', async () => {
            await app
                .httpRequest()
                .post('/coreApi/registerMsg')
                .set('x-api-key', 'key')
                .send({
                    user: { id: 1, username: 'qzb' },
                })
                .expect(200);

            const ret = await app.model.Message.findOne({ where: {} });
            assert(ret.msg.type === 1 && ret.msg.user.id === 1);
        });
        it('002 key错误', async () => {
            const ret = await app
                .httpRequest()
                .post('/coreApi/registerMsg')
                .set('x-api-key', 'keyy')
                .send({
                    user: { id: 1, username: 'qzb' },
                })
                .expect(400);
        });
    });

    describe('createUser', async () => {
        it('001', async () => {
            await app
                .httpRequest()
                .post('/coreApi/user')
                .set('x-api-key', 'key')
                .send({
                    id: 1,
                    username: 'qzb',
                })
                .expect(200);

            const ret = await app.model.User.findOne({ where: { id: 1 } });
            assert(ret);
        });
    });

    describe('getPackagesAndLessonCount', async () => {
        beforeEach(async () => {
            await app.factory.createMany('Package', 3);
        });
        it('001', async () => {
            await app
                .httpRequest()
                .get('/coreApi/packages?packageId=1,2,3')
                .set('x-api-key', 'key')
                .expect(200);
        });
    });
});
