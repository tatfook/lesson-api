'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('messages', 'sendClassIds', {
            type: Sequelize.JSON,
            comment: '发送的班级id，显示用，不代表全部的成员',
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn('messages', 'sendClassIds');
    },
};
