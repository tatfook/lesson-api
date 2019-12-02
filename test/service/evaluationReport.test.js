const { app, assert } = require('egg-mock/bootstrap');

describe('test/service/evaluationReport.test.js', () => {
    beforeEach(async () => {

        await app.redis.flushdb();

        // 创建机构，班级，老师，学生，管理员
        await app.model.LessonOrganization.create({ name: '什么机构' });
        await app.model.LessonOrganizationClass.create({
            organizationId: 1,
            name: '什么班级',
            end: '2029-10-21 00:00:00',
        });
        await app.model.LessonOrganizationClass.create({
            organizationId: 1,
            name: '什么班级2',
            end: '2029-10-21 00:00:00',
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: 1,
            classId: 1,
            memberId: 1,
            roleId: 2,
            realname: '什么老师',
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: 1,
            classId: 1,
            memberId: 2,
            roleId: 1,
            realname: '什么学生',
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: 1,
            classId: 1,
            memberId: 3,
            roleId: 64,
            realname: '什么管理员',
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: 1,
            classId: 1,
            memberId: 4,
            roleId: 1,
            realname: '什么学生2',
        });
        await app.model.LessonOrganizationClassMember.create({
            organizationId: 1,
            classId: 2,
            memberId: 5,
            roleId: 1,
            realname: '什么学生3',
        });

        await app.model.EvaluationReport.create({
            userId: 1,
            name: '报告名字',
            type: 1,
            classId: 1,
        });
    });

    it('001 createEvalReport 创建点评记录 应该成功', async () => {
        const ctx = app.mockContext();
        const ret = await ctx.service.evaluationReport.createEvalReport({
            userId: 1,
            name: '报告名字',
            type: 1,
            classId: 1,
        });
        assert(ret);

        // 检查是否真的创建
        const report = await app.model.EvaluationReport.findOne({
            where: { name: '报告名字' },
        });
        assert(report.id);
    });

    it('002 updateEvalReport 更新发起的点评记录 应该成功', async () => {
        const ctx = app.mockContext();
        const ret = await ctx.service.evaluationReport.updateEvalReport(
            { name: '这个名字修改了', type: 2 },
            { name: '报告名字' }
        );
        assert(ret);

        const report = await app.model.EvaluationReport.findOne({
            where: { id: 1 },
        });
        assert(report.name === '这个名字修改了' && report.type === 2);
    });

    it('003 createUserReport 创建对学生点评的记录 应该成功', async () => {
        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });
        assert(ret);

        // 检查是否真的创建
        const userReport = await app.model.EvaluationUserReport.findOne({
            where: { userId: 2 },
        });
        assert(userReport.id === 1);
    });

    it('004 createUserReport 同一个点评重复创建对学生点评的记录 应该失败', async () => {
        const ctx = app.mockContext();
        try {
            await ctx.service.evaluationReport.createUserReport({
                userId: 2,
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
            });
        } catch (e) {
            assert(e.name === 'SequelizeUniqueConstraintError');
        }

        // 检查是否真的创建
        const userReport = await app.model.EvaluationUserReport.findAll({
            where: { userId: 2 },
        });
        assert(userReport.length === 1);
    });

    it('005 updateUserReportByCondition 修改对学生的点评 应该成功', async () => {
        await app.model.EvaluationUserReport.create({});

        const ctx = app.mockContext();
        const ret = await ctx.service.evaluationReport.updateUserReportByCondition(
            { comment: '文字评价修改了' },
            { id: 1 }
        );
        assert(ret);

        // 检查是否真的修改
        const userReport = await app.model.EvaluationUserReport.findOne({
            where: { id: 1 },
        });
        assert(userReport.comment === '文字评价修改了');
    });

    it('006 getStudentIdsByReportId 获取这个报告中已经点评了的学生id', async () => {
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getStudentIdsByReportId(
            1
        );
        assert(ret.length === 1 && ret[0] === 2);
    });

    it('007 getReportList 获取对班级classId发起的点评', async () => {
        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getReportList({
            classId: 1,
            userId: 1,
        });
        assert(ret.length === 1 && ret[0].reportName === '报告名字');
    });

    it('008 destroyReportById 删除发起的点评，那么已经点评过的记录也要删除', async () => {
        const ctx = app.mockContext();

        await ctx.service.evaluationReport.destroyReportById(1);

        const ret = await app.model.EvaluationReport.findAll();
        assert(ret.length === 0);
        const ret2 = await app.model.EvaluationUserReport.findAll();
        assert(ret2.length === 0);
    });

    it('009 getUserReportByCondition 获取一条对学生的点评', async () => {
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getUserReportByCondition(
            {
                id: 1,
            }
        );
        assert(ret);
    });

    it('010 getUserReportAndOrgInfo ', async () => {
        app.mockService('keepwork', 'getAllUserByCondition', () => {
            return [{}]
        })

        const ctx = app.mockContext();
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ret = await ctx.service.evaluationReport.getUserReportAndOrgInfo(
            1
        );
        assert(ret);
    });

    it('011 getReportByCondition 获取一条发起的点评', async () => {
        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getReportByCondition({
            name: '报告名字',
        });
        assert(ret);
    });

    it('012 getUserReportList 获取对学生的点评列表', async () => {
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getUserReportList({
            reportId: 1,
        });
        assert(ret.length === 1 && ret[0].userReportId === 1);
    });

    it('013 getTeacherByUserReportId 根据userReportId获取老师的id', async () => {
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.getTeacherByUserReportId(
            1
        );

        assert(ret.teacherId === 1);
    });

    it('014 destroyUserReportByCondition 根据条件删除对学生的点评', async () => {
        const ctx = app.mockContext();
        await app.model.EvaluationUserReport.create({ reportId: 1, userId: 2 });

        const ret = await ctx.service.evaluationReport.destroyUserReportByCondition(
            { id: 1 }
        );
        assert(ret);
    });

    it('015 getClassmatesAvgStarById 本班同学本次点评的平均能力值', async () => {
        await app.model.EvaluationUserReport.create({
            reportId: 1, userId: 2
        });
        const ctx = app.mockContext();
        // 这时候只有他一个人被老师点评了
        const ret = await ctx.service.evaluationReport.getClassmatesAvgStarById(
            {
                reportId: 1,
            }
        );
        assert(
            ret.starAvg === '1.00' &&
            ret.spatialAvg === '1.00' &&
            ret.collaborativeAvg === '1.00' &&
            ret.creativeAvg === '1.00' &&
            ret.logicalAvg === '1.00' &&
            ret.computeAvg === '1.00' &&
            ret.coordinateAvg === '1.00'
        );
    });

    it('016 getClassmatesAvgStarById 本班同学本次点评的平均能力值', async () => {
        const ctx = app.mockContext();
        // 给另外一个同学点评，以便算统计
        await ctx.service.evaluationReport.createUserReport({
            userId: 4,
            reportId: 1,
            star: 5,
            spatial: 2,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '你还不错',
            mediaUrl: [],
        });

        const ret = await ctx.service.evaluationReport.getClassmatesAvgStarById(
            {
                reportId: 1,
                refresh: true,
            }
        );
        assert(
            ret.starAvg === '5.00' &&
            ret.spatialAvg === '2.00' &&
            ret.collaborativeAvg === '3.00' &&
            ret.creativeAvg === '3.00' &&
            ret.logicalAvg === '5.00' &&
            ret.computeAvg === '2.00' &&
            ret.coordinateAvg === '3.00'
        );
    });

    it('017 getClassmatesHistoryAvgStar 本班同学历次能力值总和的平均值', async () => {
        const ctx = app.mockContext();
        // 给另外一个同学点评，以便算统计
        await ctx.service.evaluationReport.createUserReport({
            userId: 4,
            reportId: 1,
            star: 5,
            spatial: 2,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '你还不错',
            mediaUrl: [],
        });

        // 这时候只有一次点评
        const ret = await ctx.service.evaluationReport.getClassmatesHistoryAvgStar(
            {
                classId: 1,
                refresh: true,
            }
        );
        assert(
            ret.starAvg === '5.00' &&
            ret.spatialAvg === '2.00' &&
            ret.collaborativeAvg === '3.00' &&
            ret.creativeAvg === '3.00' &&
            ret.logicalAvg === '5.00' &&
            ret.computeAvg === '2.00' &&
            ret.coordinateAvg === '3.00'
        );
    });

    it('018 getClassmatesHistoryAvgStar 本班同学历次能力值总和的平均值', async () => {
        const ctx = app.mockContext();

        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });
        await ctx.service.evaluationReport.createUserReport({
            userId: 4,
            reportId: 1,
            star: 5,
            spatial: 2,
            collaborative: 3,
            creative: 3,
            logical: 5,
            compute: 2,
            coordinate: 3,
            comment: '你还不错',
            mediaUrl: [],
        });

        const ret = await ctx.service.evaluationReport.getClassmatesHistoryAvgStar(
            {
                classId: 1,
                refresh: true,
            }
        );
        assert(
            ret.starAvg === '4.00' &&
            ret.spatialAvg === '3.00' &&
            ret.collaborativeAvg === '3.00' &&
            ret.creativeAvg === '3.00' &&
            ret.logicalAvg === '5.00' &&
            ret.computeAvg === '2.00' &&
            ret.coordinateAvg === '3.00'
        );
    });

    it('019 getUserSumStar 获取学生在这个班历次能力值总和', async () => {
        const ctx = app.mockContext();
        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        const ret = await ctx.service.evaluationReport.getUserSumStar({
            classId: 1,
            studentId: 2,
            refresh: true,
        });
        assert(
            ret.starCount === '3' &&
            ret.spatialCount === '4' &&
            ret.collaborativeCount === '3' &&
            ret.creativeCount === '3' &&
            ret.logicalCount === '5' &&
            ret.computeCount === '2' &&
            ret.coordinateCount === '3'
        );
    });

    it('020 getUserHistoryStar 获取学生在这个班历次成长', async () => {
        const ctx = app.mockContext();

        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        const ret = await ctx.service.evaluationReport.getUserHistoryStar({
            classId: 1,
            studentId: 2,
            refresh: true,
        });
        assert(ret.length === 1);
        assert(
            ret[0].star === 3 &&
            ret[0].spatial === 4 &&
            ret[0].collaborative === 3 &&
            ret[0].creative === 3 &&
            ret[0].logical === 5 &&
            ret[0].compute === 2 &&
            ret[0].coordinate === 3
        );
    });

    it('021 getClassmatesHistoryAvgStarGroupByReportId 获取同学历次成长的平均值', async () => {
        const ctx = app.mockContext();

        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        const ret = await ctx.service.evaluationReport.getClassmatesHistoryAvgStarGroupByReportId(
            { classId: 1, refresh: true }
        );
        assert(ret.length === 1);
        assert(
            ret[0].starAvg === '3.00' &&
            ret[0].spatialAvg === '4.00' &&
            ret[0].collaborativeAvg === '3.00' &&
            ret[0].creativeAvg === '3.00' &&
            ret[0].logicalAvg === '5.00' &&
            ret[0].computeAvg === '2.00' &&
            ret[0].coordinateAvg === '3.00'
        );
    });

    it('022 getUserReportDetail 学生获得的点评详情 ', async () => {
        const ctx = app.mockContext();
        app.mockService('keepwork', 'getAllUserByCondition', () => { return [{}] });

        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        const ret = await ctx.service.evaluationReport.getUserReportDetail(
            1,
            2,
            1,
            1
        );

        const userRepo = ret.userRepo;
        const classmatesAvgStar = ret.classmatesAvgStar;
        const historyStarStatistics = ret.historyStarStatistics;
        const growthTrack = ret.growthTrack;

        assert(
            userRepo.star === 3 &&
            userRepo.spatial === 4 &&
            userRepo.collaborative === 3 &&
            userRepo.creative === 3 &&
            userRepo.logical === 5 &&
            userRepo.compute === 2 &&
            userRepo.coordinate === 3
        );

        assert(
            classmatesAvgStar.starAvg === '3.00' &&
            classmatesAvgStar.spatialAvg === '4.00' &&
            classmatesAvgStar.collaborativeAvg === '3.00' &&
            classmatesAvgStar.creativeAvg === '3.00' &&
            classmatesAvgStar.logicalAvg === '5.00' &&
            classmatesAvgStar.computeAvg === '2.00' &&
            classmatesAvgStar.coordinateAvg === '3.00'
        );

        assert(
            historyStarStatistics.classmatesHistoryAvgStar.length === 0 &&
            historyStarStatistics.userSumStar.length === 0
        );

        assert(growthTrack.userHistoryStar.length === 0);
        assert(growthTrack.classmatesHistoryAvgStar2.length === 0);
    });

    it('023 updateUserReportByCondition 修改对学生的点评', async () => {
        const ctx = app.mockContext();

        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        let ret = await ctx.service.evaluationReport.updateUserReportByCondition(
            { comment: '哈哈哈哈' },
            { id: 1 }
        );
        assert(ret);
        ret = await app.model.EvaluationUserReport.findOne({
            where: { id: 1 },
        });
        assert(ret.comment === '哈哈哈哈');
    });

    it('024 getEvaluationCommentList 学生获得的历次点评列表', async () => {
        const ctx = app.mockContext();
        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });

        const ret = await ctx.service.evaluationReport.getEvaluationCommentList(
            1,
            2
        );

        assert(
            ret.length === 1 &&
            ret[0].reportName === '报告名字' &&
            ret[0].star === 3
        );
    });

    it('025 adminGetReport 查看机构的全部班级的报告', async () => {
        const ctx = app.mockContext();
        await ctx.service.evaluationReport.createUserReport({
            userId: 2,
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
        });
        const ret = await ctx.service.evaluationReport.adminGetReport(1);
        assert(
            ret.length === 2 &&
            ret[0].classId === 1 &&
            ret[0].name === '什么班级' &&
            ret[0].teacherNames === '什么老师' &&
            ret[0].sendCount === 0 &&
            ret[0].commentCount === 1
        );
    });

    it('026 adminGetClassReport 管理员查看班级报告', async () => {
        const ctx = app.mockContext();

        const ret = await ctx.service.evaluationReport.adminGetClassReport(1);
        assert(ret.length === 1);
        assert(
            ret[0].userId === 1 &&
            ret[0].type === 1 &&
            ret[0].teacherName === '什么老师' &&
            ret[0].className === '什么班级' &&
            ret[0].commentCount === 0 &&
            ret[0].sendCount === 0
        );
    });
});
