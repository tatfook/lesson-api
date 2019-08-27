
const { app, mock, assert  } = require('egg-mock/bootstrap');

describe('test/controller/admins/teacherCDKeys.test.js', () => {
	before(async () => {
		const teacherCDKeys = app.model.TeacherCDKeys;
		const result = await teacherCDKeys.truncate();
	});

	it('POST /admins/teacherCDKeys/generate', async ()=> {
		let data = await app.httpRequest().post("/admins/teacherCDKeys/generate?count=20").expect(200).then(res => res.body);
		assert(data.length, 20);
	});

	it('GET /admins/teacherCDKeys', async () => {
		const data = await app.httpRequest().get("/admins/teacherCDKeys").expect(200).then(res => res.body);
		assert.equal(data.count, 20);
	});
})
