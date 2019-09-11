
const { app, mock, assert } = require("egg-mock/bootstrap");
const md5 = require("blueimp-md5");

describe("test/controller/lessons.test.js", () => {
	before(async () => {
		const lessons = app.model.Lessons;
		const subjects = app.model.Subjects;
		const skills = app.model.Skills;
		await lessons.truncate();
		await subjects.truncate();
		await skills.truncate();
		await app.model.LessonSkills.truncate();
		await app.model.LearnRecords.truncate();
		await app.model.UserLearnRecords.truncate();
		await app.model.Packages.truncate();
		await app.model.Subscribes.truncate();
		await app.model.LessonRewards.truncate();
		await app.model.PackageLessons.truncate();
		await app.model.LessonContents.truncate();
		await app.model.Users.truncate();

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
	});

	it("POST|DELETE|PUT|GET /lessons", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		// 创建lesson
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

		assert.equal(lesson.id, 1);

		// 获取全部lesson
		let data = await app.httpRequest()
			.get("/lessons")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(data.rows.length, 1);
		assert.equal(data.count, 1);

		const token2 = await app.login({ id: 2, username: "user002" }).then(o => o.token);

		// 创建package
		await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId: 1,
			minAge: 1,
			maxAge: 100,
			intro: "前端学习",
			rmb: 0,
			coin: 0,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		await app.httpRequest()
			.post("/packages/1/subscribe")
			.send({ packageId: 1 })
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		// 修改lesson
		await app.httpRequest()
			.put("/lessons/1")
			.send({ subjectId: 2 })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		// 获取指定lesson
		lesson = await app.httpRequest()
			.get("/lessons/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lesson.subjectId, 2);

		// 获取指定lesson详情
		lesson = await app.httpRequest()
			.get("/lessons/1/detail")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		// console.log(lesson);
		assert.equal(lesson.skills.length, 2);
		assert.equal(lesson.packages.length, 1);

		await app.httpRequest().delete("/lessons/1")
			.set("Authorization", `Bearer ${token}`).expect(200);
	});

	it("POST|DELETE|GET /lessons/1/skills", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		// await app.httpRequest().post("/lessons").send({
		// 	lessonName: "HTML",
		// 	subjectId: 1,
		// 	skills: [{ id: 80, score: 10 }, { id: 90, score: 8 }],
		// 	goals: "掌握基本的前端编程",
		// 	extra: {
		// 		coverUrl: "http://www.baidu.com",
		// 		vedioUrl: "http://www.baidu.com",
		// 	}
		// }).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		const url = "/lessons/1/skills";
		// app.model.Lessons

		await app.httpRequest().delete(url + "?skillId=1")
			.set("Authorization", `Bearer ${token}`).expect(200);

		await app.model.LessonSkills.create({ lessonId: 1, userId: 1, skillId: 1 });
		await app.model.Skills.create({ skillName: "test", enSkillName: "test" });

		let list = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		// console.log(list);
		assert.equal(list.length, 1);

		await app.httpRequest().post(url)
			.send({ skillId: 1, score: 8 })
			.set("Authorization", `Bearer ${token}`).expect(200);

		list = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(list.length, 1);
	});

	it("POST|PUT|GET /lessons/1/learnRecords", async () => {

		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.model.Users.create({
			id: 1, username: "user001", password: md5("123456")
		});

		const url = "/lessons/1/learnRecords";
		let lr = await app.httpRequest().post(url).send({
			packageId: 1,
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lr.id, 1);

		let list = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(list.length, 1);

		await app.httpRequest().put(url).send({
			id: lr.id,
			packageId: 1,
			state: 1,
			reward: true,
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		list = await app.httpRequest().get(url)
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(list[0].state === 1);

		const user = await app.httpRequest().get("/users/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.ok(user.lockCoin < 20); // 成功领取奖励
	});

	it("POST|GET lessons/1/contents", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		const url = "/lessons/1/contents";

		await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId: 1,
			skills: [{ id: 8, score: 10 }, { id: 9, score: 8 }],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		let lc = await app.httpRequest().post(url)
			.send({ content: "lesson content" })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lc.id, 1);

		lc = await app.httpRequest().post(url)
			.send({ content: "lesson content" })
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lc.id, 2);

		lc = await app.httpRequest()
			.get(url).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(lc.id, 2);

		lc = await app.httpRequest()
			.get(url + "?version=1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert.equal(lc.id, 1);
	});
});