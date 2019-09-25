
const { app, assert } = require("egg-mock/bootstrap");

describe("test/controller/users.test.js", () => {
	before(async () => {
		const lessons = app.model.Lesson;
		const subjects = app.model.Subject;
		const skills = app.model.Skill;
		await lessons.truncate();
		await subjects.truncate();
		await skills.truncate();
		await app.model.LessonSkill.truncate();
		await app.model.LearnRecord.truncate();
		await app.model.UserLearnRecord.truncate();
		await app.model.Package.truncate();
		await app.model.Subscribe.truncate();
		await app.model.LessonReward.truncate();
		await app.model.PackageLesson.truncate();
		await app.model.LessonContent.truncate();
		await app.model.Teacher.truncate();
		await app.model.TeacherCDKey.truncate();
		await app.model.Classroom.truncate();
		await app.model.User.truncate();

		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token}`).expect(200);

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

		let lesson = await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId: 1,
			skills: [{ id: 1, score: 10 }, { id: 2, score: 8 }],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(lesson.data.id, 1);

		await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 20,
			coin: 200,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
	});


	it("GET|PUT /users/1", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().put("/users/1")
			.send({ nickname: "xiaoyao", username: "test" })
			.set("Authorization", `Bearer ${token}`).expect(200);

		let user = await app.httpRequest().get("/users/1")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		assert.equal(user.data.nickname, "xiaoyao");

		user = await app.httpRequest().get("/users")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		assert(user.data.id);
	});

	it("POST /users/1/teacher", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		const token2 = await app.adminLogin().then(o => o.token);
		assert.ok(token2);

		let data = await app.httpRequest()
			.post("/admins/teacherCDKeys/generate")
			.set("Authorization", `Bearer ${token2}`).expect(200).then(res => res.body);
		assert(data.length === 1);

		const key = data[0].key;

		await app.httpRequest().post("/users/1/teacher")
			.send({ key })
			.set("Authorization", `Bearer ${token}`).expect(200);

		let user = await app.httpRequest()
			.get("/users/1").set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.ok(user.data.identify & 2);

		const isTeach = await app.httpRequest()
			.get("/users/1/isTeach")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.ok(isTeach);
	});

	// it("POST|GET /users/1/subscribes", async () => {
	// 	const token = await app.login().then(o => o.token);
	// 	assert.ok(token);

	// 	const url = "/users/1/subscribes";
	// 	await app.httpRequest().post("/users/1/subscribes")
	// 		.send({ packageId: 1 }).set("Authorization", `Bearer ${token}`).expect(200);

	// 	let list = await app.httpRequest().get(url)
	// 		.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
	// 	assert.equal(list.length, 1);

	// 	let isSubscribe = await app.httpRequest()
	// 		.get("/users/1/isSubscribe?packageId=1")
	// 		.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
	// 	assert.ok(isSubscribe === true);
	// });

	it("GET /users/1/skills", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		// await app.httpRequest().post("/users/1/subscribes").send({packageId:1}).expect(200);

		let lr = await app.httpRequest().post("/lessons/1/learnRecords").send({
			packageId: 1,
			state: 1,
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lr.data.id, 1);

		const skills = await app.httpRequest().get("/users/1/skills")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(skills.data.length, 2);
		// console.log(skills);
	});

	// it("POST /users/expense", async () => {
	// 	let user = await app.model.users.create({ username: "jack", nickname: "jack" });
	// 	await app.keepworkModel.accounts.create({ userId: user.id, coin: 50, bean: 30 });

	// 	const token = await app.adminLogin().then(o => o.token);
	// 	assert.ok(token);

	// 	await app.httpRequest().put("/admins/users/1").send({
	// 		coin: 50,
	// 		bean: 30
	// 	}).set("Authorization", `Bearer ${token}`).expect(200);

	// 	user = await app.httpRequest().get("/users/1")
	// 		.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

	// 	assert(user.coin === 50);
	// 	assert(user.bean === 30);

	// 	await app.httpRequest().post("users/expense").send({
	// 		coin: 20,
	// 		bean: 10
	// 	}).set("Authorization", `Bearer ${token}`).expect(200);

	// });
});
