const md5 = require("blueimp-md5");
const { app, assert } = require("egg-mock/bootstrap");

describe("lesson organization class", () => {
	before(async () => {
		await app.keepworkModel.Users.sync({ force: true });
		await app.model.LessonOrganization.sync({ force: true });
		await app.model.LessonOrganizationClassMember.sync({ force: true });
		await app.model.LessonOrganizationClass.sync({ force: true });
	});

	it("001 班级结业与恢复 删除班级 班级列表", async () => {
		// const user = await app.factory.create("users", { username: "user009", password: md5("123456") });
		const user = await app.keepworkModel.Users.create({ username: "user009", password: md5("123456") });
		await app.keepworkModel.Users.create({ username: "user007", password: md5("123456") });

		// 创建机构
		const organ = await app.model.LessonOrganization.create({ name: "org0000", count: 1 }).then(o => o.toJSON());
		// 创建班级成员
		await app.model.LessonOrganizationClassMember.create({
			organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0
		});

		// 登录机构
		const token = await app.httpRequest().post("/lessonOrganizations/login").send({
			organizationId: organ.id, username: "user009", password: "123456"
		}).expect(200).then(res => res.body.token).catch(e => console.log(e));

		// 创建班级
		let cls = await app.httpRequest().post("/lessonOrganizationClasses")
			.send({
				name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
			})
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		await app.model.LessonOrganizationClassMember.create({
			organizationId: organ.id, memberId: 1, roleId: 1, classId: cls.id
		});

		// 再创建一个班级
		let class2 = await app.httpRequest().post("/lessonOrganizationClasses")
			.send({
				name: "clss008", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
			})
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		// 更新班级;
		await app.httpRequest().put(`/lessonOrganizationClasses/${cls.id}`).send({
			name: "newClassName"
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		// 班级列表
		let class_ = await app.httpRequest().get("/lessonOrganizationClasses")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(class_.length === 2);
		assert(class_[0].name === "clss008" || class_[0].name === "newClassName");
		assert(class_[1].name === "newClassName" || class_[1].name === "clss008");

		// 删除班级
		await app.httpRequest().delete("/lessonOrganizationClasses/" + class2.id)
			.set("Authorization", `Bearer ${token}`).expect(200);

		class_ = await app.httpRequest().get("/lessonOrganizationClasses")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(class_.length === 1);
		assert(class_[0].name === "newClassName");

		class_ = await app.httpRequest().get("/lessonOrganizationClasses?roleId=1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(class_.length === 1);

		class_ = await app.httpRequest().get("/lessonOrganizationClasses?roleId=64")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(class_.length === 0);

		// 结业班级
		await app.httpRequest().put("/lessonOrganizationClasses/" + cls.id).send({
			end: "2019-01-01"
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		cls = await app.model.LessonOrganizationClass.findOne({ where: { id: cls.id }}).then(o => o && o.toJSON());
		assert(new Date(cls.end).getTime() === new Date("2019-01-01").getTime());

		// 添加新成员
		await app.model.LessonOrganizationClassMember.create({
			organizationId: organ.id, memberId: 2, roleId: 1, classId: cls.id
		});

		// 恢复结业班级
		await app.httpRequest().put("/lessonOrganizationClasses/" + cls.id).send({
			end: "2040-01-01"
		}).set("Authorization", `Bearer ${token}`).expect((res) => {
			assert(res.statusCode === 400);
		});

		// 历史班级
		const hisClass = await app.httpRequest().get("/lessonOrganizationClasses/history")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		assert(hisClass.count === 1);
	});

	it("002 获取机构学生", async () => {
		// await app.factory.createMany("users", 10);
		const user = await app.keepworkModel.Users.create({ username: "user001", password: md5("123456") }).then(o => o.toJSON());
		const organ = await app.model.LessonOrganization.create({ name: "org1111", count: 100 }).then(o => o.toJSON());
		// 创建班级 student=3 teacher=2
		const cls1 = await app.model.LessonOrganizationClass.create({
			name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());
		// 班级2过期  student=2 teacher=1
		const cls2 = await app.model.LessonOrganizationClass.create({
			name: "clss001", organizationId: organ.id, begin: new Date(), end: new Date().getTime() - 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());
		const cls3 = await app.model.LessonOrganizationClass.create({
			name: "clss002", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		// 创建班级成员
		await app.model.LessonOrganizationClassMember.create({ organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0 });
		await app.model.LessonOrganizationClassMember.create({ organizationId: organ.id, memberId: 1, roleId: 3, classId: cls1.id });
		await app.model.LessonOrganizationClassMember.create({ organizationId: organ.id, memberId: 2, roleId: 3, classId: cls2.id });
		await app.model.LessonOrganizationClassMember.create({ organizationId: organ.id, memberId: 3, roleId: 1, classId: cls3.id });

		// 登录机构
		const token = await app.httpRequest().post("/lessonOrganizations/login").send({
			organizationId: organ.id, username: "user001", password: "123456"
		}).expect(200).then(res => res.body.token).catch(e => console.log(e));

		// 获取学生0
		let students = await app.httpRequest().get("/lessonOrganizationClassMembers/student")
			.set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(students.count === 2);

		students = await app.httpRequest()
			.get("/lessonOrganizationClassMembers/student?classId=" + cls1.id)
			.set("Authorization", `Bearer ${token}`)
			.expect(res => assert(res.statusCode === 200)).then(res => res.body);
		assert(students.count === 1);

		// 获取老师
		let teachers = await app.httpRequest()
			.get("/lessonOrganizationClassMembers/teacher")
			.set("Authorization", `Bearer ${token}`)
			.expect(res => assert(res.statusCode === 200)).then(res => res.body);
		assert(teachers.length === 2);
	});

	it("003 机构过期测试", async () => {
		const user = await app.keepworkModel.Users.create({ username: "jacky", password: md5("123456") }).then(o => o.toJSON());
		const organ = await app.model.LessonOrganization.create({ name: "org666", count: 100 }).then(o => o.toJSON());
		const cls1 = await app.model.LessonOrganizationClass.create({
			name: "clss0009", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		await app.model.LessonOrganizationClassMember.create({
			organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0
		});

		// 过期机构
		await app.model.LessonOrganization.update({ endDate: "2019-01-01" }, { where: { id: organ.id }});

		const token = await app.httpRequest().post("/lessonOrganizations/login")
			.send({ organizationId: organ.id, username: "jacky", password: "123456" })
			.expect(200).then(res => res.body.token).catch(e => console.log(e));
		assert(token);

		// 生成激活码
		await app.httpRequest()
			.post("/lessonOrganizationActivateCodes")
			.set("Authorization", `Bearer ${token}`).send({ classId: cls1.id, count: 2 })
			.expect(400).then(res => res.body);

		// 不过期机构
		await app.model.LessonOrganization.update({ endDate: "2119-01-01" }, { where: { id: organ.id }});
		const list = await app.httpRequest()
			.post("/lessonOrganizationActivateCodes")
			.set("Authorization", `Bearer ${token}`)
			.send({ classId: cls1.id, count: 2 }).expect(200).then(res => res.body);
		assert(list.length === 2);

		const usertoken = await app.login().then(o => o.token);
		const key = list[0].key;
		// 激活激活码;
		const ok = await app.httpRequest()
			.post("/lessonOrganizationActivateCodes/activate")
			.set("Authorization", `Bearer ${usertoken}`)
			.send({ key, organizationId: organ.id }).expect(200).then(res => res.body).catch(e => console.log(e));
		// assert(ok);
	});

});
