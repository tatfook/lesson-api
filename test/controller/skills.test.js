
const { app, mock, assert } = require("egg-mock/bootstrap");

describe("/admins/skills", () => {
	before(async () => {
		const skills = app.model.Skill;
		await skills.truncate();
	});

	it("POST /admins/skill", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let data = await app.httpRequest().post("/admins/skill").send({
			skillName: "唱歌",
		})
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(data.data.skillName, "唱歌");

		data = await app.httpRequest().post("/admins/skill").send({
			skillName: "跳舞",
		})
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert(data.data.skillName, "跳舞");

	});

	it("GET /admins/skill", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		let list = await app.httpRequest().get("/admins/skill")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.data.count, 2);

		list = await app.httpRequest().get("/skills")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.data.length, 2);
	});

	it("GET /admins/skill/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		const skill = await app.httpRequest().get("/admins/skill/1")
			.set("Authorization", `Bearer ${token}`)
			.expect(200).then(res => res.body);
		assert.ok(skill);
		assert.equal(skill.data.skillName, "唱歌");
	});

	it("DELETE /admins/skill/1", async () => {
		const token = await app.adminLogin().then(o => o.token);
		assert.ok(token);

		const skill = await app.httpRequest().delete("/admins/skill/1")
			.set("Authorization", `Bearer ${token}`).expect(200);
		const list = await app.httpRequest().get("/admins/skill")
			.set("Authorization", `Bearer ${token}`).expect(200).then(res => res.body);
		assert.equal(list.data.count, 1);
	});
});
