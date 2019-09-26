
const { app, assert } = require("egg-mock/bootstrap");

describe("test/controller/classrooms.test.js", () => {
	before(async () => {
		const lessons = app.model.Lesson;
		const subjects = app.model.Subject;
		const skills = app.model.Skill;
		await lessons.sync({ force: true });
		await subjects.sync({ force: true });
		await skills.sync({ force: true });
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
		await app.keepworkModel.Users.sync({ force: true });
		await app.model.LessonOrganizationLog.sync({ force: true });

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

		const user = await app.login();
		const token = user.token;

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
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);

	});

	it("001 创建课堂 进入课堂 退出课堂 关闭课堂", async () => {
		const user = await app.login();
		const token = user.token;

		// 创建课堂
		let classroom = await app.httpRequest().post("/classrooms").send({
			packageId: 1, lessonId: 1
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);
		const classroomId = classroom.data.id;
		assert.equal(classroom.data.id, 1);

		await app.httpRequest().post("/classrooms").send({ // packageId && lessonId错误
			packageId: 999, lessonId: 999
		}).set("Authorization", `Bearer ${token}`)
			.expect(400).then(res => res.body);

		// 课堂列表
		let classroom2 = await app.httpRequest()
			.get("/classrooms")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(classroom2.data.count === 1);
		assert(classroom2.data.rows.length === 1);

		// 进入课堂
		const user_ = await app.login({ id: 2, username: "wxatest" });
		const token2 = user_.token;

		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);

		const valid = await app.httpRequest()
			.get(`/classrooms/valid?key=${classroom.data.key}`)
			.expect(200).then(res => res.body);
		assert(valid.data === true);

		await app.httpRequest().post("/classrooms/join").send({
			key: classroom.data.key
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
		assert.equal(classroom.data.state, 2);

		// 课堂不存在
		let ret = await app.httpRequest().post("/classrooms/join").send({
			key: "abc"
		})
			.set("Authorization", `Bearer ${token2}`)
			.expect(400).then(res => res.body);

		assert(ret.message === "课堂不存在");

		// 自学
		await app.httpRequest().post("/learnRecords")
			.send({ packageId: 1, lessonId: 1, state: 1 })
			.set("Authorization", `Bearer ${token2}`)
			.expect(res => assert(res.statusCode === 200))
			.then(res => res.body);

	});

	it("002", async () => {
		const user = await app.login({ id: 1, username: "xiaoyao" });
		const token = user.token;

		// await app.model.PackageLesson.create({ packageId: 1, lessonId: 1, userId: 2 });

		await app.model.Package.create({ userId: 1, packageName: "unique" });

		await app.model.Lesson.create({ userId: 1, lessonName: "unique", url: "hahh" });
		// 创建课堂
		let classroom = await app.httpRequest().post("/classrooms").send({
			packageId: 1, lessonId: 1
		}).set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(classroom.data.id, 2);

		await app.httpRequest().put("/classrooms/1").send({ // 修改课堂
			packageId: 2
		}).set("Authorization", `Bearer ${token}`).expect(200);

		classroom = await app.httpRequest().get("/classrooms/1").then(res => res.body);

		assert(classroom.data.packageId === 2);

		classroom = await app.httpRequest()// 通过key获取课堂
			.get(`/classrooms/getByKey?key=${classroom.data.key}`)
			.expect(200).then(res => res.body);

		assert(classroom.data.packageId === 2);

		classroom = await app.httpRequest().get("/classrooms/current")// 当前课堂
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(classroom.data.id, 2);

	});
});


