
const { app, mock, assert  } = require('egg-mock/bootstrap');

describe('LearnRecords', () => {
	before(async () => {
		await app.model.Lessons.sync({force:true});
		await app.model.Subjects.sync({force:true});
		await app.model.Skills.sync({force:true});
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

		await app.httpRequest().get("/users").expect(200);

		await app.model.Subjects.create({
			subjectName: "前端",
		});
		await app.model.Subjects.create({
			subjectName: "后端",
		});
		await app.model.Skills.create({
			skillName: "唱歌",
		});
		await app.model.Skills.create({
			skillName: "跳舞",
		});
		
		let lesson = await app.httpRequest().post("/lessons").send({
			lessonName: "HTML",
			subjectId:1,
			skills: [{id:1, score:10}, {id:2, score:8}],
			goals: "掌握基本的前端编程",
			extra: {
				coverUrl: "http://www.baidu.com",
				vedioUrl: "http://www.baidu.com",
			}
		}).expect(200).then(res => res.body);
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
		}).expect(200).then(res => res.body);
	});


	it("lesson reward", async ()=> {
		let data = await app.httpRequest().post("/learnRecords").send({
			packageId:1,
			lessonId:1,
			state:1,
		}).expect(200).then(res => res.body);
		assert.equal(data.id, 1);

		let reward = await app.httpRequest().post("/learnRecords/1/reward").expect(200).then(res => res.body);
		assert.equal(reward.coin, 0);
		assert.equal(reward.bean, 10);
		//console.log(reward);
		
		await app.model.Users.update({lockCoin: 100}, {where:{id:1}});
		reward = await app.httpRequest().post("/learnRecords/1/reward").expect(200).then(res => res.body);
		assert.ok(reward.coin > 0);
		assert.equal(reward.bean, 0);

		reward = await app.httpRequest().post("/learnRecords/1/reward").expect(200).then(res => res.body);
		assert.equal(reward.coin, 0);
		assert.equal(reward.bean, 0);

		reward = await app.httpRequest().get("/learnRecords/reward?packageId=1&lessonId=1").expect(200).then(res => res.body);
		assert.ok(reward.coin > 0);
		assert.equal(reward.bean, 10);
	});
})
