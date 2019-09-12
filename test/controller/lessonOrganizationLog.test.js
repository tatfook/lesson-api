
const md5 = require("blueimp-md5");
const { app, assert } = require("egg-mock/bootstrap");

describe("机构", () => {
	before(async () => {
		await app.keepworkModel.Users.sync({ force: true });
		await app.model.LessonOrganizationActivateCode.sync({ force: true });
		await app.model.LessonOrganizationClassMember.sync({ force: true });
		await app.model.LessonOrganization.sync({ force: true });
		await app.model.LessonOrganizationClass.sync({ force: true });
		await app.model.LessonOrganizationPackage.sync({ force: true });
	});

	it("001 机构日志", async () => {
		// 构建用户
		const user = await app.keepworkModel.Users.create({ username: "user001", password: md5("123456") });
		// const user = await app.factory.create("users", { username: "user001", password: md5("123456") });
		// await app.factory.createMany("users", 10, { password: md5("123456") });

		// 创建机构
		const organ = await app.model.LessonOrganization.create({ name: "org0000", count: 1, endDate: "2119-01-01" }).then(o => o.toJSON());

		// 管理员创建
		await app.model.LessonOrganizationClassMember.create({ organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0 });

		// 登录机构
		const token = await app.httpRequest().post("/lessonOrganizations/login").send({
			organizationId: organ.id, username: "user001", password: "123456"
		}).expect(200).then(res => res.body.token).catch(e => console.log(e));

		// 允许老师管理学生
		await app.httpRequest().put("/lessonOrganizations/" + organ.id)
			.send({ privilege: 1 }).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 不允许老师管理学生
		await app.httpRequest().put("/lessonOrganizations/" + organ.id)
			.send({ privilege: 2 }).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 创建班级
		const cls = await app.httpRequest().post("/lessonOrganizationClasses")
			.send({ organizationId: organ.id, name: "class000", begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		assert(cls.id);
		const cls2 = await app.httpRequest().post("/lessonOrganizationClasses")
			.send({ organizationId: organ.id, name: "class001", begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 更新班级
		await app.httpRequest().put("/lessonOrganizationClasses/" + cls.id)
			.send({ name: "class0000", end: "2110-01-01", packages: [] })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 添加老师
		let member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [0], memberId: 2, realname: "xiaoyao", roleId: 2 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		// 老师改名
		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [0], memberId: 2, realname: "xiaoyao1", roleId: 2 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 移除老师
		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [], memberId: 2, realname: "xiaoyao", roleId: 2 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 测试生成激活码
		await app.httpRequest().post("/lessonOrganizationActivateCodes")
			.send({ organizationId: organ.id, count: 20, classId: cls.id })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data).catch(e => console.log(e));

		// 添加班级老师
		member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [0, cls.id], memberId: 2, realname: "xiaoyao", roleId: 2 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		// 移除班级老师
		member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [0], memberId: 2, realname: "xiaoyao", roleId: 2 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 添加班级学生
		member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [cls.id, cls2.id], memberId: 2, realname: "xiaoyao", roleId: 1 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		// 移除班级学生 并改名
		member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [cls.id], memberId: 2, realname: "xiaoyao1", roleId: 1 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 改密码
		await app.httpRequest().post("/organizations/changepwd")
			.send({ organizationId: organ.id, classId: cls.id, memberId: 2, password: "test123" })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));

		// 移除学生
		member = await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ organizationId: organ.id, classIds: [], memberId: 2, realname: "xiaoyao1", roleId: 1 })
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		// 获取机构日志
		const logs = await app.httpRequest().post("/organizations/log")
			.send({ organizationId: organ.id })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body).catch(e => console.log(e));
	});
});
