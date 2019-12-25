'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const codes = await queryInterface.sequelize.query(
                `
            select 
              id,
              classId 
            from lessonOrganizationActivateCodes 
            where classId is not null or classId !=''
            `,
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );
            // 把classId的东西塞到classIds字段，并删除classId字段
            for (let i = 0; i < codes.length; i++) {
                await queryInterface.sequelize.query(
                    `
            update 
              lessonOrganizationActivateCodes
              set classIds = '[${codes[i].classId}]'
            where id = ${codes[i].id}
            `,
                    { type: Sequelize.QueryTypes.UPDATE, transaction }
                );
            }

            await queryInterface.removeColumn(
                'lessonOrganizationActivateCodes',
                'classId',
                { transaction }
            );

            // 把以前剩余的的激活码置为无效
            await queryInterface.sequelize.query(
                `
            update 
              lessonOrganizationActivateCodes
              set state=2
            where state=0
            `,
                { type: Sequelize.QueryTypes.UPDATE, transaction }
            );

            await queryInterface.sequelize.query(
                `
            update lessonOrganizations set activateCodeLimit = \'{\"type5\":0,\"type6\":0,\"type7\":0}\'
            `,
                { type: Sequelize.QueryTypes.UPDATE, transaction }
            );

            // 确定班级的status, 然后删除end,begin
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
            await queryInterface.removeColumn(
                'lessonOrganizationClasses',
                'begin',
                { transaction }
            );
            await queryInterface.removeColumn(
                'lessonOrganizationClasses',
                'end',
                { transaction }
            );

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
