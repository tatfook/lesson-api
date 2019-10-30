
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("LearnRecords", () => {
	before(async () => {
		await app.model.Lesson.sync({ force: true });
		await app.model.Subject.sync({ force: true });
		await app.model.Skill.sync({ force: true });
		await app.model.LessonSkill.sync({ force: true });
		await app.model.LearnRecord.sync({ force: true });
		await app.model.UserLearnRecord.sync({ force: true });
		await app.model.Package.sync({ force: true });
		await app.model.Subscribe.sync({ force: true });
		await app.model.LessonReward.sync({ force: true });
		await app.model.PackageLesson.sync({ force: true });
		await app.model.LessonContent.sync({ force: true });
		await app.model.Teacher.sync({ force: true });
		await app.model.TeacherCDKey.sync({ force: true });
		await app.model.Classroom.sync({ force: true });
		await app.model.User.sync({ force: true });

		const token = await app.login().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token}`).expect(200);

		await app.model.Subject.create({
			subjectName: "前端",
		});
		await app.model.Subject.create({
			subjectName: "后端",
		});
		await app.model.Skill.create({
			skillName: "唱歌",
		});
		await app.model.Skill.create({
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
			state: 2, // 嘿嘿，小妖怪，骗我
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);

		await app.model.Package.update({ state: 2 }, { where: { id: 1 }});
	});


	it("lesson reward", async () => {
		const token = await app.login().then(o => o.token);
		assert.ok(token);

		// 提交学习记录
		let data = await app.httpRequest().post("/learnRecords").send({
			packageId: 1,
			lessonId: 1,
			state: 1,
		}).set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(data.data.id, 1);

		// 领取学习j奖励
		let reward = await app.httpRequest()
			.post("/learnRecords/1/reward")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(reward.data.coin, 0);
		assert.equal(reward.data.bean, 10);
		// console.log(reward);

		// accounts表的lockCoin
		const ctx = app.mockContext();
		await ctx.service.keepwork.update({ resources: "accounts", lockCoin: 100 }, { id: 1 });

		reward = await app.httpRequest()
			.post("/learnRecords/1/reward")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.ok(reward.data.coin > 0);
		assert.equal(reward.data.bean, 0);

		// 不可重复领取
		reward = await app.httpRequest().post("/learnRecords/1/reward")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(reward.data.coin, 0);
		assert.equal(reward.data.bean, 0);

		// 获取领奖记录
		reward = await app.httpRequest()
			.get("/learnRecords/reward?packageId=1&lessonId=1")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.ok(reward.data.coin > 0);
		assert.equal(reward.data.bean, 10);
	});
});
