const { app, mock, assert } = require('egg-mock/bootstrap');

describe('/admins/skills', () => {
    let token;
    before(async () => {
        token = await app.adminLogin().then(o => o.token);
    });

    describe('创建skill', async () => {
        it('001', async () => {
            const skill = await app
                .httpRequest()
                .post('/admins/skill')
                .send({
                    skillName: '唱歌',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(skill.skillName === '唱歌');
        });
    });

    describe('获取skills列表', async () => {
        beforeEach(async () => {
            await app.model.Skill.create({ skillName: '唱歌' });
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .get('/admins/skill')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(ret.rows[0].skillName === '唱歌');
        });
    });

    describe('更新skill', async () => {
        beforeEach(async () => {
            await app.model.Skill.create({ skillName: '唱歌' });
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .put('/admins/skill/1')
                .send({
                    skillName: '唱歌2',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            const skill = await app.model.Skill.findOne({ where: { id: 1 } });
            assert(skill.skillName === '唱歌2');
        });
    });

    describe('删除skill', async () => {
        beforeEach(async () => {
            await app.model.Skill.create({ skillName: '唱歌' });
        });

        it('001', async () => {
            const ret = await app
                .httpRequest()
                .delete('/admins/skill/1')
                .send({
                    skillName: '唱歌2',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            const skill = await app.model.Skill.findOne({ where: { id: 1 } });
            assert(!skill);
        });
    });
});
