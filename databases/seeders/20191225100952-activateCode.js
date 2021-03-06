'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 确定班级的status
            const classes = await queryInterface.sequelize.query(
                `
            select 
              id,
              begin,
              end
            from lessonOrganizationClasses 
            `,
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );
            const currTime = new Date();
            for (let i = 0; i < classes.length; i++) {
                await queryInterface.sequelize.query(
                    `
                update lessonOrganizationClasses set \`status\` = ${
                    classes[i].end > currTime ? 1 : 2
                } where id = ${classes[i].id}
                `,
                    { type: Sequelize.QueryTypes.UPDATE, transaction }
                );
            }
            // await queryInterface.removeColumn(
            //     'lessonOrganizationClasses',
            //     'begin',
            //     { transaction }
            // );
            // await queryInterface.removeColumn(
            //     'lessonOrganizationClasses',
            //     'end',
            //     { transaction }
            // );

            await queryInterface.sequelize.query(
                `
                update lessonOrganizationClassMembers m 
                set type=2,m.endTime = (
                    select endDate from lessonOrganizations where id = m.organizationId
                ) where id >0;
            `,
                { type: Sequelize.QueryTypes.UPDATE, transaction }
            );

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    },

    down: (queryInterface, Sequelize) => {
        //
    },
};
