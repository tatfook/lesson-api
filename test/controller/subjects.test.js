const { app, mock, assert } = require('egg-mock/bootstrap');

describe('/admins/subjects.test.js', () => {
    let token;
    beforeEach(async () => {
        token = await app.adminLogin().then(o => o.token);
    });

    describe('创建subjects', async () => {
        it('001', async () => {
            await app
                .httpRequest()
                .post('/admins/subject')
                .send({
                    subjectName: '数学',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });

    describe('获取subjects列表', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '数学' });
        });
        it('001', async () => {
            let list = await app
                .httpRequest()
                .get('/admins/subject')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(list.count === 1 && list.rows[0].subjectName === '数学');
        });
    });

    describe('获取subjects详情', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '数学' });
        });

        it('001', async () => {
            let sub = await app
                .httpRequest()
                .get('/admins/subject/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(sub.subjectName === '数学');
        });
    });

    describe('删除subject', async () => {
        beforeEach(async () => {
            await app.model.Subject.create({ subjectName: '数学' });
        });
        it('001', async () => {
            let sub = await app
                .httpRequest()
                .delete('/admins/subject/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const ret = await app.model.Subject.findOne({ where: { id: 1 } });
            assert(!ret);
        });
    });
});
