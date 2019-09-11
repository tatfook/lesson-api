
const md5 = require("blueimp-md5");
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("机构激活码", () => {
	before(async () => {
		// const lessons = app.model.Lessons;
		// const subjects = app.model.Subjects;
		// const skills = app.model.Skills;
		// await lessons.sync({ force: true });
		// await subjects.sync({ force: true });
		// await skills.sync({ force: true });
		// await app.model.LessonSkills.sync({ force: true });
		// await app.model.LearnRecords.sync({ force: true });
		// await app.model.UserLearnRecords.sync({ force: true });
		// await app.model.Packages.sync({ force: true });
		// await app.model.Subscribes.sync({ force: true });
		// await app.model.LessonRewards.sync({ force: true });
		// await app.model.PackageLessons.sync({ force: true });
		// await app.model.LessonContents.sync({ force: true });
		// await app.model.Teachers.sync({ force: true });
		// await app.model.TeacherCDKeys.sync({ force: true });
		// await app.model.Classrooms.sync({ force: true });
		// await app.model.Users.sync({ force: true });
		// await app.keepworkModel.Users.sync({ force: true });
		// await app.model.lessonOrganizationLogs.sync({ force: true });
		// await app.model.lessonOrganizationClassMembers.sync({ force: true });
	});

	it("001 机构激活码", async () => {
		const user = await app.adminLogin();
		const token = user.token;

		// 创建机构
		const organ = await app.model.lessonOrganizations.create({
			name: "org0000", count: 1, endDate: new Date("2200-01-01")
		}).then(o => o.toJSON());
		assert(organ.id);

		// 创建班级
		let cls = await app.model.lessonOrganizationClasses.create({
			name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());
		assert(cls.id);

		// 添加为管理员
		let mem = await app.model.lessonOrganizationClassMembers.create({
			organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0
		});
		assert(mem.id);

		// 测试生成激活码
		await app.httpRequest().post("/lessonOrganizationActivateCodes").send({
			organizationId: organ.id,
			count: 20,
			classId: cls.id,
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body.data).catch(e => console.log(e));

		// organizationId错误
		await app.httpRequest().post("/lessonOrganizationActivateCodes").send({
			organizationId: 999,
			count: 20,
			classId: cls.id,
		}).set("Authorization", `Bearer ${token}`).expect(411);

		// 无效机构
		const user2 = await app.adminLogin({ organizationId: 999 });
		const token2 = user2.token;
		await app.httpRequest().post("/lessonOrganizationActivateCodes").send({
			organizationId: 999,
			count: 20,
			classId: cls.id,
		}).set("Authorization", `Bearer ${token2}`).expect(400);

		// 测试获取激活码
		let Activecode = await app.httpRequest().get("/lessonOrganizationActivateCodes?organizationId=" + organ.id)
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
		assert(Activecode.count === 20 && Activecode.rows.length === 20);

		// 获取机构的激活码
		Activecode = await app.httpRequest().post("/lessonOrganizationActivateCodes/search").send({
			state: 0,
			classId: cls.id
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(Activecode.count === 20);

		// 使用激活码
		let member = await app.httpRequest().post("/lessonOrganizationActivateCodes/activate").send({
			key: Activecode.rows[0].key,
			realname: "",
			organizationId: organ.id
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(member);

		// 一个码只能用一次
		let ret = await app.httpRequest().post("/lessonOrganizationActivateCodes/activate").send({
			key: Activecode.rows[0].key,
			realname: "",
			organizationId: organ.id
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);
		assert(ret.code === 2);

		// 应该少了一个
		Activecode = await app.httpRequest().post("/lessonOrganizationActivateCodes/search").send({
			state: 0,
			classId: cls.id
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert(Activecode.count === 19);

		// 激活码不属于这个机构
		ret = await app.httpRequest().post("/lessonOrganizationActivateCodes/activate").send({
			key: Activecode.rows[0].key,
			realname: "",
			organizationId: 999
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);
		assert(ret.code === 7);

		// 已经是该班级学生
		ret = await app.httpRequest().post("/lessonOrganizationActivateCodes/activate").send({
			key: Activecode.rows[0].key,
			realname: "",
			organizationId: organ.id
		}).set("Authorization", `Bearer ${token}`).expect(400).then(res => res.body);
		assert(ret.code === 6);

		// 人数已达上限
		const user2token = await app.login({ id: 2 }).then(res => res.token);
		ret = await app.httpRequest().post("/lessonOrganizationActivateCodes/activate").send({
			key: Activecode.rows[0].key,
			realname: "",
			organizationId: organ.id
		}).set("Authorization", `Bearer ${user2token}`).expect(400).then(res => res.body);
		assert(ret.code === 5);

	});
});