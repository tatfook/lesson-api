'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            queryInterface.addColumn(
                'lessonOrganizations',
                'type',
                {
                    type: Sequelize.INTEGER,
                    comment: '1.试用机构，2.正式机构',
                    defaultValue: 1,
                },
                { transaction: t }
            )
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            queryInterface.removeColumn('lessonOrganizations', 'type', {
                transaction: t,
            })
        });
    },
};
