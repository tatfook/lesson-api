// const md5 = require("blueimp-md5");
const { app, assert } = require("egg-mock/bootstrap");

describe("机构表单", () => {
	before(async () => {
	});

	it("001 机构", async () => {
		const user = await app.adminLogin();
		const token = user.token;

		// 创建机构
		const organ = await app.model.lessonOrganizations.create({
			name: "org0000", count: 1, endDate: new Date("2200-01-01")
		}).then(o => o.toJSON());
		// 创建管理员
		await app.model.lessonOrganizationClassMembers.create({ organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0 });

		// 创建表单1
		let form = await app.httpRequest().post("/lessonOrganizationForms").set("Authorization", `Bearer ${token}`).send({
			organizationId: organ.id,
			type: 3,
			title: "测试",
			description: "报名表单",
			quizzes: [{
				title: "这是一个问答题?",
			}],
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		assert(form.id);
		const formId = form.id;

		// 创建表单2
		form = await app.httpRequest().post("/lessonOrganizationForms").set("Authorization", `Bearer ${token}`).send({
			organizationId: organ.id,
			type: 3,
			title: "进行中的表单",
			description: "报名表单",
			quizzes: [{
				title: "这是一个问答题?",
			}],
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(form.id);


		// 修改表单  改为进行中
		await app.httpRequest().put("/lessonOrganizationForms/" + form.id).set("Authorization", `Bearer ${token}`).send({
			organizationId: organ.id,
			state: 1
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);


		// 检索表单
		let forms = await app.httpRequest().post(`/lessonOrganizationForms/search`).send({
			organizationId: organ.id,
			state: 1,
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(forms.length == 1);


		// 检索全部表单
		forms = await app.httpRequest()
			.post(`/lessonOrganizationForms/search`)
			.send({ organizationId: organ.id })
			.expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(forms.length == 2);

		// 删除表单
		await app.httpRequest()
			.delete("/lessonOrganizationForms/" + formId)
			.set("Authorization", `Bearer ${token}`)
			.expect(res => assert(res.statusCode == 200)).then(res => res.body);

		// 检索全部表单
		forms = await app.httpRequest()
			.post(`/lessonOrganizationForms/search`)
			.send({ organizationId: organ.id })
			.expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(forms.length == 1);

		// 提交表单
		const submit = await app.httpRequest().post(`/lessonOrganizationForms/${form.id}/submit`).send({
			quizzes: [{
				title: "这是一个问答题?",
			}],
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		await app.httpRequest().post(`/lessonOrganizationForms/${form.id}/submit`).send({
			quizzes: [{
				title: "这是一个问答题?",
			}],
		}).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		// 更改提交
		await app.httpRequest().put(`/lessonOrganizationForms/${form.id}/submit/${submit.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				organizationId: organ.id,
				state: 1,
			}).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		// 获取提交列表
		const submits = await app.httpRequest()
			.get(`/lessonOrganizationForms/${form.id}/submit?organizationId=${organ.id}`)
			.set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(submits.count == 2);
	});
});
