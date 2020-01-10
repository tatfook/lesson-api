'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await Promise.all([
            queryInterface.removeColumn('lessonOrganizationClasses', 'begin'),
            queryInterface.removeColumn('lessonOrganizationClasses', 'end'),
            queryInterface.removeColumn(
                'lessonOrganizationActivateCodes',
                'classId'
            ),
        ]);
    },

    down: (queryInterface, Sequelize) => {
        // do nothing
    },
};
