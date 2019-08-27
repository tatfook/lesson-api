
const { app, mock, assert  } = require('egg-mock/bootstrap');

describe('/admins/subjects.test.js', () => {
	before(async () => {
		const subjects = app.model.Subjects;
		const result = await subjects.truncate();
	});

	it('POST /admins/subjects', async ()=> {
		await app.httpRequest().post("/admins/subjects").send({
			subjectName: "数学",
		}).expect(200);

		await app.httpRequest().post("/admins/subjects").send({
			subjectName: "英语",
		}).expect(200);
	});

	it('GET /admins/subjects', async () => {
		const list = await app.httpRequest().get("/admins/subjects").expect(200).then(res => res.body);
		assert.equal(list.length, 2);
	});

	it('GET /admins/subjects/1', async () => {
		const subject = await app.httpRequest().get("/admins/subjects/1").expect(200).then(res => res.body);
		assert.ok(subject);
		assert.equal(subject.subjectName, "数学");
	});

	it("DELETE /admins/subjects/1", async () => {
		const subject = await app.httpRequest().delete("/admins/subjects/1").expect(200);
		const list = await app.httpRequest().get("/admins/subjects").expect(200).then(res => res.body);
		assert.equal(list.length, 1);
	});
})
