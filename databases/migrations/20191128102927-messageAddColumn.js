'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('messages', 'roleId', {
            type: Sequelize.JSON,
            comment: '发机构消息时候的roleId，0 || 2 || 64',
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn('messages', 'roleId');
    },
};
