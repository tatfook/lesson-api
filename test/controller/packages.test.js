const { app, mock, assert } = require('egg-mock/bootstrap');
const md5 = require('blueimp-md5');

describe('test/controller/packages.test.js', () => {
    let token;
    beforeEach(async () => {
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

        token = await app.login().then(o => o.token);
    });

    describe('创建课程包', async () => {
        it('001', async () => {
            const lesson = await app
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
                .then(res => res.body.data);
            assert.equal(lesson.id, 1);
        });
    });

    describe('搜索课程包', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });
        it('001', async () => {
            const pkg = await app
                .httpRequest()
                .get('/packages/search?state=0')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(pkg.count === 1);
        });
        it('002', async () => {
            const pkg = await app
                .httpRequest()
                .get('/packages/search?state=1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(pkg.count === 0);
        });
    });

    describe('课程包列表', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });
        it('001', async () => {
            const pkg = await app
                .httpRequest()
                .get('/packages')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(pkg.count === 1 && pkg.rows[0].packageName === '哈哈');
        });
        it('002', async () => {
            const token = await app.login({ id: 2 }).then(o => o.token);
            const pkg = await app
                .httpRequest()
                .get('/packages')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(pkg.count === 0);
        });
    });

    describe('获取课程包详情', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });
        it('001', async () => {
            const pkg = await app
                .httpRequest()
                .get('/packages/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            assert(pkg.packageName === '哈哈');
        });
    });

    describe('更新课程包', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });
        it('001', async () => {
            const pkg = await app
                .httpRequest()
                .put('/packages/1')
                .send({
                    packageName: '嘿嘿',
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(res => res.body.data);

            const p = await app.model.Package.findOne({
                where: {
                    id: 1,
                },
            });

            assert(p.packageName === '嘿嘿');
        });
    });

    describe('删除课程包', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });

        it('001', async () => {
            await app
                .httpRequest()
                .delete('/packages/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const ret = await app.model.Package.findOne({
                where: { id: 1 },
            });
            assert(!ret);
        });
    });

    describe('课程包审核', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .post('/packages/1/audit')
                .send({
                    state: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const pkg = await app.model.Package.findOne({ where: { id: 1 } });
            assert(pkg.state === 1);
        });
        it('002', async () => {
            await app
                .httpRequest()
                .post('/packages/999/audit')
                .send({
                    state: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });
    });

    describe('按热度获取课程包', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.PackageSort.create({
                packageId: 1,
                hotNo: 1,
            });
            await app.model.Package.create({
                packageName: '嘿嘿',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.PackageSort.create({
                packageId: 2,
                hotNo: 2,
            });
        });
        it('001', async () => {
            const list = await app
                .httpRequest()
                .get('/packages/hots')
                .send({
                    state: 1,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(list[0].packageName === '嘿嘿');
            assert(list[1].packageName === '哈哈');
        });
    });

    describe('获取课程列表', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.Lesson.create({
                lessonName: '课程名字',
                userId: 1,
            });
            await app.model.PackageLesson.create({
                packageId: 1,
                lessonId: 1,
                userId: 1,
            });
        });
        it('001', async () => {
            const list = await app
                .httpRequest()
                .get('/packages/1/lessons')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);
            assert(list.length === 1 && list[0].lessonName === '课程名字');
        });
    });

    describe('添加课程', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.Lesson.create({
                lessonName: '课程名字',
                userId: 1,
            });
        });

        it('001', async () => {
            await app
                .httpRequest()
                .post('/packages/1/lessons')
                .send({ lessonId: 1 })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);

            const pl = await app.model.PackageLesson.findOne({
                where: {
                    packageId: 1,
                    lessonId: 1,
                    userId: 1,
                },
            });

            assert(pl);
        });
    });

    describe('修改课程', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.Lesson.create({
                lessonName: '课程名字',
                userId: 1,
            });
            await app.model.PackageLesson.create({
                packageId: 1,
                lessonId: 1,
                userId: 1,
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put('/packages/1/lessons')
                .send({
                    lessonId: 1,
                    lessonNo: 2,
                })
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);

            const pl = await app.model.PackageLesson.findOne({
                where: {
                    lessonId: 1,
                    packageId: 1,
                    userId: 1,
                },
            });
            assert(pl.lessonNo === 2);
        });
    });

    describe('删除课程', async () => {
        beforeEach(async () => {
            await app.model.Package.create({
                packageName: '哈哈',
                userId: 1,
                auditAt: '2200-10-01',
            });
            await app.model.Lesson.create({
                lessonName: '课程名字',
                userId: 1,
            });
            await app.model.PackageLesson.create({
                packageId: 1,
                lessonId: 1,
                userId: 1,
            });
        });

        it('001', async () => {
            await app
                .httpRequest()
                .delete('/packages/1/lessons?lessonId=1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(o => o.body.data);

            const pl = await app.model.PackageLesson.findOne({
                where: {
                    lessonId: 1,
                    packageId: 1,
                    userId: 1,
                },
            });
            assert(!pl);
        });
    });
});
