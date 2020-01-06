const { app, assert } = require('egg-mock/bootstrap');

describe('test/model/evaluationReport.test.js', () => {
    beforeEach(async () => {
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
            name: '什么报告',
            type: 1,
            classId: 1,
            userId: 1,
        });
        await app.model.EvaluationReport.create({
            name: '什么报告2',
            type: 2,
            classId: 2,
            userId: 1,
        });
    });

    it('001 getUserReportList 未点评名单', async () => {
        const list = await app.model.EvaluationUserReport.getUserReportList({
            reportId: 1,
            status: 1,
        });
        assert(
            list.length === 2 &&
                list[0].studentId === 2 &&
                list[1].studentId === 4
        );
    });

    it('002 getUserReportList 已点评名单', async () => {
        const list = await app.model.EvaluationUserReport.getUserReportList({
            reportId: 1,
            status: 2,
        });
        assert(list.length === 0);
    });

    it('003 getUserReportList 已点评名单', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            userId: 2,
            reportId: 1,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
            comment: '不错',
            mediaUrl: [],
        });

        const list = await app.model.EvaluationUserReport.getUserReportList({
            reportId: 1,
            status: 2,
        });
        assert(list.length === 1 && list[0].realname === '什么学生');
    });

    it('004 getUserReportList 未点评名单', async () => {
        const list = await app.model.EvaluationUserReport.getUserReportList({
            reportId: 1,
            status: 1,
        });
        assert(
            list.length === 2 &&
                list[0].studentId === 2 &&
                list[1].studentId === 4
        );
    });

    it('005 getTeacherByUserReportId 获取老师id', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
        });

        const ret = await app.model.EvaluationUserReport.getTeacherByUserReportId(
            1
        );
        assert(ret.teacherId === 1 && ret.studentId === 2);
    });

    it('006 getStudentIdsByReportId 获取这个报告中已经点评了的学生id', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
        });

        const ret = await app.model.EvaluationUserReport.getStudentIdsByReportId(
            1
        );
        assert(ret.length === 1 && ret[0].studentId === 2);
    });

    it('007 getByUserIdAndClassIds', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
        });

        const ret = await app.model.EvaluationUserReport.getByUserIdAndClassIds(
            2,
            [1]
        );
        assert(ret.length === 1 && ret[0].classId === 1);
    });

    it('008 getReportAndOrgNameById ', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
        });

        const ret = await app.model.EvaluationUserReport.getReportAndOrgNameById(
            1
        );
        assert(
            ret.orgName === '什么机构' &&
                ret.realname === '什么学生' &&
                ret.teacherName === '什么老师'
        );
    });

    it('009 getClassmatesAvgStarById', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });

        const ret = await app.model.EvaluationUserReport.getClassmatesAvgStarById(
            1
        );
        assert(
            ret.starAvg === '2.00' &&
                ret.spatialAvg === '3.00' &&
                ret.collaborativeAvg === '4.00' &&
                ret.creativeAvg === '1.00' &&
                ret.logicalAvg === '5.00' &&
                ret.computeAvg === '1.00' &&
                ret.coordinateAvg === '2.00'
        );
    });

    it('010 getClassmatesHistoryAvgStar', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });

        const ret = await app.model.EvaluationUserReport.getClassmatesHistoryAvgStar(
            1
        );
        assert(
            ret.starAvg === '2.00' &&
                ret.spatialAvg === '3.00' &&
                ret.collaborativeAvg === '4.00' &&
                ret.creativeAvg === '1.00' &&
                ret.logicalAvg === '5.00' &&
                ret.computeAvg === '1.00' &&
                ret.coordinateAvg === '2.00'
        );
    });

    it('011 getUserSumStar', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });

        const ret = await app.model.EvaluationUserReport.getUserSumStar(2, 1);
        assert(
            ret.starCount === '2' &&
                ret.spatialCount === '3' &&
                ret.collaborativeCount === '4' &&
                ret.creativeCount === '1' &&
                ret.logicalCount === '5' &&
                ret.computeCount === '1' &&
                ret.coordinateCount === '2'
        );
    });

    it('012 getUserHistoryStar', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });
        const ret = await app.model.EvaluationUserReport.getUserHistoryStar(
            2,
            1
        );
        assert(ret.length === 1);
        assert(
            ret[0].star === 2 &&
                ret[0].spatial === 3 &&
                ret[0].collaborative === 4 &&
                ret[0].creative === 1 &&
                ret[0].logical === 5 &&
                ret[0].compute === 1 &&
                ret[0].coordinate === 2
        );
    });

    it('013 getClassmatesHistoryAvgStarGroupByReportId', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });

        const ret = await app.model.EvaluationUserReport.getClassmatesHistoryAvgStarGroupByReportId(
            1
        );
        assert(ret.length === 1);
        assert(
            ret[0].starAvg === '2.00' &&
                ret[0].spatialAvg === '3.00' &&
                ret[0].collaborativeAvg === '4.00' &&
                ret[0].creativeAvg === '1.00' &&
                ret[0].logicalAvg === '5.00' &&
                ret[0].computeAvg === '1.00' &&
                ret[0].coordinateAvg === '2.00'
        );
    });

    it('014 getEvaluationCommentListSql', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });
        const ret = await app.model.EvaluationUserReport.getEvaluationCommentListSql(
            2,
            1
        );
        assert(ret.length === 1);
        assert(
            ret[0].star === 2 &&
                ret[0].teacherName === '什么老师' &&
                ret[0].reportName === '什么报告'
        );
    });

    it('015 getClassAndEvalStatus', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });
        const ret = await app.model.EvaluationUserReport.getClassAndEvalStatus(
            1
        );
        assert(ret.length === 2);
        assert(ret[0].status === 3);
        assert(ret[1].status === 2);
    });

    it('016 getTeacherCommentStatistics', async () => {
        // 前置操作
        await app.model.EvaluationUserReport.create({
            reportId: 1,
            userId: 2,
            star: 2,
            spatial: 3,
            collaborative: 4,
            creative: 1,
            logical: 5,
            compute: 1,
            coordinate: 2,
        });
        const ret = await app.model.EvaluationUserReport.getTeacherCommentStatistics(
            1
        );
        assert(
            ret.length === 1 &&
                ret[0].commentCount === 1 &&
                ret[0].sendCount === 0
        );
    });
});
