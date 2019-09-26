"use strict";

module.exports = app => {
	const { router, config, controller } = app;
	const selfConfig = config.self;
	const prefix = selfConfig.apiUrlPrefix;

	console.log(selfConfig);
	console.log(config.sequelize);

	router.resources("index", prefix + "index", controller.index);

	const email = controller.email;
	router.resources(prefix + "emails", email);

	const users = controller.user;
	router.get(prefix + "users/token", users.token);
	router.get(prefix + "users/tokeninfo", users.tokeninfo);
	router.post(prefix + "users/expense", users.expense);
	router.resources("users", prefix + "users", users);
	router.post(prefix + "users/:id/applyTeacher", users.applyTeacher);
	router.post(prefix + "users/:id/teacher", users.teacher);
	// router.post(prefix + "users/:id/subscribes", users.postSubscribes);
	router.get(prefix + "users/:id/subscribes", users.getSubscribes);
	router.get(prefix + "users/:id/isSubscribe", users.isSubscribe);
	router.get(prefix + "users/:id/coins", users.coins);
	router.get(prefix + "users/:id/skills", users.skills);
	router.get(prefix + "users/:id/isTeach", users.isTeach);
	router.post(prefix + "users/tutorCB", users.tutorCB);
	router.post(prefix + "users/tutorServiceCB", users.tutorServiceCB);
	router.post(prefix + "users/allianceMemberCB", users.allianceMemberCB);

	const packages = controller.package;
	router.get(prefix + "packages/teach", packages.teach);
	router.get(prefix + "packages/hots", packages.hots);
	router.get(prefix + "packages/search", packages.search);
	router.resources("packages", prefix + "packages", packages);
	router.post(prefix + "packages/:id/lessons", packages.addLesson);
	router.put(prefix + "packages/:id/lessons", packages.putLesson);
	router.delete(prefix + "packages/:id/lessons", packages.deleteLesson);
	router.get(prefix + "packages/:id/lessons", packages.lessons);
	router.get(prefix + "packages/:id/detail", packages.detail);
	router.post(prefix + "packages/:id/subscribe", packages.subscribe);
	router.post(prefix + "packages/buy", packages.buy);
	router.get(prefix + "packages/:id/isSubscribe", packages.isSubscribe);
	router.post(prefix + "packages/:id/audit", packages.audit);

	const lessons = controller.lesson;
	router.get(prefix + "lessons/detail", lessons.detailByUrl);
	router.resources("lessons", prefix + "lessons", lessons);
	router.post(prefix + "lessons/:id/skills", lessons.addSkill);
	router.delete(prefix + "lessons/:id/skills", lessons.deleteSkill);
	router.get(prefix + "lessons/:id/skills", lessons.getSkills);
	router.post(prefix + "lessons/:id/learnRecords", lessons.createLearnRecords);
	router.put(prefix + "lessons/:id/learnRecords", lessons.updateLearnRecords);
	router.get(prefix + "lessons/:id/learnRecords", lessons.getLearnRecords);
	router.post(prefix + "lessons/:id/contents", lessons.release);
	router.get(prefix + "lessons/:id/contents", lessons.content);
	router.get(prefix + "lessons/:id/detail", lessons.detail);

	const packageLessons = controller.packageLesson;
	router.post(prefix + "packageLessons/search", packageLessons.search);
	// router.resources(prefix + "packageLessons", packageLessons);

	const classrooms = controller.classroom;
	router.get(prefix + "classrooms/getByKey", classrooms.getByKey);
	router.get(prefix + "classrooms/current", classrooms.current);
	router.get(prefix + "classrooms/valid", classrooms.valid);
	router.post(prefix + "classrooms/join", classrooms.join);
	router.post(prefix + "classrooms/quit", classrooms.quit);
	router.resources("classrooms", prefix + "classrooms", classrooms);
	router.get(prefix + "classrooms/:id/learnRecords", classrooms.getLearnRecords);
	router.put(prefix + "classrooms/:id/learnRecords", classrooms.updateLearnRecords);
	router.post(prefix + "classrooms/:id/learnRecords", classrooms.createLearnRecords);
	router.put(prefix + "classrooms/:id/dismiss", classrooms.dismiss);

	const learnRecords = controller.learnRecord;
	router.get(prefix + "learnRecords/reward", learnRecords.getReward);
	router.post(prefix + "learnRecords/:id/reward", learnRecords.createReward);
	router.resources(prefix + "learnRecords", learnRecords);

	const subjects = controller.subject;
	router.resources("subjects", prefix + "subjects", subjects);
	// router.resources("subjects", prefix + "admins/subjects", subjects);
	const skills = controller.skill;
	router.resources("skills", prefix + "skills", skills);
	// router.resources("skills", prefix + "admins/skills", skills);

	const teacherCDKeys = controller.teacherCDKey;
	router.post(prefix + "admins/teacherCDKeys/generate", teacherCDKeys.generate);
	router.resources("teacherCDKeys", prefix + "admins/teacherCDKeys", teacherCDKeys);

	const admins = controller.admin;
	router.post(`${prefix}admins/query`, admins.query);
	router.post(`${prefix}admins/:resources/query`, admins.resourcesQuery);
	router.resources("admins", prefix + "admins/:resources", admins);
	router.post("admins", prefix + "admins/:resources/search", admins.search);

	const pays = controller.pay;
	router.post("pays", prefix + "pays/callback", pays.callback);
	router.resources(prefix + "pays", pays);

	const trades = controller.trade;
	router.resources(prefix + "trades", trades);

	// -----------------------------add from coreservice--------------------------------------------------------
	// LESSON three 
	const lessonOrganization = controller.lessonOrganization;
	router.get(`${prefix}lessonOrganizations/token`, lessonOrganization.token);
	router.get(`${prefix}lessonOrganizations/packages`, lessonOrganization.packages);
	router.get(`${prefix}lessonOrganizations/packageDetail`, lessonOrganization.packageDetail);
	router.get(`${prefix}lessonOrganizations/getByName`, lessonOrganization.getByName);
	router.get(`${prefix}lessonOrganizations/getByUrl`, lessonOrganization.getByUrl);
	router.post(`${prefix}lessonOrganizations/login`, lessonOrganization.login);
	router.post(`${prefix}lessonOrganizations/search`, lessonOrganization.search);
	router.resources(`${prefix}lessonOrganizations`, lessonOrganization);
	// router.post(`${prefix}lessonOrganizations`, lessonOrganization.create);
	// router.get(`${prefix}lessonOrganizations/:id`, lessonOrganization.show);
	// router.put(`${prefix}lessonOrganizations/:id`, lessonOrganization.update);

	// organization class
	const lessonOrganizationClass = controller.lessonOrganizationClass;
	router.get(`${prefix}lessonOrganizationClasses`, lessonOrganizationClass.index);
	router.get(`${prefix}lessonOrganizationClasses/history`, lessonOrganizationClass.history);
	router.post(`${prefix}lessonOrganizationClasses`, lessonOrganizationClass.create);
	router.get(`${prefix}lessonOrganizationClasses/:id/project`, lessonOrganizationClass.latestProject);
	router.put(`${prefix}lessonOrganizationClasses/:id`, lessonOrganizationClass.update);
	router.delete(`${prefix}lessonOrganizationClasses/:id`, lessonOrganizationClass.destroy);

	// organization class member 
	const lessonOrganizationClassMember = controller.lessonOrganizationClassMember;
	router.get(`${prefix}lessonOrganizationClassMembers/student`, lessonOrganizationClassMember.student);
	router.get(`${prefix}lessonOrganizationClassMembers/teacher`, lessonOrganizationClassMember.teacher);
	router.post(`${prefix}lessonOrganizationClassMembers/bulk`, lessonOrganizationClassMember.bulkCreate);
	router.resources(`${prefix}lessonOrganizationClassMembers`, lessonOrganizationClassMember);

	// organization activate code
	const lessonOrganizationActivateCode = controller.lessonOrganizationActivateCode;
	router.post(`${prefix}lessonOrganizationActivateCodes/activate`, lessonOrganizationActivateCode.activate);
	router.post(`${prefix}lessonOrganizationActivateCodes/search`, lessonOrganizationActivateCode.index);
	router.resources(`${prefix}lessonOrganizationActivateCodes`, lessonOrganizationActivateCode);

	// organization user 
	const lessonOrganizationUser = controller.lessonOrganizationUser;
	router.post(`${prefix}lessonOrganizationUsers/batch`, lessonOrganizationUser.batchCreateUser);
	router.post(`${prefix}lessonOrganizationUsers/unbind`, lessonOrganizationUser.unbind);
	router.post(`${prefix}lessonOrganizationUsers/setpwd`, lessonOrganizationUser.setpwd);

	// organization form
	const lessonOrganizationForm = controller.lessonOrganizationForm;
	router.get(`${prefix}lessonOrganizationForms/:id/submit`, lessonOrganizationForm.getSubmit);
	router.post(`${prefix}lessonOrganizationForms/:id/submit`, lessonOrganizationForm.postSubmit);
	router.put(`${prefix}lessonOrganizationForms/:id/submit/:submitId`, lessonOrganizationForm.updateSubmit);
	router.post(`${prefix}lessonOrganizationForms/search`, lessonOrganizationForm.search);
	router.resources(`${prefix}lessonOrganizationForms`, lessonOrganizationForm);

	// organization 
	const organization = controller.organizationIndex;
	router.post(`${prefix}organizations/log`, organization.log);
	router.post(`${prefix}organizations/changepwd`, organization.changepwd);
	// -----------------------------add from coreservice--------------------------------------------------------
};
