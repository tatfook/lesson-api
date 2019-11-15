'use strict';
/**
 * 用户的VIP和tLevel信息进行更新
 */
const mock = require('egg-mock');
mock.env('prod'); // dev、release、master环境均为prod
const app = mock.app();
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await app.ready();
        const members = await app.model.queryInterface.sequelize.query(
            `SELECT DISTINCT
                memberId
            FROM
                lessonOrganizationClassMembers;`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const memberIds = members.map(member => member.memberId);
        const ctx = app.mockContext();
        for (let i = 0; i < memberIds.length; i++) {
            await ctx.service.lessonOrganizationClassMember.updateUserVipAndTLevel(
                memberIds[i]
            );
        }
    },

    down: (queryInterface, Sequelize) => {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    },
};
