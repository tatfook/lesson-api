'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        const { BIGINT, STRING, INTEGER, JSON, DATE } = Sequelize;

        return queryInterface.sequelize.transaction(t =>
            Promise.all([
                queryInterface.addColumn(
                    'lessonOrganizations',
                    'QRCode',
                    { type: Sequelize.STRING(256), comment: '二维码链接url' },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizations',
                    'propaganda',
                    { type: Sequelize.STRING(256), comment: '宣传文案' },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClassMembers',
                    'parentPhoneNum',
                    { type: Sequelize.STRING(11) },
                    { transaction: t }
                ),
                queryInterface
                    .createTable(
                        'evaluationUserReports',
                        {
                            id: {
                                type: BIGINT,
                                autoIncrement: true,
                                primaryKey: true,
                                comment: '主键id',
                            },
                            userId: {
                                type: BIGINT,
                                defaultValue: 0,
                                comment: '学生id',
                            },
                            reportId: {
                                type: BIGINT,
                                defaultValue: 0,
                                comment: 'evaluationReports的主键id',
                            },
                            star: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '总体评分，星星数[1,5]',
                            },
                            spatial: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '空间思维能力，星星数[1,5]',
                            },
                            collaborative: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '协作沟通能力，星星数[1,5]',
                            },

                            creative: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '创新思维能力，星星数[1,5]',
                            },
                            logical: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '逻辑思考能力，星星数[1,5]',
                            },
                            compute: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '计算思维能力，星星数[1,5]',
                            },
                            coordinate: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '统筹思维能力，星星数[1,5]',
                            },
                            comment: {
                                type: STRING(256),
                                defaultValue: '',
                                comment: '文字评价',
                            },
                            mediaUrl: {
                                type: JSON,
                                defaultValue: [],
                                comment: '媒体文件路径，数组',
                            },
                            isSend: {
                                type: INTEGER,
                                defaultValue: 0,
                                comment: '是否已经发送给家长，0.没有，1.已发送',
                            },
                            createdAt: {
                                allowNull: false,
                                type: DATE,
                            },
                            updatedAt: {
                                allowNull: false,
                                type: DATE,
                            },
                        },
                        {
                            underscored: false,
                            charset: 'utf8mb4',
                            collate: 'utf8mb4_bin',
                            comment: '学生评估报告记录表',
                            transaction: t,
                        }
                    )
                    .then(async () => {
                        await queryInterface.addIndex('evaluationUserReports', [
                            'userId',
                        ]);
                        await queryInterface.addIndex('evaluationUserReports', [
                            'reportId',
                        ]);
                        await queryInterface.addIndex(
                            'evaluationUserReports',
                            ['userId', 'reportId'],
                            { unique: true }
                        );
                    }),

                queryInterface
                    .createTable(
                        'evaluationReports',
                        {
                            id: {
                                type: BIGINT,
                                autoIncrement: true,
                                primaryKey: true,
                                comment: '主键id',
                            },

                            userId: {
                                type: BIGINT,
                                defaultValue: 0,
                                comment: '老师id',
                            },

                            name: {
                                type: STRING,
                                allowNull: false,
                                comment: '报告名字',
                            },

                            type: {
                                type: INTEGER,
                                defaultValue: 1,
                                comment: '1.小评，2.阶段总结',
                            },

                            classId: {
                                type: BIGINT,
                                defaultValue: 0,
                                comment: '班级id',
                            },

                            createdAt: {
                                allowNull: false,
                                type: DATE,
                            },

                            updatedAt: {
                                allowNull: false,
                                type: DATE,
                            },
                        },
                        {
                            underscored: false,
                            charset: 'utf8mb4',
                            collate: 'utf8mb4_bin',
                            comment: '评估报告表',
                            transaction: t,
                        }
                    )
                    .then(async () => {
                        await queryInterface.addIndex('evaluationReports', [
                            'userId',
                        ]);
                        await queryInterface.addIndex('evaluationReports', [
                            'classId',
                        ]);
                    }),
            ])
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t =>
            Promise.all([
                queryInterface.removeColumn('lessonOrganizations', 'QRCode', {
                    transaction: t,
                }),
                queryInterface.removeColumn(
                    'lessonOrganizations',
                    'propaganda',
                    {
                        transaction: t,
                    }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationClassMembers',
                    'parentPhoneNum',
                    { transaction: t }
                ),
                queryInterface.dropTable('evaluationUserReports', {
                    transaction: t,
                }),
                queryInterface.dropTable('evaluationReports', {
                    transaction: t,
                }),
            ])
        );
    },
};
