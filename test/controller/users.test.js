const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/users.test.js', () => {
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

        let lesson = await app
            .httpRequest()
            .post('/lessons')
            .send({
                lessonName: 'HTML',
                subjectId: 1,
                skills: [
                    { id: 1, score: 10 },
                    { id: 2, score: 8 },
                ],
                goals: '掌握基本的前端编程',
                coverUrl: 'http://www.baidu.com',
                vedioUrl: 'http://www.baidu.com',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
        assert.equal(lesson.data.id, 1);

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
                rmb: 20,
                coin: 200,
                coverUrl: 'http://www.baidu.com',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
    });

    it('GET|PUT /users/1', async () => {
        const token = await app.login().then(o => o.token);
        assert.ok(token);

        await app
            .httpRequest()
            .put('/users/1')
            .send({ nickname: 'xiaoyao', username: 'test' })
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        let user = await app
            .httpRequest()
            .get('/users/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        assert.equal(user.data.nickname, 'xiaoyao');

        user = await app
            .httpRequest()
            .get('/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);

        assert(user.data.id);
    });
});
