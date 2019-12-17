const { app, assert } = require('egg-mock/bootstrap');

describe('test/controller/evaluationReport.test.js', () => {
    beforeEach(async () => {
        await app.redis.flushdb();

        const org = await app.factory.create('LessonOrganization', {
            name: '什么机构',
        });
        const cls1 = await app.factory.create('LessonOrganizationClass', {
            organizationId: org.id,
            name: '什么班级',
            end: '2029-10-21 00:00:00',
        });
        const cls2 = await app.factory.create('LessonOrganizationClass', {
            organizationId: org.id,
            name: '什么班级2',
            end: '2029-10-21 00:00:00',
        });
        await app.factory.create('LessonOrganizationClassMember', {
            organizationId: org.id,
            classId: cls1.id,
            memberId: 1,
            roleId: 2,
            realname: '什么老师',
        });
        await app.factory.create('LessonOrganizationClassMember', {
            organizationId: org.id,
            classId: cls1.id,
            memberId: 2,
            roleId: 1,
            realname: '什么学生',
        });
        await app.factory.create('LessonOrganizationClassMember', {
            organizationId: org.id,
            classId: cls1.id,
            memberId: 3,
            roleId: 64,
            realname: '什么管理员',
        });
        await app.factory.create('LessonOrganizationClassMember', {
            organizationId: org.id,
            classId: cls1.id,
            memberId: 4,
            roleId: 1,
            realname: '什么学生2',
        });
        await app.factory.create('LessonOrganizationClassMember', {
            organizationId: org.id,
            classId: cls2.id,
            memberId: 5,
            roleId: 1,
            realname: '什么学生3',
        });
    });

    it('001 发起点评 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post('/evaluationReports')
            .send({
                name: '这是名字',
                type: 1,
                classId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.id === 1);
    });

    it('002 发起点评 学生身份调用接口，应该返回403', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        await app
            .httpRequest()
            .post('/evaluationReports')
            .send({
                name: '这是名字',
                type: 1,
                classId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('003 发起点评 name参数错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post('/evaluationReports')
            .send({
                name: '',
                type: 1,
                classId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告名称长度错误');
    });

    it('004 发起点评 type参数错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post('/evaluationReports')
            .send({
                name: '这是名字',
                type: 3,
                classId: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告类型错误');
    });

    it('005 发起点评 classId参数错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post('/evaluationReports')
            .send({
                name: '这是名字',
                type: 1,
                classId: 0,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '班级id错误');
    });

    it('006 获取发起的点评列表 应该拿到一个记录', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '随便啊',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports?classId=1&roleId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].id === 1);
    });

    it('007 获取发起的点评列表 班级id传错 应该返回空数组', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .get(`/evaluationReports?classId=2&roleId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 0);
    });

    it('008 获取发起的点评列表 参数classId传错 应该返回400', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        await app
            .httpRequest()
            .get(`/evaluationReports?classId=0&roleId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => res.body.data);
    });

    it('009 获取发起的点评列表 加name筛选1', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这里',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(
                `/evaluationReports?classId=1&roleId=2&name=${encodeURI('这')}`
            )
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].id === 1);
    });

    it('010 获取发起的点评列表 加name筛选2', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(
                `/evaluationReports?classId=1&roleId=2&name=${encodeURI('是')}`
            )
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].id === 1);
    });

    it('011 获取发起的点评列表 加type筛选1', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports?classId=1&roleId=2&type=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].id === 1);
    });

    it('012 获取发起的点评列表 加type筛选2', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports?classId=1&roleId=2&type=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 0);
    });

    it('013 点评学生 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 2,
                reportId: rep.id,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.id === 1);
    });

    it('014 点评学生 重复点评应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 2,
                reportId: rep.id,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 2,
                reportId: rep.id,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '你已经点评过这个学生啦');
    });

    it('015 点评学生 点评的学生不在这个班级 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 5,
                reportId: 1,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));

        assert(report.message === '用户在这个班级没有学生身份');
    });

    it('016 点评学生 不是自己发起的点评 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 5,
                reportId: 1,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));

        assert(report.message === '没有权限');
    });

    it('017 点评学生 参数studentId错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 0,
                reportId: 1,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '用户id错误');
    });

    it('018 点评学生 参数reportId错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 1,
                reportId: 0,
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告id错误');
    });

    it('019 点评学生 参数star错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 1,
                reportId: 1,
                star: 6,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '你还不错',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '评星数量错误');
    });

    it('020 点评学生 参数comment错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 1,
                reportId: 1,
                star: 1,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '文字评价长度错误');
    });

    it('021 点评学生 参数mediaUrl错误', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .post(`/evaluationReports/userReport`)
            .send({
                studentId: 1,
                reportId: 1,
                star: 1,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '这是comment',
                mediaUrl: {},
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '媒体文件路径格式错误');
    });

    it('022 点评详情列表1', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/1?status=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1);
    });

    it('023 点评详情列表2', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/${rep.id}?status=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].isSend === 0);
    });

    it('024 点评详情列表 不是自己发起的点评 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/1?status=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));

        assert(report.message === '没有权限');
    });

    it('025 点评详情列表 id传一个不存在的 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/2?status=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告id错误');
    });

    it('026 点评详情列表 已点评，筛选未发送的', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/${rep.id}?status=2&isSend=0`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1 && report[0].isSend === 0);
    });

    it('027 点评详情列表 已点评，筛选已发送的', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/${rep.id}?status=2&isSend=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 0);
    });

    it('028 点评详情列表 已点评，筛选名字', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(
                `/evaluationReports/${rep.id}?status=2&realname=${encodeURI(
                    '学'
                )}`
            )
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report.length === 1);
    });

    it('029 删除发起的点评 不是自己发起的，应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));

        assert(report.message === '没有权限');
    });

    it('030 删除发起的点评 id填一个不存在的，应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告id错误');
    });

    it('031 删除发起的点评 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(report === 'OK');

        const [repo, userReport] = await Promise.all([
            app.model.EvaluationReport.findAll(),
            app.model.EvaluationUserReport.findAll(),
        ]);

        assert(repo.length === 0 && userReport.length === 0);
    });

    it('032 修改发起的点评 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        await app
            .httpRequest()
            .put(`/evaluationReports/1`)
            .send({
                name: '这个名字修改了',
                type: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const report = await app
            .httpRequest()
            .get(`/evaluationReports?classId=1&roleId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(
            report.length === 1 &&
                report[0].reportName === '这个名字修改了' &&
                report[0].type === 1
        );
    });

    it('033 修改发起的点评 不是自己发起的点评，应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/1`)
            .send({
                name: '这个名字再修改',
                type: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));
        assert(report.message === '没有权限');
    });

    it('034 修改发起的点评 传一个不存在的id，应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/2`)
            .send({
                name: '这个名字再修改',
                type: 1,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(report.message === '报告id错误');
    });

    it('035 删除对学生的点评 不是自己写的点评 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/userReport/1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));
        assert(report.message === '没有权限');
    });

    it('036 删除对学生的点评 传一个不存在的id 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/userReport/2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));
        assert(report.message === '没有权限');
    });

    it('037 删除对学生的点评 应该成功 之后恢复数据', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 1,
            spatial: 1,
            collaborative: 1,
            creative: 1,
            logical: 1,
            compute: 1,
            coordinate: 1,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .delete(`/evaluationReports/userReport/1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);
        assert(report === 'OK');
    });

    it('038 学生获得的点评详情 studentId传错 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/userReport/2?studentId=0&classId=1&type=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '用户id错误');
    });

    it('039 学生获得的点评详情 classId传错 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/userReport/2?studentId=2&classId=0&type=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '班级id错误');
    });

    it('040 学生获得的点评详情 type传错 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/userReport/2?studentId=2&classId=1&type=3`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(report.message === '报告类型错误');
    });

    it('041 学生获得的点评详情 小评', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        app.mockService('evaluationReport', 'getUserReportAndOrgInfo', () => {
            return {
                star: 3,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
            };
        });

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 1,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(`/evaluationReports/userReport/2?studentId=2&classId=1&type=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(
            report.userRepo.star === 3 &&
                report.userRepo.spatial === 4 &&
                report.userRepo.collaborative === 3 &&
                report.userRepo.creative === 3 &&
                report.userRepo.logical === 5 &&
                report.userRepo.compute === 2 &&
                report.userRepo.coordinate === 3
        );

        assert(
            report.classmatesAvgStar.starAvg === '4.00' &&
                report.classmatesAvgStar.spatialAvg === '4.00' &&
                report.classmatesAvgStar.collaborativeAvg === '3.00' &&
                report.classmatesAvgStar.creativeAvg === '3.00' &&
                report.classmatesAvgStar.logicalAvg === '5.00' &&
                report.classmatesAvgStar.computeAvg === '2.00' &&
                report.classmatesAvgStar.coordinateAvg === '3.00'
        );
    });

    it('042 学生获得的点评详情 阶段点评', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        app.mockService('evaluationReport', 'getUserReportAndOrgInfo', () => {
            return {
                star: 5,
                spatial: 4,
                collaborative: 3,
                creative: 3,
                logical: 5,
                compute: 2,
                coordinate: 3,
            };
        });

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        const userRepo = await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .get(
                `/evaluationReports/userReport/${userRepo.id}?studentId=2&classId=1&type=2`
            )
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        // 本次能力值情况和班级平均值
        assert(
            report.userRepo.star === 5 &&
                report.userRepo.spatial === 4 &&
                report.userRepo.collaborative === 3 &&
                report.userRepo.creative === 3 &&
                report.userRepo.logical === 5 &&
                report.userRepo.compute === 2 &&
                report.userRepo.coordinate === 3
        );

        assert(
            report.classmatesAvgStar.starAvg === '4.00' &&
                report.classmatesAvgStar.spatialAvg === '4.00' &&
                report.classmatesAvgStar.collaborativeAvg === '3.00' &&
                report.classmatesAvgStar.creativeAvg === '3.00' &&
                report.classmatesAvgStar.logicalAvg === '5.00' &&
                report.classmatesAvgStar.computeAvg === '2.00' &&
                report.classmatesAvgStar.coordinateAvg === '3.00'
        );

        const userHistoryStar = report.growthTrack.userHistoryStar;
        const classmatesHistoryAvgStar =
            report.growthTrack.classmatesHistoryAvgStar2;

        // 个人历次成长
        assert(
            userHistoryStar.length === 1 &&
                classmatesHistoryAvgStar.length === 1
        );
        assert(userHistoryStar[0].star === 3);
        assert(userHistoryStar[0].spatial === 4);
        assert(userHistoryStar[0].collaborative === 3);
        assert(userHistoryStar[0].creative === 3);
        assert(userHistoryStar[0].compute === 2);
        assert(userHistoryStar[0].coordinate === 3);

        // 班级历次成长平均值
        assert(classmatesHistoryAvgStar[0].starAvg === 4);
        assert(classmatesHistoryAvgStar[0].spatialAvg === 4);
        assert(classmatesHistoryAvgStar[0].collaborativeAvg === 3);
        assert(classmatesHistoryAvgStar[0].creativeAvg === 3);
        assert(classmatesHistoryAvgStar[0].logicalAvg === 5);
        assert(classmatesHistoryAvgStar[0].computeAvg === 2);
        assert(classmatesHistoryAvgStar[0].coordinateAvg === 3);
    });

    it('043 修改对学生的点评 不是自己写的点评 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/userReport/2`)
            .send({
                star: 1,
                spatial: 2,
                collaborative: 3,
                creative: 4,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '这个记录已经修改了',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));
        assert(report.message === '没有权限');
    });

    it('044 修改对学生的点评 star参数错误 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/userReport/1`)
            .send({
                star: 0,
                spatial: 2,
                collaborative: 3,
                creative: 4,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '这个记录已经修改了',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(report.message === '评星数量错误');
    });

    it('045 修改对学生的点评 comment参数错误 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/userReport/1`)
            .send({
                star: 1,
                spatial: 2,
                collaborative: 3,
                creative: 4,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(report.message === '文字评价长度错误');
    });

    it('046 修改对学生的点评 mediaUrl参数错误 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/userReport/1`)
            .send({
                star: 1,
                spatial: 2,
                collaborative: 3,
                creative: 4,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '这个记录已经修改了',
                mediaUrl: '',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));
        assert(report.message === '媒体文件路径格式错误');
    });

    it('047 修改对学生的点评 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const report = await app
            .httpRequest()
            .put(`/evaluationReports/userReport/1`)
            .send({
                star: 1,
                spatial: 2,
                collaborative: 3,
                creative: 4,
                logical: 5,
                compute: 2,
                coordinate: 3,
                comment: '这个记录已经修改了',
                mediaUrl: [],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);
        assert(report === 'OK');

        // 后置操作，检查记录是否真的修改
        const re = await app.model.EvaluationUserReport.findOne({
            where: { id: 1 },
        });
        assert(
            re.comment === '这个记录已经修改了' &&
                re.star === 1 &&
                re.spatial === 2 &&
                re.collaborative === 3 &&
                re.creative === 4 &&
                re.logical === 5
        );
    });

    it('048 发送短信验证码 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const ret = await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === 'OK');
    });

    it('049 发送短信验证码 重复发送 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const ret = await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === 'OK');

        const ret2 = await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(ret2.message === '请勿重复发送');
    });

    it('050 校验短信验证码 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const code = await app.redis.get(`verifCode:18603042568`);
        const ret = await app
            .httpRequest()
            .post(`/users/verifyCode`)
            .send({
                cellphone: '18603042568',
                verifCode: code,
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === true);
    });

    it('051 校验短信验证码 验证码错误 应该返回false', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const ret = await app
            .httpRequest()
            .post(`/users/verifyCode`)
            .send({
                cellphone: '18603042568',
                verifCode: '123457',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === false);
    });

    it('052 修改keepwork头像 在机构中的realname', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        app.mockService('keepwork', 'update', () => 0);

        const ret = await app
            .httpRequest()
            .put(`/users/userInfo`)
            .send({
                portrait: 'http://pics1.baidu.com',
                realname: '修改了的名字',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === 'OK');

        const member = await app.model.LessonOrganizationClassMember.findOne({
            where: { memberId: 2, organizationId: 1 },
        });
        assert(member.realname === '修改了的名字');
    });

    it('053 修改keepwork头像 在机构中的realname 头像错误 应该成功', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        app.mockService('keepwork', 'update', () => 0);

        const ret = await app
            .httpRequest()
            .put(`/users/userInfo`)
            .send({
                portrait: '',
                realname: '修改了的名字?',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body);
    });

    it('054 修改keepwork头像 在机构中的realname 名字错误 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        const ret = await app
            .httpRequest()
            .put(`/users/userInfo`)
            .send({
                portrait: 'http://pics1.baidu.com',
                realname: '',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(ret.message === '名字长度错误');
    });

    it('055 修改keepwork头像 在机构中的realname和家长手机号 应该成功', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        app.mockService('keepwork', 'update', () => 0);
        await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const ret = await app
            .httpRequest()
            .put(`/users/userInfo`)
            .send({
                portrait: 'http://pics1.alibaba.com',
                realname: '又修改了的名字',
                parentPhoneNum: '18603042568',
                verifCode: '123456',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === 'OK');

        const member = await app.model.LessonOrganizationClassMember.findOne({
            where: { memberId: 2, organizationId: 1 },
        });
        assert(member.realname === '又修改了的名字');
        assert(member.parentPhoneNum === '18603042568');
    });

    it('056 修改keepwork头像 在机构中的realname和家长手机号 验证码错误 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await app
            .httpRequest()
            .post(`/users/sendSms`)
            .send({
                cellphone: '18603042568',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const ret = await app
            .httpRequest()
            .put(`/users/userInfo`)
            .send({
                portrait: 'http://pics1.alibaba.com',
                realname: '又修改了的名字',
                parentPhoneNum: '18603042568',
                verifCode: '123457',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(ret.message === '验证码错误');
    });

    it('057 获取用户信息 自己获取自己的信息 应该成功', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        app.mockService('keepwork', 'getAllUserByCondition', () => {
            return [
                {
                    portrait: 'http://pics1.alibaba.com',
                },
            ];
        });

        const ret = await app
            .httpRequest()
            .get(`/users/userInfo`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.portrait === 'http://pics1.alibaba.com');
    });

    it('058 获取用户信息 老师获取自己学生的信息 应该成功', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        app.mockService('keepwork', 'getAllUserByCondition', () => {
            return [
                {
                    portrait: 'http://pics1.alibaba.com',
                },
            ];
        });

        const ret = await app
            .httpRequest()
            .get(`/users/userInfo?studentId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.portrait === 'http://pics1.alibaba.com');
        assert(ret.realname === '什么学生');
    });

    it('059 获取用户信息 老师获取不是自己的学生的信息 应该失败', async () => {
        const user = await app.login({ id: 1 });
        const token = user.token;

        const ret = await app
            .httpRequest()
            .get(`/users/userInfo?studentId=5`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403)
            .then(res => JSON.parse(res.text));

        assert(ret.message === '没有权限');
    });

    it('060 修改家长手机号【第二步】 ', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await Promise.all([
            app.redis.set(`verifCode:18603042568`, '123456'),
            app.redis.set(`verifCode:13590450686`, '123123'),
        ]);

        const ret = await app
            .httpRequest()
            .put(`/users/parentPhoneNum`)
            .send({
                parentPhoneNum: '18603042568',
                verifCode: '123456',
                newParentPhoneNum: '13590450686',
                newVerifCode: '123123',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret === 'OK');

        // 检查是否真的修改成功
        const member = await app.model.LessonOrganizationClassMember.findOne({
            where: { memberId: 2, organizationId: 1 },
        });
        assert(member.parentPhoneNum === '13590450686');
    });

    it('061 修改家长手机号【第二步】 验证码错误1 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await Promise.all([
            app.redis.set(`verifCode:18603042568`, '123456'),
            app.redis.set(`verifCode:13590450686`, '123123'),
        ]);

        const ret = await app
            .httpRequest()
            .put(`/users/parentPhoneNum`)
            .send({
                parentPhoneNum: '13590450686',
                verifCode: '12598',
                newParentPhoneNum: '18603042568',
                newVerifCode: '123456',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(ret.message === '验证码错误');
    });

    it('062 修改家长手机号【第二步】 验证码错误2 应该失败', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        await Promise.all([
            app.redis.set(`verifCode:18603042568`, '123456'),
            app.redis.set(`verifCode:13590450686`, '123123'),
        ]);

        const ret = await app
            .httpRequest()
            .put(`/users/parentPhoneNum`)
            .send({
                parentPhoneNum: '13590450686',
                verifCode: '123123',
                newParentPhoneNum: '18603042568',
                newVerifCode: '123548',
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .then(res => JSON.parse(res.text));

        assert(ret.message === '验证码错误');

        // 后置操作
        await Promise.all([
            app.redis.del(`verifCode:18603042568`),
            app.redis.del(`verifCode:13590450686`),
        ]);
    });

    it('063 我的评估报告-数据统计 userId:2', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/statistics?classId=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const classmatesHistoryAvgStar =
            ret.historyStarStatistics.classmatesHistoryAvgStar;
        const userSumStar = ret.historyStarStatistics.userSumStar;
        const userHistoryStar = ret.growthTrack.userHistoryStar;
        const classmatesHistoryAvgStar2 =
            ret.growthTrack.classmatesHistoryAvgStar2;

        // 历次能力值统计
        assert(
            classmatesHistoryAvgStar.starAvg === '4.00' &&
                classmatesHistoryAvgStar.spatialAvg === '4.00' &&
                classmatesHistoryAvgStar.collaborativeAvg === '3.00' &&
                classmatesHistoryAvgStar.creativeAvg === '3.00' &&
                classmatesHistoryAvgStar.logicalAvg === '5.00' &&
                classmatesHistoryAvgStar.computeAvg === '2.00' &&
                classmatesHistoryAvgStar.coordinateAvg === '3.00'
        );
        assert(
            userSumStar.starCount === '3' &&
                userSumStar.spatialCount === '4' &&
                userSumStar.collaborativeCount === '3' &&
                userSumStar.creativeCount === '3' &&
                userSumStar.logicalCount === '5' &&
                userSumStar.computeCount === '2' &&
                userSumStar.coordinateCount === '3'
        );

        // 历次成长轨迹
        assert(
            userHistoryStar[0].star === 3 &&
                userHistoryStar[0].spatial === 4 &&
                userHistoryStar[0].collaborative === 3 &&
                userHistoryStar[0].creative === 3 &&
                userHistoryStar[0].logical === 5 &&
                userHistoryStar[0].compute === 2 &&
                userHistoryStar[0].coordinate === 3
        );
        assert(
            classmatesHistoryAvgStar2[0].starAvg === 4 &&
                classmatesHistoryAvgStar2[0].spatialAvg === 4 &&
                classmatesHistoryAvgStar2[0].collaborativeAvg === 3 &&
                classmatesHistoryAvgStar2[0].creativeAvg === 3 &&
                classmatesHistoryAvgStar2[0].logicalAvg === 5 &&
                classmatesHistoryAvgStar2[0].computeAvg === 2 &&
                classmatesHistoryAvgStar2[0].coordinateAvg === 3
        );
    });

    it('064 我的评估报告-数据统计 userId:4', async () => {
        const user = await app.login({ id: 4 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/statistics?classId=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        const classmatesHistoryAvgStar =
            ret.historyStarStatistics.classmatesHistoryAvgStar;
        const userSumStar = ret.historyStarStatistics.userSumStar;
        const userHistoryStar = ret.growthTrack.userHistoryStar;
        const classmatesHistoryAvgStar2 =
            ret.growthTrack.classmatesHistoryAvgStar2;

        // 历次能力值统计
        assert(
            classmatesHistoryAvgStar.starAvg === '4.00' &&
                classmatesHistoryAvgStar.spatialAvg === '4.00' &&
                classmatesHistoryAvgStar.collaborativeAvg === '3.00' &&
                classmatesHistoryAvgStar.creativeAvg === '3.00' &&
                classmatesHistoryAvgStar.logicalAvg === '5.00' &&
                classmatesHistoryAvgStar.computeAvg === '2.00' &&
                classmatesHistoryAvgStar.coordinateAvg === '3.00'
        );
        assert(
            userSumStar.starCount === '5' &&
                userSumStar.spatialCount === '4' &&
                userSumStar.collaborativeCount === '3' &&
                userSumStar.creativeCount === '3' &&
                userSumStar.logicalCount === '5' &&
                userSumStar.computeCount === '2' &&
                userSumStar.coordinateCount === '3'
        );

        // 历次成长轨迹
        assert(
            userHistoryStar[0].star === 5 &&
                userHistoryStar[0].spatial === 4 &&
                userHistoryStar[0].collaborative === 3 &&
                userHistoryStar[0].creative === 3 &&
                userHistoryStar[0].logical === 5 &&
                userHistoryStar[0].compute === 2 &&
                userHistoryStar[0].coordinate === 3
        );
        assert(
            classmatesHistoryAvgStar2[0].starAvg === 4 &&
                classmatesHistoryAvgStar2[0].spatialAvg === 4 &&
                classmatesHistoryAvgStar2[0].collaborativeAvg === 3 &&
                classmatesHistoryAvgStar2[0].creativeAvg === 3 &&
                classmatesHistoryAvgStar2[0].logicalAvg === 5 &&
                classmatesHistoryAvgStar2[0].computeAvg === 2 &&
                classmatesHistoryAvgStar2[0].coordinateAvg === 3
        );
    });

    it('065 我的评估报告-历次点评列表 userId:2', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/evaluationCommentList?classId=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.length === 1);
        assert(
            ret[0].reportName === '这是' &&
                ret[0].type === 2 &&
                ret[0].star === 3
        );
    });

    it('066 我的评估报告-历次点评列表 userId:4', async () => {
        const user = await app.login({ id: 4 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/evaluationCommentList?classId=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.length === 1);
        assert(
            ret[0].reportName === '这是' &&
                ret[0].type === 2 &&
                ret[0].star === 5
        );
    });

    it('067 发送报告给家长', async () => {
        const user = await app.login({ id: 2 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .post(`/evaluationReports/reportToParent`)
            .send({
                dataArr: [
                    {
                        baseUrl: 'www.baidu.com/',
                        reportName: '这个名字修改了',
                        studentId: 2,
                        realname: '什么学生',
                        orgName: '什么机构',
                        star: 1,
                        classId: 1,
                        type: 1,
                        userReportId: 2,
                        parentPhoneNum: '18603042568',
                    },
                ],
            })
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);
        assert(ret.length === 0);

        const userRepo = await app.model.EvaluationUserReport.findOne({
            where: { id: 2 },
        });
        assert(userRepo.isSend === 1);
    });

    it('068 管理员查看报告', async () => {
        const user = await app.login({ id: 3 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/orgClassReport`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.length === 2);
        assert(
            ret[0].name === '什么班级' &&
                ret[0].teacherNames === '什么老师' &&
                ret[0].sendCount === 0 &&
                ret[0].commentCount === 1
        );

        assert(
            ret[1].name === '什么班级2' &&
                ret[1].teacherNames === null &&
                ret[1].sendCount === null &&
                ret[1].commentCount === null
        );
    });

    it('069 管理员查看班级报告 classId:1', async () => {
        const user = await app.login({ id: 3 });
        const token = user.token;

        // 前置操作
        const rep = await app.model.EvaluationReport.create({
            userId: 1,
            name: '这是',
            type: 2,
            classId: 1,
        });
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: rep.id,
            star: 3,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });
        await app.model.EvaluationUserReport.create({
            userId: 4,
            reportId: rep.id,
            star: 5,
            spatial: 4,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '',
            mediaUrl: '',
        });

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/classReport?classId=1`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.length === 1);
        assert(
            ret[0].teacherName === '什么老师' &&
                ret[0].type === 2 &&
                ret[0].commentCount === 1 &&
                ret[0].sendCount === 0
        );
    });

    it('070 管理员查看班级报告 classId:2', async () => {
        const user = await app.login({ id: 3 });
        const token = user.token;

        const ret = await app
            .httpRequest()
            .get(`/evaluationReports/classReport?classId=2`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then(res => res.body.data);

        assert(ret.length === 0);
    });
});
