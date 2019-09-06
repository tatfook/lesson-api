
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("/admins/subjects.test.js", () => {
	before(async () => {
		const subjects = app.model.Subjects;
		await subjects.truncate();
	});

	it("POST /admins/subjects", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().post("/admins/subjects").send({
			subjectName: "数学",
		}).set("Authorization", `Bearer ${token}`).expect(200);

		await app.httpRequest().post("/admins/subjects").send({
			subjectName: "英语",
		}).set("Authorization", `Bearer ${token}`).expect(200);
	});

	it("GET /admins/subjects", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let list = await app.httpRequest().get("/admins/subjects")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.count, 2);

		list = await app.httpRequest().get("/subjects")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.length, 2);

	});

	it("GET /admins/subjects/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		const subject = await app.httpRequest().get("/admins/subjects/1")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.ok(subject);
		assert.equal(subject.subjectName, "数学");
	});

	it("DELETE /admins/subjects/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		await app.httpRequest().delete("/admins/subjects/1")
			.set("Authorization", `Bearer ${token}`).expect(200);
		const list = await app.httpRequest().get("/admins/subjects")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.count, 1);
	});
});