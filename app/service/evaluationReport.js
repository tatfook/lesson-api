'use strict';

const Service = require('../common/service.js');
const Err = require('../common/err');
const moment = require('moment');
const { EVA_REPO_TEMPLETID } = require('../common/consts');

class EvalReportService extends Service {
    // 发起点评
    async createEvalReport({ userId, name, type, classId }) {
        return await this.ctx.model.EvaluationReport.create({
            userId,
            name,
            type,
            classId,
        });
    }

    // 更新发起的点评记录，（名称和类型）
    async updateEvalReport(params, condition) {
        return await this.ctx.model.EvaluationReport.update(params, {
            where: condition,
        });
    }

    // 创建对学生点评的记录
    async createUserReport(params) {
        return await this.ctx.model.EvaluationUserReport.create(params);
    }

    // studentId在这些班级被删除学生身份，这里更新redis统计数据
    async checkEvaluationStatus(studentId, classIds) {
        const userReports = await this.ctx.model.EvaluationUserReport.getByUserIdAndClassIds(
            studentId,
            classIds
        );
        for (let i = 0; i < userReports.length; i++) {
            const element = userReports[i];
            await this.refreshRedisStatistics({
                classId: element.classId,
                reportId: element.reportId,
                studentId,
            });
        }
    }

    // 获取这个报告中已经点评了的学生id
    async getStudentIdsByReportId(reportId) {
        const ret = await this.ctx.model.EvaluationUserReport.getStudentIdsByReportId(
            reportId
        );
        return ret ? ret.map(r => r.studentId) : [];
    }

    // 刷新redis的统计数据
    async refreshRedisStatistics({ classId, reportId, studentId }) {
        if (!classId) {
            const report = await this.getReportByCondition({ id: reportId });
            if (!report) return;
            classId = report.classId;
        }
        await Promise.all([
            this.getClassmatesAvgStarById({ reportId, refresh: true }),
            this.getClassmatesHistoryAvgStar({ classId, refresh: true }),
            this.getUserSumStar({ studentId, classId, refresh: true }),
            this.getUserHistoryStar({ studentId, classId, refresh: true }),
            this.getClassmatesHistoryAvgStarGroupByReportId({
                classId,
                refresh: true,
            }),
        ]);
    }

    // 在删除发起的点评之后，删除redis统计数据。由于可能有大量学生，这里不维护他们的统计数据，主动请求接口的时候再生成redis统计数据
    async delRedisStaticstics({ classId, reportId, studentIds }) {
        await this.app.redis.del(`getClassmatesAvgStarById:${reportId}`);
        await this.app.redis.del(`getClassmatesHistoryAvgStar:${classId}`);
        await this.app.redis.del(
            `getClassmatesHistoryAvgStarGroupByReportId:${classId}`
        );

        for (let i = 0; i < studentIds.length; i++) {
            await this.app.redis.del(
                `getUserSumStar:${studentIds[i]},${classId}`
            );
            await this.app.redis.del(
                `getUserHistoryStar:${studentIds[i]},${classId}`
            );
        }
    }

    // 获取对班级classId发起的点评
    async getReportList({
        classId,
        userId,
        roleId,
        name = undefined,
        type = undefined,
        days,
    }) {
        const list = await this.ctx.model.EvaluationReport.getReportList({
            classId,
            roleId,
            userId,
            name,
            type,
            days,
        });
        return list;
    }

    // 删除发起的点评，那么已经点评过的记录也要删除
    async destroyReportById(reportId) {
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            await Promise.all([
                this.ctx.model.EvaluationReport.destroy({
                    where: { id: reportId },
                    transaction,
                }),
                this.ctx.model.EvaluationUserReport.destroy({
                    where: { reportId },
                    transaction,
                }),
            ]);

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }
    }

    // 获取一条对学生的点评
    async getUserReportByCondition(condition) {
        const ret = await this.ctx.model.EvaluationUserReport.findOne({
            where: condition,
        });
        return ret ? ret.get() : undefined;
    }

    // 获取对学生的点评和学生的头像以及学生是否是vip和tLevel等级
    async getUserReportAndOrgInfo(userReportId) {
        const repo = await this.ctx.model.EvaluationUserReport.getReportAndOrgNameById(
            userReportId
        );
        const users = await this.ctx.service.keepwork.getAllUserByCondition({
            id: repo.userId,
        });
        return {
            ...repo,
            portrait: users[0].portrait,
            vip: users[0].vip,
            tLevel: users[0].tLevel,
        };
    }

    // 获取一条发起的点评
    async getReportByCondition(condition) {
        const ret = await this.ctx.model.EvaluationReport.findOne({
            where: condition,
        });
        return ret ? ret.get() : undefined;
    }

    // 获取对学生的点评列表
    async getUserReportList({ reportId, status, isSend, realname }) {
        const list = await this.ctx.model.EvaluationUserReport.getUserReportList(
            {
                reportId,
                status,
                isSend,
                realname,
            }
        );
        return list;
    }

    // 根据userReportId获取老师的id,studentId,reportId,classId
    async getTeacherByUserReportId(userReportId) {
        return await this.ctx.model.EvaluationUserReport.getTeacherByUserReportId(
            userReportId
        );
    }

    // 根据条件删除对学生的点评
    async destroyUserReportByCondition(condition) {
        return await this.ctx.model.EvaluationUserReport.destroy({
            where: condition,
        });
    }

    // 本班同学本次点评的平均能力值
    async getClassmatesAvgStarById({ reportId, refresh }) {
        let ret;
        if (!refresh) {
            ret = await this.app.redis.get(
                `getClassmatesAvgStarById:${reportId}`
            );
            if (ret) return JSON.parse(ret);
        }
        ret = await this.ctx.model.EvaluationUserReport.getClassmatesAvgStarById(
            reportId
        );
        await this.app.redis.set(
            `getClassmatesAvgStarById:${reportId}`,
            JSON.stringify(ret)
        );
        return ret;
    }

    //   本班同学历次能力值总和的平均值
    async getClassmatesHistoryAvgStar({ classId, refresh }) {
        let ret;
        if (!refresh) {
            ret = await this.app.redis.get(
                `getClassmatesHistoryAvgStar:${classId}`
            );
            if (ret) return JSON.parse(ret);
        }
        ret = await this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStar(
            classId
        );
        await this.app.redis.set(
            `getClassmatesHistoryAvgStar:${classId}`,
            JSON.stringify(ret)
        );
        return ret;
    }

    // 获取学生在这个班历次能力值总和
    async getUserSumStar({ studentId, classId, refresh }) {
        let ret;
        if (!refresh) {
            ret = await this.app.redis.get(
                `getUserSumStar:${studentId},${classId}`
            );
            if (ret) return JSON.parse(ret);
        }
        ret = await this.ctx.model.EvaluationUserReport.getUserSumStar(
            studentId,
            classId
        );
        await this.app.redis.set(
            `getUserSumStar:${studentId},${classId}`,
            JSON.stringify(ret)
        );
        return ret;
    }

    // 获取学生在这个班历次成长
    async getUserHistoryStar({ studentId, classId, refresh }) {
        let ret;
        if (!refresh) {
            ret = await this.app.redis.get(
                `getUserHistoryStar:${studentId},${classId}`
            );
            if (ret) return JSON.parse(ret);
        }
        ret = await this.ctx.model.EvaluationUserReport.getUserHistoryStar(
            studentId,
            classId
        );
        await this.app.redis.set(
            `getUserHistoryStar:${studentId},${classId}`,
            JSON.stringify(ret)
        );
        return ret;
    }

    // 获取同学历次成长的平均值
    async getClassmatesHistoryAvgStarGroupByReportId({ classId, refresh }) {
        let ret;
        if (!refresh) {
            ret = await this.app.redis.get(
                `getClassmatesHistoryAvgStarGroupByReportId:${classId}`
            );
            if (ret) return JSON.parse(ret);
        }
        ret = await this.ctx.model.EvaluationUserReport.getClassmatesHistoryAvgStarGroupByReportId(
            classId
        );
        await this.app.redis.set(
            `getClassmatesHistoryAvgStarGroupByReportId:${classId}`,
            JSON.stringify(ret)
        );
        return ret;
    }

    // 学生获得的点评详情
    async getUserReportDetail(userReportId, studentId, classId, type) {
        const repo = await this.getUserReportByCondition({ id: userReportId });
        if (!repo) this.ctx.throw(400, Err.ARGS_ERR);

        const taskArr =
            ~~type === 1
                ? [
                    // 小评
                    this.getUserReportAndOrgInfo(userReportId),
                    this.getClassmatesAvgStarById({
                        reportId: repo.reportId,
                    }),
                ]
                : [
                    // 阶段点评
                    this.getUserReportAndOrgInfo(userReportId),
                    this.getClassmatesAvgStarById({
                        reportId: repo.reportId,
                    }), // 本班同学本次点评的平均能力值
                    this.getClassmatesHistoryAvgStar({ classId }), // 本班同学历次能力值总和的平均值
                    this.getUserSumStar({ studentId, classId }), // 获取学生在这个班历次能力值总和
                    this.getUserHistoryStar({ studentId, classId }), // 获取学生在这个班历次成长
                    this.getClassmatesHistoryAvgStarGroupByReportId({
                        classId,
                    }), // 获取同学历次成长的平均值
                ];

        const [
            userRepo,
            classmatesAvgStar,
            classmatesHistoryAvgStar = [],
            userSumStar = [],
            userHistoryStar = [],
            classmatesHistoryAvgStar2 = [],
        ] = await Promise.all(taskArr);

        const userHistoryStarArr = [];
        for (let i = 0; i < userHistoryStar.length; i++) {
            const element = userHistoryStar[i];
            let star = 0,
                spatial = 0,
                collaborative = 0,
                creative = 0,
                logical = 0,
                compute = 0,
                coordinate = 0;
            for (let j = 0; j <= i; j++) {
                star += userHistoryStar[j].star;
                spatial += userHistoryStar[j].spatial;
                collaborative += userHistoryStar[j].collaborative;
                creative += userHistoryStar[j].creative;
                logical += userHistoryStar[j].logical;
                compute += userHistoryStar[j].compute;
                coordinate += userHistoryStar[j].coordinate;
            }

            userHistoryStarArr.push({
                ...element,
                star,
                spatial,
                collaborative,
                creative,
                logical,
                compute,
                coordinate,
            });
        }

        const classmatesHistoryAvgStar2Arr = [];
        for (let i = 0; i < classmatesHistoryAvgStar2.length; i++) {
            const element = classmatesHistoryAvgStar2[i];
            let starAvg = 0,
                spatialAvg = 0,
                collaborativeAvg = 0,
                creativeAvg = 0,
                logicalAvg = 0,
                computeAvg = 0,
                coordinateAvg = 0;
            for (let j = 0; j <= i; j++) {
                starAvg += parseFloat(classmatesHistoryAvgStar2[j].starAvg);
                spatialAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].spatialAvg
                );
                collaborativeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].collaborativeAvg
                );
                creativeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].creativeAvg
                );
                logicalAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].logicalAvg
                );
                computeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].computeAvg
                );
                coordinateAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].coordinateAvg
                );
            }

            classmatesHistoryAvgStar2Arr.push({
                ...element,
                starAvg,
                spatialAvg,
                collaborativeAvg,
                creativeAvg,
                logicalAvg,
                computeAvg,
                coordinateAvg,
            });
        }

        const retObj = {
            userRepo,
            classmatesAvgStar, // 班级本次平均能力值
            historyStarStatistics: {
                // 历次能力值统计
                classmatesHistoryAvgStar,
                userSumStar,
            },
            growthTrack: {
                // 成长轨迹
                userHistoryStar: userHistoryStarArr,
                classmatesHistoryAvgStar2: classmatesHistoryAvgStar2Arr,
            },
        };
        return retObj;
    }

    // 修改对学生的点评
    async updateUserReportByCondition(params, condition) {
        const ret = await this.ctx.model.EvaluationUserReport.update(params, {
            where: condition,
        });
        return ret;
    }

    // 本班所有任课老师对该学生的点评数据分析
    async getUserReportStatisticsInClass(classId, studentId) {
        const [
            classmatesHistoryAvgStar,
            userSumStar,
            userHistoryStar,
            classmatesHistoryAvgStar2,
        ] = await Promise.all([
            this.getClassmatesHistoryAvgStar({ classId }), // 本班同学历次能力值总和的平均值
            this.getUserSumStar({ studentId, classId }), // 获取学生在这个班历次能力值总和
            this.getUserHistoryStar({ studentId, classId }), // 获取学生在这个班历次成长
            this.getClassmatesHistoryAvgStarGroupByReportId({ classId }), // 获取同学历次成长的平均值
        ]);

        const userHistoryStarArr = [];
        for (let i = 0; i < userHistoryStar.length; i++) {
            const element = userHistoryStar[i];
            let star = 0,
                spatial = 0,
                collaborative = 0,
                creative = 0,
                logical = 0,
                compute = 0,
                coordinate = 0;
            for (let j = 0; j <= i; j++) {
                star += userHistoryStar[j].star;
                spatial += userHistoryStar[j].spatial;
                collaborative += userHistoryStar[j].collaborative;
                creative += userHistoryStar[j].creative;
                logical += userHistoryStar[j].logical;
                compute += userHistoryStar[j].compute;
                coordinate += userHistoryStar[j].coordinate;
            }

            userHistoryStarArr.push({
                ...element,
                star,
                spatial,
                collaborative,
                creative,
                logical,
                compute,
                coordinate,
            });
        }

        const classmatesHistoryAvgStar2Arr = [];
        for (let i = 0; i < classmatesHistoryAvgStar2.length; i++) {
            const element = classmatesHistoryAvgStar2[i];
            let starAvg = 0,
                spatialAvg = 0,
                collaborativeAvg = 0,
                creativeAvg = 0,
                logicalAvg = 0,
                computeAvg = 0,
                coordinateAvg = 0;
            for (let j = 0; j <= i; j++) {
                starAvg += parseFloat(classmatesHistoryAvgStar2[j].starAvg);
                spatialAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].spatialAvg
                );
                collaborativeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].collaborativeAvg
                );
                creativeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].creativeAvg
                );
                logicalAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].logicalAvg
                );
                computeAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].computeAvg
                );
                coordinateAvg += parseFloat(
                    classmatesHistoryAvgStar2[j].coordinateAvg
                );
            }

            classmatesHistoryAvgStar2Arr.push({
                ...element,
                starAvg,
                spatialAvg,
                collaborativeAvg,
                creativeAvg,
                logicalAvg,
                computeAvg,
                coordinateAvg,
            });
        }

        const retObj = {
            historyStarStatistics: {
                // 历次能力值统计
                classmatesHistoryAvgStar,
                userSumStar,
            },
            growthTrack: {
                // 成长轨迹
                userHistoryStar: userHistoryStarArr,
                classmatesHistoryAvgStar2: classmatesHistoryAvgStar2Arr,
            },
        };

        return retObj;
    }

    // 学生获得的历次点评列表
    async getEvaluationCommentList(classId, userId) {
        const list = await this.ctx.model.EvaluationUserReport.getEvaluationCommentListSql(
            userId,
            classId
        );
        list.forEach(r => {
            r.createdAt = moment(r.createdAt).format('YYYY-MM-DD HH:mm:ss');
            r.teacherName = `${r.teacherName}老师`;
        });
        return list;
    }

    // 发送给家长  dataArr 结构：[{baseUrl,reportName,realname, orgName,star,parentPhoneNum}]
    async reportToParent(dataArr) {
        const tasksArr = [];
        const successIds = []; // 发送成功报告id
        const failArr = []; // 发送失败用户名字
        const ctx = this.ctx;
        // 发短信任务
        for (let i = 0; i < dataArr.length; i++) {
            const {
                baseUrl,
                reportName,
                realname,
                orgName,
                star,
                parentPhoneNum,
            } = dataArr[i];

            if (this.app.config.self.env !== 'unittest') {
                tasksArr.push(async function() {
                    return await ctx.service.user.sendSms(
                        parentPhoneNum,
                        [
                            reportName,
                            realname,
                            realname,
                            orgName,
                            star,
                            `${baseUrl}`,
                        ],
                        EVA_REPO_TEMPLETID
                    );
                });
            }
        }

        const sendRetArr =
            this.app.config.self.env === 'unittest'
                ? Array(dataArr.length).fill(true)
                : await Promise.all(tasksArr.map(r => r.call()));

        for (let i = 0; i < dataArr.length; i++) {
            sendRetArr[i]
                ? successIds.push(dataArr[i].userReportId)
                : failArr.push(dataArr[i].realname);
        }

        // 修改isSend标识
        if (successIds.length) {
            await this.updateUserReportByCondition(
                { isSend: 1 },
                { id: { $in: successIds } }
            );
        }
        return failArr;
    }

    // 查看机构的全部班级的报告
    async adminGetReport(organizationId, days) {
        return await this.ctx.model.EvaluationUserReport.getClassAndEvalStatus(
            organizationId,
            days
        );
    }

    // 管理员查看班级报告
    async adminGetClassReport(classId, days) {
        return await this.ctx.model.EvaluationUserReport.getTeacherCommentStatistics(
            classId,
            days
        );
    }
}

module.exports = EvalReportService;
