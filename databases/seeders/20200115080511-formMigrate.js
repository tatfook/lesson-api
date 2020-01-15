'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 
            const forms = await queryInterface.sequelize.query(
                `
            select 
              id,
              text
            from lessonOrganizationForms where text is not null 
            `,
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );
          
            for (let i = 0; i < forms.length; i++) {

                await queryInterface.sequelize.query(
                    `
                update lessonOrganizationForms set quizzes = \'[{\"type\":3,\"content\":\"${encodeURIComponent(forms[i].text)}\"}]\' where id = ${forms[i].id};
                `,
                    { type: Sequelize.QueryTypes.UPDATE, transaction }
                );
            }

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
