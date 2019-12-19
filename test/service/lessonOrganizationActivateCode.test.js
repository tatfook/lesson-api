const { app, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');

describe('test/service/lessonOrganizationActivateCode.test.js', async () => {
	describe('createActivateCode 创建激活码', async () => {
		beforeEach(async () => {
			await app.model.LessonOrganization.create({ id: 1, endDate: '2220-01-01' });
		});
		it('001 没有权限', async () => {
			const ctx = app.mockContext();
			try {
				await ctx.service.lessonOrganizationActivateCode.createActivateCode({
					count: 1,
					type: 5
				}, { userId: 1, organizationId: 1, roleId: 1, username: '' });
			} catch (e) {
				assert(e.message === '没有权限');
			}
		});
		it('002 班级失效1', async () => {
			const ctx = app.mockContext();
			try {
				await ctx.service.lessonOrganizationActivateCode.createActivateCode({
					count: 1,
					type: 5,
					classIds: [1]
				}, { userId: 1, organizationId: 1, roleId: 64, username: '' });
			} catch (e) {
				assert(e.message === '班级失效');
			}
		});
		it('003 班级失效2', async () => {
			await app.model.LessonOrganizationClass.create({ id: 1, status: 2 });
			const ctx = app.mockContext();
			try {
				await ctx.service.lessonOrganizationActivateCode.createActivateCode({
					count: 1,
					type: 5,
					classIds: [1]
				}, { userId: 1, organizationId: 1, roleId: 64, username: '' });
			} catch (e) {
				assert(e.message === '班级失效');
			}
		});
		it('004 机构不存在', async () => {
			await app.model.LessonOrganizationClass.create({ id: 1, status: 1, organizationId: 2 });
			const ctx = app.mockContext();
			try {
				await ctx.service.lessonOrganizationActivateCode.createActivateCode({
					count: 1,
					type: 5,
					classIds: [1]
				}, { userId: 1, organizationId: 2, roleId: 64, username: '' });
			} catch (e) {
				assert(e.message === '机构不存在');
			}
		});
		it('005 超出激活码上限', async () => {
			await app.model.LessonOrganizationClass.create({ id: 1, status: 1, organizationId: 1 });
			const ctx = app.mockContext();
			try {
				await ctx.service.lessonOrganizationActivateCode.createActivateCode({
					count: 1,
					type: 5,
					classIds: [1]
				}, { userId: 1, organizationId: 1, roleId: 64, username: '' });
			} catch (e) {
				assert(e.message === '已经超出激活码数量上限');
			}
		});
		it('006 创建成功', async () => {
			await app.model.LessonOrganization.create({ id: 2, name: 'org2', endDate: '2220-01-01' });
			await app.model.LessonOrganizationClass.create({ id: 1, status: 1, organizationId: 2 });
			const ctx = app.mockContext();

			await ctx.service.lessonOrganizationActivateCode.createActivateCode({
				count: 1,
				type: 5,
				classIds: [1]
			}, { userId: 1, organizationId: 2, roleId: 64, username: '' });
		});
	});

	describe('findAllActivateCodeAndCount 激活码列表', async () => {
		let codes;
		beforeEach(async () => {
			codes = await app.factory.createMany('LessonOrganizationActivateCode', 10);
		});
		it('001', async () => {
			const ctx = app.mockContext();

			const { count, rows } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount({
				offset: 0,
				limit: 10
			}, {});
			assert(count === 10);
		});
		it('002 筛选state=1', async () => {
			const ctx = app.mockContext();

			const { count, rows } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount({
				offset: 0,
				limit: 10
			}, { state: 1 });
			assert(count === _.filter(codes, o => o.state === 1).length);
		});
		it('003 偏移量', async () => {
			const ctx = app.mockContext();

			const { count, rows } = await ctx.service.lessonOrganizationActivateCode.findAllActivateCodeAndCount({
				offset: 1,
				limit: 10
			}, {});
			assert(count === 10 && rows.length === 9);
		});
	});

	describe('getCountByCondition 获得count', async () => {
		let codes;
		beforeEach(async () => {
			codes = await app.factory.createMany('LessonOrganizationActivateCode', 10);
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const count = await ctx.service.lessonOrganizationActivateCode.getCountByCondition({

			});
			assert(count === 10);
		});
		it('002', async () => {
			const ctx = app.mockContext();
			const count = await ctx.service.lessonOrganizationActivateCode.getCountByCondition({
				state: 1
			});
			assert(count === _.filter(codes, o => o.state === 1).length);
		});
	});
	describe('getByCondition', async () => {
		beforeEach(async () => {
			await app.factory.createMany('LessonOrganizationActivateCode', 10);
		});
		it('001', async () => {
			const ctx = app.mockContext();
			const code = await ctx.service.lessonOrganizationActivateCode.getByCondition({
				id: 1
			});
			assert(code.id === 1);
		});
	});
	describe('updateByCondition', async () => {
		beforeEach(async () => {
			await app.factory.createMany('LessonOrganizationActivateCode', 10);
		});
		it('001', async () => {
			const ctx = app.mockContext();
			await ctx.service.lessonOrganizationActivateCode.updateByCondition({
				state: 2
			}, {
				id: 1
			});
			const code = await app.model.LessonOrganizationActivateCode.findOne({ where: { id: 1 } });
			assert(code.state === 2);
		});
	});

	describe('useActivateCode 学生使用激活码激活', async () => {
		beforeEach(async () => {
		});
		it('001', async () => {

		});
	});
}); 
