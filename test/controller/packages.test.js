
const { app, mock, assert } = require("egg-mock/bootstrap");
const md5 = require("blueimp-md5");

describe("test/controller/packages.test.js", () => {
	before(async () => {
		const packages = app.model.Package;
		const lessons = app.model.Lesson;
		const packageLessons = app.model.PackageLesson;
		const subjects = app.model.Subject;
		const skills = app.model.Skill;
		await packages.truncate();
		await lessons.truncate();
		await packageLessons.truncate();
		await subjects.truncate();
		await skills.truncate();
		await app.model.LessonSkill.truncate();
		await app.model.Subscribe.truncate();
		await app.model.PackageSort.truncate();
		await app.model.User.truncate();

		await subjects.create({
			subjectName: "前端",
		});
		await subjects.create({
			subjectName: "后端",
		});
		await skills.create({
			skillName: "唱歌",
		});
		await skills.create({
			skillName: "跳舞",
		});

		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await await app.httpRequest()
			.get("/users")
			.set("Authorization", `Bearer ${token}`).expect(200);
		// await lessons.create({
		// userId: 1,
		// lessonName: "HTML",
		// subjectId:1,
		// skills: [{id:1, score:10}, {id:2, score:8}],
		// goals: "掌握基本的前端编程",
		// extra: {
		// coverUrl: "http://www.baidu.com",
		// vedioUrl: "http://www.baidu.com",
		// }
		// });
	});

	it("POST /packages", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		const lesson = await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId: 1,
			skills: [{ id: 1, score: 10 }, { id: 2, score: 8 }],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		})
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lesson.id, 1);

		const package_ = await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(package_.id, 1);
	});

	it("PUT /packages", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.model.Package.create({ userId: 1, packageName: "test" });

		let data = await app.httpRequest().put("/packages/1").send({
			subjectId: 2
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		data = await app.httpRequest().get("/packages/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(data.subjectId, 2);
	});

	it("GET /packages/1/detail", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.model.Package.create({ userId: 1, packageName: "test1" });

		let data = await app.httpRequest().get("/packages/1/detail")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		// console.log(data);
		assert.ok(data.lessons);
		assert.ok(data.learnedLessons);
		assert.ok(data.teachedLessons);
	});

	it("GET|POST|PUT|DELETE /packages/1/lessons", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		const url = "/packages/1/lessons";

		let less = await app.model.Lesson.create({ userId: 1, lessonName: "test1" });
		let pack = await app.model.Package.create({ userId: 1, packageName: "test2" });
		await app.model.PackageLesson.create({ packageId: pack.id, lessonId: less.id, userId: 1 });

		let lessons = await app.httpRequest()
			.get(url).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lessons.length, 1);

		await app.httpRequest().delete(url + "?lessonId=1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		lessons = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lessons.length, 0);

		let ret = await app.httpRequest().post(url).send({ lessonId: 1 })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(ret, true);

		lessons = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(lessons.length, 1);

		await app.httpRequest().put(url).send({
			lessonId: 1,
			lessonNo: 8
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

	});

	it("POST /packages/1/subscribe", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		let pack = await app.model.Package.create({ userId: 2, packageName: "test3" });
		await app.model.User.create({ username: "test5656", password: md5("123456") });

		const users = app.model.User;
		await users.update({ coin: 300, lockCoin: 0 }, { where: { id: 1 }});

		await app.httpRequest().post(`/packages/${pack.id}/subscribe`).send({ packageId: pack.id })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		const isSubscribe = await app.httpRequest().get(`/packages/${pack.id}/isSubscribe`)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.ok(isSubscribe);

		let user = await users.findOne({ where: { id: 1 }});
		user = user.get({ plain: true });

		assert.equal(user.coin, 300);
		assert.equal(user.lockCoin, 0);
	});

	it("POST /packages/1/audit", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.model.Package.create({ userId: 1, packageName: "test4" });
		await app.httpRequest().post("/packages/1/audit").send({ state: 1 })
			.set("Authorization", `Bearer ${token}`)
			.expect(200);

		const package_ = await app.httpRequest().get("/packages/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(package_.state, 1);
	});

	it("GET /packages/teach", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().get("/packages/teach")
			.set("Authorization", `Bearer ${token}`)
			.expect(200);
	});

	it("GET /packages/search", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);
		await app.model.Package.truncate();

		let package_ = await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(package_.id === 1);


		package_ = await app.httpRequest()
			.get("/packages/search?state=0")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(package_.count === 1);


		package_ = await app.httpRequest()
			.get("/packages/search")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(package_.count === 0);

		await app.httpRequest()
			.post("/packages/1/audit")
			.send({ state: 1 })
			.set("Authorization", `Bearer ${token}`)
			.expect(200);

		package_ = await app.httpRequest()
			.get("/packages/search?state=1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(package_.count === 1);
	});

	it("GET /packages/hots", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);
		await app.model.Package.truncate();

		await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		await app.httpRequest().post("/packages").send({
			packageName: "后端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "后端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);


		const admintoken = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().post("/admins/PackageSort").send({
			packageId: 1,
			hotNo: 1
		}).set("Authorization", `Bearer ${admintoken}`)
			.expect(200).then(res => res.body);

		await app.httpRequest().post("/admins/PackageSort").send({
			packageId: 2,
			hotNo: 2
		}).set("Authorization", `Bearer ${admintoken}`)
			.expect(200).then(res => res.body);

		package_ = await app.httpRequest()
			.get("/packages/hots")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(package_.length === 2);

	});

	it("GET /packages", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);
		await app.model.Package.truncate();

		await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		let packages_ = await app.httpRequest().get("/packages")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(packages_.count === 1);

	});

	it("DELETE /packages/:id", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);
		await app.model.Package.truncate();

		await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 10,
			coin: 100,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		await app.httpRequest().delete("/packages/1")
			.set("Authorization", `Bearer ${token}`).expect(200);

		let package_ = await app.httpRequest().get("/packages/1")
			.then(res => res.body);

		assert(JSON.stringify(package_) === "{}");
	});
});
