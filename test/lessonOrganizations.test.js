const md5 = require("blueimp-md5");
const { app } = require("egg-mock/bootstrap");

describe("机构", () => {
	before(async () => {
		await app.keepworkModel.Users.sync({ force: true });
	});

	it("001 机构", async () => {
		// const user = await app.factory.create("users", { username: "user001", password: md5("123456"), roleId: 64 });
		// await app.factory.createMany("users", 10, { password: md5("123456") });
		const user = await app.keepworkModel.Users.create({ username: "user001", password: md5("123456"), roleId: 64 });
		// 创建机构
		const organ = await app.model.lessonOrganizations.create({ name: "org0000", count: 1 }).then(o => o.toJSON());

		// 创建班级
		let cls = await app.model.lessonOrganizationClasses.create({
			name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		// 创建班级成员
		// 
		await app.model.lessonOrganizationClassMembers.create({ organizationId: organ.id, memberId: user.id, roleId: 64, classId: 0 });
		await app.model.lessonOrganizationClassMembers.create({ organizationId: organ.id, memberId: 1, roleId: 1, classId: cls.id });
		await app.model.lessonOrganizationClassMembers.create({ organizationId: organ.id, memberId: 2, roleId: 2, classId: cls.id });

		// 登录机构
		const token = await app.httpRequest()
			.post("/lessonOrganizations/login")
			.send({ organizationId: organ.id, username: "user001", password: "123456" })
			.expect(200).then(res => res.body.token).catch(e => console.log(e));

		// 修改机构过期时间
		await app.httpRequest().put("/lessonOrganizations/" + organ.id)
			.send({ endDate: "2019-01-01" })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body.data).catch(e => console.log(e));

		// 获取学生
	});
});
