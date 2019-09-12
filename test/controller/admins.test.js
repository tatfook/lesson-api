const { app, assert } = require("egg-mock/bootstrap");

describe("test/controller/admins.test.js", () => {
	before(async () => {
		await app.model.User.truncate();
	});

	it("POST|GET|PUT", async () => {
		const token2 = await app.adminLogin().then(o => o.token);
		assert.ok(token2);

		await app.model.User.create({ username: "test" });

		let users = await app.httpRequest().get("/admins/user")// 获取全部资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		assert(users.count === 1);
		assert(users.rows[0].username === "test");

		users = await app.httpRequest().get(`/admins/user/${users.rows[0].id}`)// 获取指定资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		assert(users.username === "test");

		await app.httpRequest().put(`/admins/user/${users.id}`).send({ // 修改资源
			username: "test3"
		}).set("Authorization", `Bearer ${token2}`)
			.expect(200);

		users = await app.httpRequest().get(`/admins/user/${users.id}`)// 获取指定资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		assert(users.username === "test3");

		await app.httpRequest()
			.post("/admins/user")
			.send({ username: "test2" })
			.set("Authorization", `Bearer ${token2}`)// 资源创建
			.expect(200);

		users = await app.httpRequest().get("/admins/user")// 获取全部资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		assert(users.count === 2);
		assert(users.rows[0].username === "test3");
		assert(users.rows[1].username === "test2");

		await app.httpRequest().delete(`/admins/user/${users.rows[0].id}`)// 删除资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		users = await app.httpRequest().get("/admins/user")// 获取全部资源
			.set("Authorization", `Bearer ${token2}`)
			.expect(200).then(res => res.body);

		assert(users.count === 1);
		assert(users.rows[0].username === "test2");
	});
});
