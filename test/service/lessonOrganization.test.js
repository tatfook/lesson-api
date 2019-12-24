const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');

describe('', async () => {
	describe('mergeRoleIdAndGenToken', async () => {
		it('001', async () => {
			const ctx = app.mockContext();

			const ret = await ctx.service.lessonOrganization.mergeRoleIdAndGenToken({
				members: [{ roleId: 1 }, { roleId: 2 }],
				userId: 1,
				username: 'user',
				organizationId: 1,
				loginUrl: ''
			}, {
				secret: 'abc'
			});
			assert(ret.token && ret.roleId === 3);
		});
	});

	describe('getByCondition', async () => {
		let org;
		beforeEach(async () => {
			org = await app.factory.create('LessonOrganization');
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganization.getByCondition({
				id: org.id
			});
			assert(ret.name === org.name);
		});
	});

	describe('getUserOrganizations 获取用户加入的机构', async () => {
		let member;
		beforeEach(async () => {
			member = await app.factory.create('LessonOrganizationClassMember', { memberId: 1 });
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganization.getUserOrganizations(1);
			assert(ret.length === 1 && ret[0].id === member.organizationId);
		});
	});

	describe('createOrganization', async () => {
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganization.createOrganization({
				name: 'org1',
			});
			assert(ret);
		});

		it('002 add packages and admin', async () => {
			app.mockService('keepwork', 'getAllUserByCondition', () => [{ id: 1 }, { id: 2 }]);
			app.mockService('keepwork', 'updateUser', () => 0);
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganization.createOrganization({
				name: 'org1',
				packages: [{
					packageId: 1,
					lessons: []
				}],
				usernames: ['jack', 'owen']
			});
			assert(ret);

			const orgPkg = await app.model.LessonOrganizationPackage.findAll();
			assert(orgPkg.length === 1);

			const members = await app.model.LessonOrganizationClassMember.findAll();
			assert(members.length === 2 && _.every(members, o => o.roleId === 64));
		});
	});

	describe('fixedClassPackage', async () => {
		let orgPkg
		beforeEach(async () => {
			orgPkg = await app.factory.create('LessonOrganizationPackage');

		});
		it('001', async () => {
			const ctx = app.mockContext();

			await ctx.service.lessonOrganization.fixedClassPackage(
				orgPkg.organizationId,
				[{
					packageId: orgPkg.packageId,
				}]);

			const ret = await app.model.LessonOrganizationPackage.findAll();
			assert(ret.length === 1);
		});
		it('002', async () => {
			const ctx = app.mockContext();

			await ctx.service.lessonOrganization.fixedClassPackage(
				orgPkg.organizationId,
				[{
					packageId: 999,
				}]);

			const ret = await app.model.LessonOrganizationPackage.findAll();
			assert(ret.length === 0);
		});
	});

	describe('updateOrganization', async () => {
		it('001', async () => {

		});
	});
});
