
const { app, assert } = require("egg-mock/bootstrap");

describe("test/controller/classrooms.test.js", () => {
	before(async () => {
		const lessons = app.model.Lessons;
		const subjects = app.model.Subjects;
		const skills = app.model.Skills;
		await lessons.sync({ force: true });
		await subjects.sync({ force: true });
		await skills.sync({ force: true });
		await app.model.LessonSkills.sync({ force: true });
		await app.model.LearnRecords.sync({ force: true });
		await app.model.UserLearnRecords.sync({ force: true });
		await app.model.Packages.sync({ force: true });
		await app.model.Subscribes.sync({ force: true });
		await app.model.LessonRewards.sync({ force: true });
		await app.model.PackageLessons.sync({ force: true });
		await app.model.LessonContents.sync({ force: true });
		await app.model.Teachers.sync({ force: true });
		await app.model.TeacherCDKeys.sync({ force: true });
		await app.model.Classrooms.sync({ force: true });
		await app.model.Users.sync({ force: true });
		await app.keepworkModel.Users.sync({ force: true });
		await app.model.lessonOrganizationLogs.sync({ force: true });

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

		const token = app.util.jwt_encode({ userId: 1, username: "xiaoyao" }, app.config.self.secret);

		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);

		let lesson = await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId: 1,
			skills: [{ id: 1, score: 10 }, { id: 2, score: 8 }],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert.equal(lesson.id, 1);

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
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);

	});

	it("001 创建课堂 进入课堂 退出课堂 关闭课堂", async () => {
		const token = app.util.jwt_encode({ userId: 1, username: "xiaoyao" }, app.config.self.secret);

		// 创建课堂
		let classroom = await app.httpRequest().post("/classrooms").send({
			packageId: 1, lessonId: 1
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);
		const classroomId = classroom.id;
		assert.equal(classroom.id, 1);

		await app.httpRequest().post("/classrooms").send({ // packageId && lessonId错误
			packageId: 999, lessonId: 999
		}).set("Authorization", `Bearer ${token}`)
			.expect(400).then(res => res.body);

		// 课堂列表
		let classroom2 = await app.httpRequest()
			.get("/classrooms")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(classroom2.count === 1);
		assert(classroom2.rows.length === 1);

		// 进入课堂
		const token2 = app.util.jwt_encode({ userId: 2, username: "wxatest" }, app.config.self.secret);
		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);

		const valid = await app.httpRequest()
			.get(`/classrooms/valid?key=${classroom.key}`)
			.expect(200).then(res => res.body);
		assert(valid === true);

		await app.httpRequest().post("/classrooms/join").send({
			key: classroom.key
		})
			.set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200)).then(res => res.body);

		// 退出课堂
		await app.httpRequest().post("/classrooms/quit")
			.set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);

		// 下课
		await app.httpRequest().put(`/classrooms/${classroomId}/dismiss`)
			.set("Authorization", `Bearer ${token}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);
		classroom = await app.httpRequest().get(`/classrooms/${classroomId}`)
			.set("Authorization", `Bearer ${token}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);
		assert.equal(classroom.state, 2);

		// 课堂不存在
		let ret = await app.httpRequest().post("/classrooms/join").send({
			key: "abc"
		})
			.set("Authorization", `Bearer ${token2}`)
			.expect(400).then(res => res.body);
		assert(ret.code === 1);

		// 自学
		await app.httpRequest().post("/learnRecords")
			.send({ packageId: 1, lessonId: 1, state: 1 })
			.set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);

	});

	it("002", async () => {
		const token = app.util.jwt_encode({ userId: 1, username: "xiaoyao" }, app.config.self.secret);

		await app.model.PackageLessons.create({ packageId: 1, lessonId: 1, userId: 2 });
		await app.model.Packages.create({ userId: 1, packageName: "unique" });
		await app.model.Lessons.create({ userId: 1, lessonName: "unique", url: "hahh" });

		// 创建课堂
		let classroom = await app.httpRequest().post("/classrooms").send({
			packageId: 1, lessonId: 1
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(classroom.id, 1);

		await app.httpRequest().put("/classrooms/1").send({ // 修改课堂
			packageId: 2
		}).set("Authorization", `Bearer ${token}`).expect(200);

		classroom = await app.httpRequest().get("/classrooms/1").then(res => res.body);

		assert(classroom.packageId === 2);

		classroom = await app.httpRequest()// 通过key获取课堂
			.get(`/classrooms/getByKey?key=${classroom.key}`)
			.expect(200).then(res => res.body);

		assert(classroom.packageId === 2);

		classroom = await app.httpRequest().get("/classrooms/current")// 当前课堂
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(classroom.id, 1);
	});
});


