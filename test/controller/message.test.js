const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/message.test.js', () => {
    it('001 发送机构消息', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'createMsg', () => {
            return;
        });

        await app
            .httpRequest()
            .post('/messages')
            .send({
                msg: { type: 2, text: '纯文本消息' },
                userIds: [{ userId: 1, roleId: 1 }],
                sendSms: 0,
                sendClassIds: [1, 2],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);
    });

    it('002 发送机构消息 type错误 应该失败', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'createMsg', () => {
            return;
        });

        const ret = await app
            .httpRequest()
            .post('/messages')
            .send({
                msg: { type: 1, text: '纯文本消息' },
                userIds: [{ userId: 1, roleId: 1 }],
                sendSms: 0,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(ret.message === '消息类型错误');
    });

    it('003 发送机构消息 text错误 应该失败', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'createMsg', () => {
            return;
        });

        const ret = await app
            .httpRequest()
            .post('/messages')
            .send({
                msg: { type: 2, text: '' },
                userIds: [{ userId: 1, roleId: 1 }],
                sendSms: 0,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(ret.message === '消息内容长度错误');
    });

    it('004 发送机构消息 sendSms错误 应该失败', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'createMsg', () => {
            return;
        });

        const ret = await app
            .httpRequest()
            .post('/messages')
            .send({
                msg: { type: 2, text: '纯本文' },
                userIds: [{ userId: 1, roleId: 1 }],
                sendSms: 3,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(ret.message === '参数错误');
    });

    it('005 我发送的消息 || 机构所有管理员发送的消息', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'getMessages', () => {
            return { count: 1, rows: [{}] };
        });

        await app
            .httpRequest()
            .get('/messages?roleId=2')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);
    });

    it('006 我发送的消息 || 机构所有管理员发送的消息 权限错误 失败', async () => {
        const user = await app.login({ id: 1, roleId: 2 });
        const token = user.token;

        app.mockService('message', 'getMessages', () => {
            return { count: 1, rows: [{}] };
        });

        await app
            .httpRequest()
            .get('/messages?roleId=1')
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => res.body.data);
    });
});
