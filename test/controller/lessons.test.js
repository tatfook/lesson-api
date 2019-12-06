const { app, mock, assert } = require('egg-mock/bootstrap');
const md5 = require('blueimp-md5');

describe('test/controller/lessons.test.js', () => {
    let token;
    before(async () => {
        token = await app.login().then(o => o.token);

        await app.model.Subject.create({
            subjectName: '前端',
        });
        await app.model.Subject.create({
            subjectName: '后端',
        });
        await app.model.Skill.create({
            skillName: '唱歌',
        });
        await app.model.Skill.create({
            skillName: '跳舞',
        });
    });

    describe('获取自己创建的课程列表', async () => {
        beforeEach(async () => {
            await app.factory.create('Lesson', { userId: 1 });
        });
        it('001', async () => {
            let data = await app
                .httpRequest()
                .get('/lessons')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert.equal(data.rows.length, 1);
            assert.equal(data.count, 1);
        });
        it('002', async () => {
            const token = await app.login({ id: 2 }).then(o => o.token);
            let data = await app
                .httpRequest()
                .get('/lessons')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert.equal(data.rows.length, 0);
            assert.equal(data.count, 0);
        });
    });

    describe('获取课程详情', async () => {
        let lessonName;
        beforeEach(async () => {
            const l = await app.factory.create('Lesson', { userId: 1 });
            lessonName = l.lessonName;
        });
        it('001', async () => {
            let data = await app
                .httpRequest()
                .get('/lessons/1/detail')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(data.lessonName === lessonName
                && data.packages.length === 0);
        });
        it('002 id错误', async () => {
            await app
                .httpRequest()
                .get('/lessons/2/detail')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });
    });

    describe('通过url找到lesson', async () => {
        beforeEach(async () => {
            await app.factory.create('Lesson', { userId: 1, url: '/this' });
        });
        it('001', async () => {
            let data = await app
                .httpRequest()
                .get('/lessons/detail?url=/this')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);
            assert(data.url === '/this');
        });
        it('002', async () => {
            await app
                .httpRequest()
                .get('/lessons/detail?url=this')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });
    });

    describe('获取lesson详情', async () => {
        beforeEach(async () => {
            await app.factory.create('Lesson', { userId: 1, lessonName: 'lesson名字' });
        });
        it('001', async () => {
            const lesson = await app
                .httpRequest()
                .get('/lessons/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(lesson.lessonName === 'lesson名字');
        });
        it('002', async () => {
            const lesson = await app
                .httpRequest()
                .get('/lessons/2')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(!lesson);
        });
        it('003', async () => {
            await app
                .httpRequest()
                .get('/lessons/a')
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(o => o.body.data);
        });
    });

    describe('创建lesson', async () => {
        it('001', async () => {
            const lesson = await app
                .httpRequest()
                .post('/lessons')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    lessonName: '创建的lesson',
                    url: '/this'
                })
                .expect(200)
                .then(o => o.body.data);
            assert(lesson.lessonName === '创建的lesson');
        });
    });

    describe('更新lesson', async () => {
        let less;
        beforeEach(async () => {
            less = await app.factory.create('Lesson', { userId: 1 });
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .put(`/lessons/${less.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    lessonName: '更新的lesson'
                })
                .expect(200)
                .then(o => o.body.data);
            assert(ret[0] === less.id);
        });
    });

    describe('删除lesson', async () => {
        let less;
        beforeEach(async () => {
            less = await app.factory.create('Lesson', { userId: 1 });
        });
        it('001', async () => {
            const ret = await app
                .httpRequest()
                .delete(`/lessons/${less.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(ret === 'OK');
            let list = await app.model.Lesson.findAll();
            assert(list.length === 0);
        });
        it('002 实际没有删除', async () => {
            const token = await app.login({ id: 2 }).then(o => o.token);
            const ret = await app
                .httpRequest()
                .delete(`/lessons/${less.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(ret === 'OK');
            let list = await app.model.Lesson.findAll();
            assert(list.length === 1);
        });
    });

    describe('发布课程', async () => {
        let less;
        beforeEach(async () => {
            less = await app.factory.create('Lesson', { userId: 1 });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .post(`/lessons/a/contents`)
                .set('Authorization', `Bearer ${token}`)
                .expect(400)
                .then(o => o.body.data);
        });
        it('002', async () => {
            await app
                .httpRequest()
                .post(`/lessons/999/contents`)
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });
        it('003', async () => {
            await app
                .httpRequest()
                .post(`/lessons/${less.id}/contents`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: '发布的内容'
                })
                .expect(200);
            const contents = await app.model.LessonContent.findAll();
            assert(contents.length === 1);
            assert(contents[0].content === '发布的内容');
            assert(contents[0].version === 1)
        });
    });

    describe('获取lesson的某个版本', async () => {
        let less;
        beforeEach(async () => {
            less = await app.factory.create('Lesson', { userId: 1 });
            await app.model.LessonContent.create({
                userId: 1,
                lessonId: less.id,
                content: '发布的内容1',
                version: 1
            });
            await app.model.LessonContent.create({
                userId: 1,
                lessonId: less.id,
                content: '发布的内容2',
                version: 2
            });
        });
        it('001', async () => {
            const con = await app
                .httpRequest()
                .get(`/lessons/${less.id}/contents?version=1`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(con.content === '发布的内容1');
        });
        it('002', async () => {
            const con = await app
                .httpRequest()
                .get(`/lessons/${less.id}/contents?version=2`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(con.content === '发布的内容2');
        });
        it('003', async () => {
            const con = await app
                .httpRequest()
                .get(`/lessons/${less.id}/contents?version=3`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(!con.id);
        });
    });
});
