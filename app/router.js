'use strict';

module.exports = app => {
    const { router, config, controller } = app;
    const selfConfig = config.self;
    const prefix = selfConfig.apiUrlPrefix;

    router.resources('index', prefix + 'index', controller.index);

    const email = controller.email;
    router.resources(prefix + 'emails', email);

    const users = controller.user;
    router.get(prefix + 'users/token', users.token);
    router.get(prefix + 'users/tokeninfo', users.tokeninfo);
    router.get(`${prefix}users/userInfo`, users.getUserInfo);
    router.put(`${prefix}users/userInfo`, users.updateUserInfo);
    router.put(`${prefix}users/parentPhoneNum`, users.updateParentphonenum);
    router.post(`${prefix}users/sendSms`, users.sendSms);
    router.post(`${prefix}users/verifyCode`, users.verifyCode);
    router.resources('users', prefix + 'users', users);

    const packages = controller.package;
    router.get(prefix + 'packages/hots', packages.hots);
    router.get(prefix + 'packages/search', packages.search);
    router.resources('packages', prefix + 'packages', packages);
    router.post(prefix + 'packages/:id/lessons', packages.addLesson);
    router.put(prefix + 'packages/:id/lessons', packages.putLesson);
    router.delete(prefix + 'packages/:id/lessons', packages.deleteLesson);
    router.get(prefix + 'packages/:id/lessons', packages.lessons);
    router.get(prefix + 'packages/:id/detail', packages.detail);
    router.post(prefix + 'packages/:id/audit', packages.audit);

    const lessons = controller.lesson;
    router.get(prefix + 'lessons/detail', lessons.detailByUrl);
    router.resources('lessons', prefix + 'lessons', lessons);
    router.post(prefix + 'lessons/:id/contents', lessons.release);
    router.get(prefix + 'lessons/:id/contents', lessons.content);
    router.get(prefix + 'lessons/:id/detail', lessons.detail);

    const packageLessons = controller.packageLesson;
    router.post(prefix + 'packageLessons/search', packageLessons.search);

    const subjects = controller.subject;
    router.resources('subjects', prefix + 'subjects', subjects);
    const skills = controller.skill;
    router.resources('skills', prefix + 'skills', skills);

    const admins = controller.admin;
    router.post(`${prefix}admins/query`, admins.query);
    router.post(`${prefix}admins/:resources/query`, admins.resourcesQuery);
    router.resources('admins', prefix + 'admins/:resources', admins);
    router.post('admins', prefix + 'admins/:resources/search', admins.search);
    // 刷数据更新user的vip和t等级
    router.get(
        `${prefix}admins/task/once/vipTLevelUpdate`,
        admins.vipTLevelUpdate
    );

    // 评估报告api
    const evaluationReport = controller.evaluationReport;
    router.post(`${prefix}evaluationReports`, evaluationReport.create);
    router.get(`${prefix}evaluationReports`, evaluationReport.index);
    router.post(
        `${prefix}evaluationReports/userReport`,
        evaluationReport.createUserReport
    );
    router.delete(`${prefix}evaluationReports/:id`, evaluationReport.destroy);
    router.put(
        `${prefix}evaluationReports/userReport/:id`,
        evaluationReport.updateUserReport
    );
    router.put(`${prefix}evaluationReports/:id`, evaluationReport.update);
    router.get(
        `${prefix}evaluationReports/statistics`,
        evaluationReport.evaluationStatistics
    );
    router.get(
        `${prefix}evaluationReports/evaluationCommentList`,
        evaluationReport.getEvaluationCommentList
    );
    router.get(
        `${prefix}evaluationReports/orgClassReport`,
        evaluationReport.adminGetReport
    );
    router.get(
        `${prefix}evaluationReports/classReport`,
        evaluationReport.getClassReport
    );
    router.get(`${prefix}evaluationReports/:id`, evaluationReport.show);
    router.delete(
        `${prefix}evaluationReports/userReport/:id`,
        evaluationReport.destroyUserReport
    );
    router.get(
        `${prefix}evaluationReports/userReport/:id`,
        evaluationReport.getUserReportDetail
    );
    router.post(
        `${prefix}evaluationReports/reportToParent`,
        evaluationReport.reportToParent
    );

    // 消息
    const userMessage = controller.userMessage;
    const message = controller.message;
    router.get(`${prefix}userMessages`, userMessage.index);
    router.put(`${prefix}userMessages/status`, userMessage.setStatus);
    router.get(`${prefix}userMessages/unReadCount`, userMessage.unReadCount);
    router.post(`${prefix}messages`, message.create);
    router.get(`${prefix}messages`, message.index);

    // -----------------------------add from coreservice--------------------------------------------------------
    // LESSON three
    const lessonOrganization = controller.lessonOrganization;
    router.get(`${prefix}lessonOrganizations/token`, lessonOrganization.token);
    router.get(
        `${prefix}lessonOrganizations/packages`,
        lessonOrganization.packages
    );
    router.get(
        `${prefix}lessonOrganizations/classAndMembers`,
        lessonOrganization.getClassAndMembers
    );
    router.get(
        `${prefix}lessonOrganizations/packageDetail`,
        lessonOrganization.packageDetail
    );
    router.get(
        `${prefix}lessonOrganizations/getByName`,
        lessonOrganization.getByName
    );
    router.get(
        `${prefix}lessonOrganizations/getByUrl`,
        lessonOrganization.getByUrl
    );
    router.get(
        `${prefix}lessonOrganizations/getMemberCountByRole`,
        lessonOrganization.getMemberCountByRole
    );
    router.get(
        `${prefix}lessonOrganizations/checkUserInvalid`,
        lessonOrganization.checkUserInvalid
    );
    router.get(
        `${prefix}lessonOrganizations/getOrgPackages`,
        lessonOrganization.getPackages
    );
    router.get(
        `${prefix}lessonOrganizations/getRealNameInOrg`,
        lessonOrganization.getRealNameInOrg
    );
    router.post(`${prefix}lessonOrganizations/login`, lessonOrganization.login);
    router.post(
        `${prefix}lessonOrganizations/search`,
        lessonOrganization.search
    );
    router.resources(`${prefix}lessonOrganizations`, lessonOrganization);

    // organization class
    const lessonOrganizationClass = controller.lessonOrganizationClass;
    router.get(
        `${prefix}lessonOrganizationClasses`,
        lessonOrganizationClass.index
    );
    router.get(
        `${prefix}lessonOrganizationClasses/history`,
        lessonOrganizationClass.history
    );
    router.post(
        `${prefix}lessonOrganizationClasses`,
        lessonOrganizationClass.create
    );
    router.get(
        `${prefix}lessonOrganizationClasses/:id/project`,
        lessonOrganizationClass.latestProject
    );
    router.put(
        `${prefix}lessonOrganizationClasses/:id`,
        lessonOrganizationClass.update
    );
    router.delete(
        `${prefix}lessonOrganizationClasses/:id`,
        lessonOrganizationClass.destroy
    );

    // organization class member
    const lessonOrganizationClassMember =
        controller.lessonOrganizationClassMember;
    router.get(
        `${prefix}lessonOrganizationClassMembers/student`,
        lessonOrganizationClassMember.student
    );
    router.get(
        `${prefix}lessonOrganizationClassMembers/teacher`,
        lessonOrganizationClassMember.teacher
    );
    router.post(
        `${prefix}lessonOrganizationClassMembers/bulk`,
        lessonOrganizationClassMember.bulkCreate
    );
    router.resources(
        `${prefix}lessonOrganizationClassMembers`,
        lessonOrganizationClassMember
    );

    // organization activate code
    const lessonOrganizationActivateCode =
        controller.lessonOrganizationActivateCode;
    router.post(
        `${prefix}lessonOrganizationActivateCodes/activate`,
        lessonOrganizationActivateCode.activate
    );
    router.post(
        `${prefix}lessonOrganizationActivateCodes/search`,
        lessonOrganizationActivateCode.index
    );
    router.resources(
        `${prefix}lessonOrganizationActivateCodes`,
        lessonOrganizationActivateCode
    );

    // organization form
    const lessonOrganizationForm = controller.lessonOrganizationForm;
    router.get(
        `${prefix}lessonOrganizationForms/:id/submit`,
        lessonOrganizationForm.getSubmit
    );
    router.post(
        `${prefix}lessonOrganizationForms/:id/submit`,
        lessonOrganizationForm.postSubmit
    );
    router.put(
        `${prefix}lessonOrganizationForms/:id/submit/:submitId`,
        lessonOrganizationForm.updateSubmit
    );
    router.post(
        `${prefix}lessonOrganizationForms/search`,
        lessonOrganizationForm.search
    );
    router.resources(
        `${prefix}lessonOrganizationForms`,
        lessonOrganizationForm
    );

    // organization
    const organization = controller.organizationIndex;
    router.post(`${prefix}organizations/log`, organization.log);
    router.post(`${prefix}organizations/changepwd`, organization.changepwd);
    // -----------------------------add from coreservice--------------------------------------------------------
};
