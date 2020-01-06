const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');
const moment = require('moment');

describe('test/service/lessonOrganizationPackage.test.js', async () => {
	describe('destroyByCondition', async () => {
		let pkgs;
		beforeEach(async () => {
			pkgs = await app.factory.createMany('LessonOrganizationPackage', 10)
		});
		it.only('001', async () => {
			const ctx = app.mockContext();
			await ctx.service.lessonOrganizationPackage.destroyByCondition({ id: pkgs[0].id });
		});
	});

	describe('findAllByCondition', async () => {

	});

	describe('findAllAndExtraByCondition', async () => {

	});
});