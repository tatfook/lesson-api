const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');

describe('test/service/lesssonOrganizationClassMember.test.js', async () => {
	describe('getByCondition', async () => {
		beforeEach(async () => {
			await app.model.LessonOrganizationClassMember.create({
				memberId: 1,
				organizationId: 1,
				roleId: 1,
				type: 2,
				endTime: '2220-10-10'
			});
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getByCondition({ type: 2 })
			assert(ret.memberId === 1 && ret.organizationId === 1)
		});
	});

	describe('getAllByCondition', async () => {
		let members
		beforeEach(async () => {
			members = await app.factory.createMany('LessonOrganizationClassMember', 10);
		});
		it('001', async () => {
			const f = _.filter(members, o => o.type === 1)
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getAllByCondition({ type: 1 });
			assert(ret.length === f.length);
		});
	});

	describe('getAllAndExtraByCondition', async () => {
		let members
		beforeEach(async () => {
			members = await app.factory.createMany('LessonOrganizationClassMember', 10);
		});
		it('001', async () => {
			const f = _.filter(members, o => o.type === 1)
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getAllAndExtraByCondition(
				[{
					as: 'lessonOrganizationClasses',
					model: ctx.model.LessonOrganizationClass
				}], { type: 1 });
			assert(ret.length === f.length && _.every(ret, o => o.lessonOrganizationClasses));
		});
	});

	describe('destroyByCondition', async () => {
		let members
		beforeEach(async () => {
			members = await app.factory.createMany('LessonOrganizationClassMember', 10);
		});
		it('001', async () => {
			const f = _.filter(members, o => o.type === 1)
			const ctx = app.mockContext();
			await ctx.service.lessonOrganizationClassMember.destroyByCondition({ type: 1 });

			const count = await app.model.LessonOrganizationClassMember.count();
			assert(count === members.length - f.length);
		});
	});

	describe('updateByCondition', async () => {
		let member;
		beforeEach(async () => {
			member = await app.model.LessonOrganizationClassMember.create({
				memberId: 1,
				organizationId: 1,
				roleId: 1,
				type: 2,
				endTime: '2220-10-10'
			});
		});
		it('001', async () => {
			const ctx = app.mockContext();
			await ctx.service.lessonOrganizationClassMember.updateByCondition({ type: 1 }, { id: member.id });

			const ret = await app.model.LessonOrganizationClassMember.findOne({ where: { id: member.id } });
			assert(ret.type === 1);
		});
	});

	describe('create', async () => {
		it('001', async () => {
			const ctx = app.mockContext();
			await ctx.service.lessonOrganizationClassMember.create({
				memberId: 1,
				organizationId: 1,
				roleId: 1,
				type: 2,
				endTime: '2220-10-10'
			});

			const ret = await app.model.LessonOrganizationClassMember.findOne({});
			assert(ret.type === 2 && ret.memberId === 1);
		});
	});

	describe('getTeachers', async () => {
		let org;
		let cls;
		let members
		beforeEach(async () => {
			org = await app.factory.create('LessonOrganization');
			cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });
			members = await app.factory.createMany('LessonOrganizationClassMember', 10, {
				organizationId: org.id, classId: cls.id, roleId: 2
			});

			app.mockService('keepwork', 'getAllUserByCondition', () => []);
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getTeachers(org.id, cls.id);
			assert(ret.length === 10 && _.every(ret, o => o.classes));
		});

		it('002', async () => {
			app.mockService('keepwork', 'getAllUserByCondition', () => [{ id: members[0].memberId, username: 'abc' }]);
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getTeachers(org.id, cls.id);
			assert(ret.length === 10 && _.some(ret, o => o.username === 'abc'));
		});
	});

	describe('getStudents', async () => {
		let org;
		let cls;
		let members
		beforeEach(async () => {
			org = await app.factory.create('LessonOrganization');
			cls = await app.factory.create('LessonOrganizationClass', { organizationId: org.id });
			members = await app.factory.createMany('LessonOrganizationClassMember', 10, {
				organizationId: org.id, classId: cls.id, roleId: 1, endTime: '2200-01-01'
			});

			app.mockService('keepwork', 'getAllUserByCondition', () => []);
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getStudents(org.id, cls.id);
			assert(ret.count === 10 && _.every(ret.rows, o => o.classes));
		});

		it('002', async () => {
			app.mockService('keepwork', 'getAllUserByCondition', () => [{ id: members[0].memberId, username: 'abc' }]);
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getStudents(org.id, cls.id);
			assert(ret.count === 10 && _.some(ret.rows, o => o.users));
		});

		it('003', async () => {
			const f = _.filter(members, o => o.type === 2);
			const ctx = app.mockContext();
			const ret = await ctx.service.lessonOrganizationClassMember.getStudents(org.id, cls.id, 2);
			assert(ret.count === f.length);
		});
	});

	describe('createMember', async () => {
		it('001', async () => {
			const ctx = app.mockContext();

		});
	});
});
