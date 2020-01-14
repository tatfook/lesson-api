const { app, assert } = require('egg-mock/bootstrap');

describe('test/service/lesson.test.js',async()=>{
	describe('getByCondition',async()=>{
		let lesson;
		beforeEach(async()=>{
			lesson = await app.factory.create('Lesson');
		});

		it('001',async()=>{
            const ctx = app.mockContext();
			const ret = await ctx.service.lesson.getByCondition({id:lesson.id});
			assert(ret);
		});
	});

	describe('getLessonByPageAndSort',async()=>{
		let lesson;
		beforeEach(async()=>{
			lesson = await app.factory.create('Lesson');
			await app.model.PackageLesson.create({lessonId:lesson.id,packageId:1,userId :1})
		});

		it('001',async()=>{
            const ctx = app.mockContext();
			const ret = await ctx.service.lesson.getLessonByPageAndSort({id:lesson.id,});
			assert(ret && ret.rows[0].packageLessons);
		});
	});
});
