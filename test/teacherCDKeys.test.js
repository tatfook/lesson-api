
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("test/controller/admins/teacherCDKeys.test.js", () => {
	before(async () => {
		const teacherCDKeys = app.model.TeacherCDKeys;
		await teacherCDKeys.truncate();
	});

	it("POST|GET /admins/teacherCDKeys", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let data = await app.httpRequest()
			.post("/admins/teacherCDKeys/generate?count=20")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(data.length, 20);

		data = await app.httpRequest()
			.get("/admins/teacherCDKeys")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(data.count, 20);

		await app.httpRequest()
			.post("/admins/teacherCDKeys/generate")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		data = await app.httpRequest()
			.get("/admins/teacherCDKeys")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.equal(data.count, 21);
	});

	it("PUT|DELETE /admin/teacherCDKeys", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		await app.httpRequest()
			.post("/admins/teacherCDKeys/generate")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		await app.httpRequest().put("/admins/teacherCDKeys/1")
			.send({
				state: 1
			}).set("Authorization", `Bearer ${token}`).expect(200);

		let data = await app.httpRequest()
			.get("/admins/teacherCDKeys")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(data.rows[0].state === 1);

		await app.httpRequest()
			.delete("/admins/teacherCDKeys/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200);

		data = await app.httpRequest()
			.get("/admins/teacherCDKeys")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);

		assert(data.count === 0);
	});
});
