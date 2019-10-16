
const { app, assert } = require("egg-mock/bootstrap");

describe("test/controller/classrooms.test.js", () => {
	before(async () => {
		await app.model.LessonOrganization.truncate();
		await app.model.LessonOrganizationClass.truncate();
		await app.model.LessonOrganizationClassMember.truncate();
		await app.model.EvaluationReport.truncate();
		await app.model.EvaluationUserReport.truncate();

		// 创建机构，班级，老师，学生，管理员
		await app.model.LessonOrganization.create({ name: "什么机构" });
		await app.model.LessonOrganizationClass.create({ organizationId: 1, name: "什么班级" });
		await app.model.LessonOrganizationClassMember.create({ organizationId: 1, classId: 1, memberId: 1, roleId: 2, realname: "什么老师" });
		await app.model.LessonOrganizationClassMember.create({ organizationId: 1, classId: 1, memberId: 2, roleId: 1, realname: "什么学生" });
		await app.model.LessonOrganizationClassMember.create({ organizationId: 1, classId: 1, memberId: 3, roleId: 64, realname: "什么管理员" });
	});

	it("001 发起点评 应该成功", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().post("/evaluationReports").send({
			"name": "这是名字",
			"type": 1,
			"classId": 1
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data);

		assert(report.id === 1);
	});

	it("002 发起点评 学生身份调用接口，应该返回403", async () => {
		const user = await app.login({ id: 2 });
		const token = user.token;

		await app.httpRequest().post("/evaluationReports").send({
			"name": "这是名字",
			"type": 1,
			"classId": 1
		}).set("Authorization", `Bearer ${token}`).expect(403);
	});

	it("003 发起点评 name参数错误", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().post("/evaluationReports").send({
			"name": "",
			"type": 1,
			"classId": 1
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);

		assert(report.message === "报告名称长度错误");
	});

	it("004 发起点评 type参数错误", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().post("/evaluationReports").send({
			"name": "这是名字",
			"type": 3,
			"classId": 1
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);

		assert(report.message === "报告类型错误");
	});

	it("005 发起点评 classId参数错误", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().post("/evaluationReports").send({
			"name": "这是名字",
			"type": 1,
			"classId": 0
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);

		assert(report.message === "班级id错误");
	});

	it("006 获取发起的点评列表 应该拿到一个记录", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().get(`/evaluationReports?classId=1&roleId=2`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data);

		assert(report.length === 1 && report[0].id === 1);
	});

	it("007 获取发起的点评列表 班级id传错 应该返回空数组", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		const report = await app.httpRequest().get(`/evaluationReports?classId=2&roleId=2`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data);

		assert(report.length === 0);
	});

	it("008 获取发起的点评列表 参数classId传错 应该返回400", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;

		await app.httpRequest().get(`/evaluationReports?classId=0&roleId=2`)
			.set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body.data);
	});

	it("009 获取发起的点评列表 加name筛选", async () => {
		const user = await app.login({ id: 1 });
		const token = user.token;
		const ctx = app.mockContext();

		const report = await app.httpRequest().get(`/evaluationReports?classId=1&roleId=2&name=${ctx.helper.escape("这")}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data);

		assert(report.length === 1 && report[0].id === 1);
	});

});