'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const { STRING, INTEGER, BIGINT } = Sequelize;

    return queryInterface.sequelize.transaction(t =>
      Promise.all([
        queryInterface.createTable('messages', {
          id: {
            type: BIGINT,
            autoIncrement: true,
            primaryKey: true,
            comment: '主键id',
          },
          sender: {
            type: BIGINT,
          },
          sendSms: { // 是否发送短信，0.不发送，1.发送
            type: INTEGER,
            defaultValue: 0,
          },
          organizationId: { // 机构id,
            type: BIGINT,
            defaultValue: 0,
          },

          type: {
            // 消息类型 0 - 系统消息,1.机构消息
            type: INTEGER,
            defaultValue: 0,
          },

          all: {
            // 0 - 非全部  1 - 全部
            type: INTEGER,
            defaultValue: 0,
          },
          msg: { // 消息体
            type: JSON,
            defaultValue: {},
          },
          operator: { // 当前登录用户名
            type: STRING,
          },
          senderName: {
            type: STRING,
          },
          senderPortrait: {
            type: STRING,
          },
          createdAt: {
            allowNull: false,
            type: DATE,
          },

          updatedAt: {
            allowNull: false,
            type: DATE,
          },
        }, {
          underscored: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_bin',
          comment: '消息表',
          transaction: t,
        }),

        queryInterface.createTable('userMessages', {
          id: {
            type: BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },

          userId: {
            type: BIGINT,
          },

          msgId: {
            type: BIGINT,
          },

          status: {
            // 0 - 未读  1 - 已读
            type: INTEGER,
            defaultValue: 0,
          },
          createdAt: {
            allowNull: false,
            type: DATE,
          },

          updatedAt: {
            allowNull: false,
            type: DATE,
          },
        }, {
          underscored: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_bin',
          comment: '用户消息记录表',
          transaction: t,
        }).then(async () => {
          await queryInterface.addIndex('userMessages', ['userId', 'msgId'], { unique: true })
        })
      ])
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => Promise.all([
      queryInterface.dropTable('userMessages', { transaction: t }),
      queryInterface.dropTable('messages', { transaction: t })
    ]))
  }
};
