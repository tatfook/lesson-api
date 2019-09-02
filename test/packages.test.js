
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("test/controller/packages.test.js", () => {
	before(async () => {
		const packages = app.model.Packages;
		const lessons = app.model.Lessons;
		const packageLessons = app.model.PackageLessons;
		const subjects = app.model.Subjects;
		const skills = app.model.Skills;
		await packages.truncate();
		await lessons.truncate();
		await packageLessons.truncate();
		await subjects.truncate();
		await skills.truncate();
		await app.model.LessonSkills.truncate();
		await app.model.Subscribes.truncate();
		await app.model.Users.truncate();

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

		await app.model.Packages.create({ id: 1, userId: 1, packageName: "test" });

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

		await app.model.Packages.create({ id: 1, userId: 1, packageName: "test" });

		let data = await app.httpRequest().get("/packages/1/detail")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		// console.log(data);
		assert.ok(data.lessons);
		assert.ok(data.learnedLessons);
		assert.ok(data.teachedLessons);
	});

	it("GET|POST|DELETE /packages/1/lessons", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		const url = "/packages/1/lessons";

		await app.model.lessons.create({ id: 1, userId: 1, lessonName: "test" });
		await app.model.packageLessons.create({ id: 1, packageId: 1, lessonId: 1, userId: 1 });
		await app.model.Packages.create({ id: 1, userId: 1, packageName: "test" });

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
	});

	// it("POST /packages/1/subscribe", async () => {
	// 	const token = await app.login().then(o => o.token);
	// 	assert.ok(token);

	// 	const users = app.model.Users;
	// 	await users.update({ coin: 300, lockCoin: 0 }, { where: { id: 1 }});

	// 	await app.httpRequest().post("/packages/1/subscribe").send({ packageId: 1 })
	// 		.set("Authorization", `Bearer ${token}`)
	// 		.expect(200).then(res => res.body);

	// 	const isSubscribe = await app.httpRequest().get("/packages/1/isSubscribe")
	// 		.set("Authorization", `Bearer ${token}`)
	// 		.expect(200).then(res => res.body);
	// 	assert.ok(isSubscribe);

	// 	let user = await users.findOne({ where: { id: 1 }});
	// 	user = user.get({ plain: true });

	// 	assert.equal(user.coin, 200);
	// 	assert.equal(user.lockCoin, 10);
	// });

	it("POST /packages/1/audit", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.model.Packages.create({ id: 1, userId: 1, packageName: "test" });
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
});


