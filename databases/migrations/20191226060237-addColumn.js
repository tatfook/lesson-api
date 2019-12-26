'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      queryInterface.addColumn(
        'packages',
        'auditAt',
        {
          type: Sequelize.DATE,
          comment: '审核时间',
        },
        { transaction: t }
      ),
        queryInterface.addColumn(
          'lessons',
          'coursewareUrl',
          {
            type: Sequelize.STRING,
            comment: '课程url',
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'lessonContents',
          'courseware',
          {
            type: Sequelize.TEXT,
            comment: '课件内容',
          },
          { transaction: t }
        )
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      queryInterface.removeColumn(
        'packages',
        'auditAt',
        { transaction: t }
      ),
        queryInterface.removeColumn(
          'lessons',
          'coursewareUrl',
          { transaction: t }
        ),
        queryInterface.removeColumn(
          'lessonContents',
          'courseware',
          { transaction: t }
        )
    });
  },
};
