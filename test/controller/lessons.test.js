const { app, mock, assert } = require('egg-mock/bootstrap');
const md5 = require('blueimp-md5');

describe('test/controller/lessons.test.js', () => {
    before(async () => {
        const lessons = app.model.Lesson;
        const subjects = app.model.Subject;
        const skills = app.model.Skill;
        await lessons.truncate();
        await subjects.truncate();
        await skills.truncate();
        await app.model.Package.truncate();
        await app.model.LessonReward.truncate();
        await app.model.PackageLesson.truncate();
        await app.model.LessonContent.truncate();
        await app.model.User.truncate();

        const token = await app.login().then(o => o.token);
        assert.ok(token);

        await app
            .httpRequest()
            .get('/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        await subjects.create({
            subjectName: '前端',
        });
        await subjects.create({
            subjectName: '后端',
        });
        await skills.create({
            skillName: '唱歌',
        });
        await skills.create({
            skillName: '跳舞',
        });
    });

    it('POST|DELETE|PUT|GET /lessons', async () => {
        const token = await app.login().then(o => o.token);
        assert.ok(token);

        // 创建lesson
        let lesson = await app
            .httpRequest()
            .post('/lessons')
            .send({
                lessonName: 'HTML',
                subjectId: 1,
                skills: [{ id: 1, score: 10 }, { id: 2, score: 8 }],
                goals: '掌握基本的前端编程',
                coverUrl: 'http://www.baidu.com',
                vedioUrl: 'http://www.baidu.com',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        assert.equal(lesson.data.id, 1);

        // 获取全部lesson
        let data = await app
            .httpRequest()
            .get('/lessons')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert.equal(data.data.rows.length, 1);
        assert.equal(data.data.count, 1);

        const token2 = await app
            .login({ id: 2, username: 'user002' })
            .then(o => o.token);

        // 创建package
        await app
            .httpRequest()
            .post('/packages')
            .send({
                packageName: '前端',
                lessons: [1],
                subjectId: 1,
                minAge: 1,
                maxAge: 100,
                intro: '前端学习',
                rmb: 0,
                coin: 0,
                coverUrl: 'http://www.baidu.com',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        // 修改lesson
        await app
            .httpRequest()
            .put('/lessons/1')
            .send({ subjectId: 2 })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        // 获取指定lesson
        lesson = await app
            .httpRequest()
            .get('/lessons/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert.equal(lesson.data.subjectId, 2);

        // 获取指定lesson详情
        lesson = await app
            .httpRequest()
            .get('/lessons/1/detail')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        // console.log(lesson);
        assert.equal(lesson.data.packages.length, 1);

        await app
            .httpRequest()
            .delete('/lessons/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
