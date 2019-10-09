
const md5 = require("blueimp-md5");
const { app, assert } = require("egg-mock/bootstrap");

describe("机构用户", () => {
	before(async () => {
		await app.keepworkModel.Users.truncate();
		await app.model.LessonOrganizationActivateCode.sync({ force: true });
		await app.model.LessonOrganizationClassMember.sync({ force: true });
		await app.model.LessonOrganization.sync({ force: true });
		await app.model.LessonOrganizationClass.sync({ force: true });
	});

	it("001 用户绑定 解绑", async () => {
		// const user = await app.adminLogin();
		// const token = user.token;

		await app.keepworkModel.Users.create({ id: 1, realname: "110", username: "test", roleId: 64, password: md5("123456") });

		// 创建机构
		const organ = await app.model.LessonOrganization.create({
			name: "org0000", count: 1, endDate: new Date("2200-01-01")
		}).then(o => o.toJSON());

		// 创建班级
		let cls = await app.model.LessonOrganizationClass.create({
			name: "clss000", organizationId: organ.id, begin: new Date(), end: new Date().getTime() + 1000 * 60 * 60 * 24
		}).then(o => o.toJSON());

		// 创建班级成员
		await app.model.LessonOrganizationClassMember.create({
			organizationId: organ.id, memberId: 1, roleId: 64, classId: cls.id, bind: 1
		});

		// 接口废弃
		// const users = await app.httpRequest().post("/lessonOrganizationUsers/batch").send({
		// 	classId: cls.id,
		// 	organizationId: organ.id,
		// 	count: 3,
		// }).set("Authorization", `Bearer ${token}`)
		// 	.expect(200).then(res => res.body).catch(e => console.log(e));
		// assert(users.length == 3);

		// 修改绑定用户密码; 接口废弃
		// await app.httpRequest().post("/lessonOrganizationUsers/setpwd").send({
		// 	classId: cls.id,
		// 	organizationId: organ.id,
		// 	memberId: 1,
		// 	password: "xiaoyao",
		// }).set("Authorization", `Bearer ${token}`)
		// 	.expect(200).then(res => res.body).catch(e => console.log(e));

		// 解绑用户 接口废弃
		// await app.httpRequest().post("/lessonOrganizationUsers/unbind").send({
		// 	classId: cls.id,
		// 	organizationId: organ.id,
		// }).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body).catch(e => console.log(e));
	});
});
