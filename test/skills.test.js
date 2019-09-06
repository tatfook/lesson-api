
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("/admins/skills", () => {
	before(async () => {
		const skills = app.model.Skills;
		await skills.truncate();
	});

	it("POST /admins/skills", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let data = await app.httpRequest().post("/admins/skills").send({
			skillName: "唱歌",
		})
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(data.skillName, "唱歌");

		data = await app.httpRequest().post("/admins/skills").send({
			skillName: "跳舞",
		})
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(data.skillName, "跳舞");

	});

	it("GET /admins/skills", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let list = await app.httpRequest().get("/admins/skills")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.count, 2);

		list = await app.httpRequest().get("/skills")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.length, 2);
	});

	it("GET /admins/skills/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		const skill = await app.httpRequest().get("/admins/skills/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.ok(skill);
		assert.equal(skill.skillName, "唱歌");
	});

	it("DELETE /admins/skills/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		const skill = await app.httpRequest().delete("/admins/skills/1")
			.set("Authorization", `Bearer ${token}`).expect(200);
		const list = await app.httpRequest().get("/admins/skills")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.count, 1);
	});
});
