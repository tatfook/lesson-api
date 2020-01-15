'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            queryInterface.addColumn(
                'lessonOrganizationForms',
                'backGroundImg',
                {
                    type: Sequelize.JSON,
                    comment: '头部&页面背景图url,{head:"XXXXX",page:"XXXXX"}',
                },
                { transaction: t }
            ),
                queryInterface.addColumn(
                    'lessonOrganizationForms',
                    'bottomButton',
                    {
                        type: Sequelize.JSON,
                        comment:
                            '底部按钮，show是否显示，content文字。{show:t|f,content:"XXXX"}',
                    },
                    { transaction: t }
                );
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            queryInterface.removeColumn(
                'lessonOrganizationForms',
                'backGroundImg',
                {
                    transaction: t,
                }
            ),
                queryInterface.removeColumn(
                    'lessonOrganizationForms',
                    'bottomButton',
                    {
                        transaction: t,
                    }
                );
        });
    },
};
