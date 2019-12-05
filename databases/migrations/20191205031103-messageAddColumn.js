'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('messages', 'receivers', {
            type: Sequelize.TEXT,
            comment: '发送给的用户名,逗号隔开【系统消息only】',
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn('messages', 'receivers');
    },
};
