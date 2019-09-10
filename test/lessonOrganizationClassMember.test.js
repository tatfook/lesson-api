
const md5 = require("blueimp-md5");
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("机构学生", () => {
	before(async () => {
		await app.keepworkModel.Users.sync({ force: true });
	});

	it("001 机构学生添加", async () => {
		const user = await app.adminLogin();
		const token = user.token;

		let user2 = await app.keepworkModel.Users.create({ username: "user005", password: md5("123456") });
		user2 = user2.get();
		// 创建机构
		const organ = await app.model.lessonOrganizations.create({ name: "org0000", count: 1 }).then(o => o.toJSON());

		// 创建班级
		let cls = await app.model.lessonOrganizationClasses.create({
			name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		let cls2 = await app.model.lessonOrganizationClasses.create({
			name: "clss001", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		// 添加为管理员
		await app.model.lessonOrganizationClassMembers.create({
			organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0
		});

		// 测试接口添加学生
		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ memberId: user2.id, organizationId: organ.id, classIds: [cls.id] })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ memberId: user2.id, organizationId: organ.id, classIds: [0] })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ memberId: user2.id, organizationId: organ.id, classIds: [cls.id, cls2.id] })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		await app.httpRequest().post("/lessonOrganizationClassMembers")
			.send({ memberId: user2.id, organizationId: organ.id, classIds: [cls.id] })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		// 学生
		let students = await app.httpRequest().get(`/lessonOrganizationClassMembers/student?classId=${cls.id}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(students.count === 1);

		// 移除班级成员
		await app.httpRequest().delete(`/lessonOrganizationClassMembers/${students.rows[0].id}?roleId=1`)
			.set("Authorization", `Bearer ${token}`).expect(200);

		students = await app.httpRequest().get(`/lessonOrganizationClassMembers/student?classId=${cls.id}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(students.count === 0);

		students = await app.httpRequest().get(`/lessonOrganizationClassMembers/student?classId=${cls2.id}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(students.count === 0);

		// 教师
		let teachers = await app.httpRequest().get(`/lessonOrganizationClassMembers/teacher?classId=${cls2.id}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(teachers.length === 0);

		let user3 = app.keepworkModel.Users.create({ username: "jacky", password: md5("123456") });
		user3 = user3.get();
		await app.model.lessonOrganizationClassMembers.create({
			organizationId: organ.id, classId: cls2.id, roleId: 2, memberId: user3.id
		});

		teachers = await app.httpRequest().get(`/lessonOrganizationClassMembers/teacher?classId=${cls2.id}`)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(teachers.length === 1);
	});
});
