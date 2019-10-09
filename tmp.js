// -----------api for lesson-api project--------------------
async getUserDatas() {
	const { id } = this.validate({ id: 'int' });

	const res = await this.model.userdatas.get(id);

	return this.success(res);
}

async setUserDatas() {
	const { id, ...params } = this.validate({ id: 'int' });

	const res = await this.model.userdatas.set(id, params);

	return this.success(res);
}

async updateUser() {
	const { condition, params } = this.validate();

	const res = await this.model.users.update(params, { where: condition });

	return this.success(res);
}


async accountsAndRoles() {
	const { userId } = this.validate();

	const [account = {}, allianceMember, tutor] = await Promise.all([
		this.model.accounts.getByUserId(userId),
		this.model.roles.getAllianceMemberByUserId(userId),
		this.model.roles.getTutorByUserId(userId)
	]);

	return this.success([account, allianceMember, tutor]);
}

async accountsIncrement() {
	const { incrementObj, userId } = this.validate();

	const ret = await this.model.accounts.increment(incrementObj, { where: { userId } });

	return this.success(ret);
}


async getAccounts() {
	const { userId } = this.validate();

	const ret = await this.model.accounts.findOne({ where: { userId } });
	return this.success(ret);
}

async createTrade() {
	const params = this.validate();

	const ret = await this.model.trades.create(params);
	return this.success(ret);
}


// -----------api for lesson-api project--------------------


// apis for lesson_api project
router.get(`${prefix}lessons/userdatas`, user.getUserDatas);
router.post(`${prefix}lessons/userdatas`, user.setUserDatas);
router.put(`${prefix}lessons/users`, user.updateUser);
router.get(`${prefix}lessons/accountsAndRoles`, user.accountsAndRoles);
router.put(`${prefix}lessons/accountsIncrement`, user.accountsIncrement);
router.get(`${prefix}lessons/accounts`, user.getAccounts);
router.post(`${prefix}lessons/trades`, user.createTrade);