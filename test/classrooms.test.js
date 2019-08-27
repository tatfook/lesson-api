
const { app, mock, assert  } = require('egg-mock/bootstrap');

describe('test/controller/skills.test.js', () => {
	before(async () => {
		const lessons = app.model.Lessons;
		const subjects = app.model.Subjects;
		const skills = app.model.Skills;
		await lessons.sync({force:true});
		await subjects.sync({force:true});
		await skills.sync({force:true});
		await app.model.LessonSkills.sync({force:true});
		await app.model.LearnRecords.sync({force:true});
		await app.model.UserLearnRecords.sync({force:true});
		await app.model.Packages.sync({force:true});
		await app.model.Subscribes.sync({force:true});
		await app.model.LessonRewards.sync({force:true});
		await app.model.PackageLessons.sync({force:true});
		await app.model.LessonContents.sync({force:true});
		await app.model.Teachers.sync({force:true});
		await app.model.TeacherCDKeys.sync({force:true});
		await app.model.Classrooms.sync({force:true});
		await app.model.Users.sync({force:true});
		await app.keepworkModel.lessonOrganizationLogs.sync({force: true});

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
		
		const token = app.util.jwt_encode({userId:1, username:'xiaoyao'}, app.config.self.secret);

		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		let lesson = await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId:1,
			skills: [{id:1, score:10}, {id:2, score:8}],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert.equal(lesson.id,1);

		const package_ = await app.httpRequest().post("/packages").send({
			packageName: "前端",
			lessons: [1],
			subjectId:1,
			minAge:1,
			maxAge:100,
			intro: "前端学习",
			rmb: 20,
			coin: 200,
			extra: {
				coverUrl: "http://www.baidu.com",
			},
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);

	});

	it("001 创建课堂 进入课堂 退出课堂 关闭课堂", async ()=> {
		const token = app.util.jwt_encode({userId:1, username:'xiaoyao'}, app.config.self.secret);

		// 创建课堂
		let classroom = await app.httpRequest().post("/classrooms").send({packageId:1, lessonId:1}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		const classroomId = classroom.id;
		assert.equal(classroom.id, 1);

		// 进入课堂
		const token2 = app.util.jwt_encode({userId:2, username:'wxatest'}, app.config.self.secret);
		await app.httpRequest().get("/users").set("Authorization", `Bearer ${token2}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		await app.httpRequest().post("/classrooms/join").send({key:classroom.key}).set("Authorization", `Bearer ${token2}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		
		// 退出课堂
		await app.httpRequest().post("/classrooms/quit").set("Authorization", `Bearer ${token2}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		// 下课
		await app.httpRequest().put(`/classrooms/${classroomId}/dismiss`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		classroom = await app.httpRequest().get(`/classrooms/${classroomId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert.equal(classroom.state, 2);

		// 自学
		await app.httpRequest().post("/learnRecords").send({packageId:1, lessonId:1, state:1}).set("Authorization", `Bearer ${token2}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);

		// 获取课堂
		//classroom = await app.httpRequest().get("/classrooms/1").expect(200).then(res => res.body);
		//assert.equal(classroom.id,1);
		//assert.equal(classroom.state, 1);

		// 当前课堂
		//classroom = await app.httpRequest().get("/classrooms/current").expect(200).then(res => res.body);
		//assert.equal(classroom.id,1);

		// 关闭课堂
	});

	it ("002", async ()=>{
		//const url = "/classrooms/1/learnRecords";
		//let lr = await app.httpRequest().post(url).send({userId:1}).expect(200).then(res => res.body);
		//assert.equal(lr.id, 1);

		//await app.httpRequest().put(url).send({id:1, userId:1, extra:{key:1}}).expect(200);

		//const list = await app.httpRequest().get(url).expect(200).then(res => res.body);
		//assert.equal(list[0].extra.key, 1);
	});
});













