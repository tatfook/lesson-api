'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            await Promise.all([
                queryInterface.addColumn(
                    'lessonOrganizationActivateCodes',
                    'type',
                    {
                        type: Sequelize.INTEGER,
                        comment:
                            '1.试听一个月，2.试听两个月，5.正式三个月，6.正式六个月，7.正式一年(送三个月)',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationActivateCodes',
                    'classIds',
                    {
                        type: Sequelize.JSON,
                        comment: '班级id数组',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizations',
                    'activateCodeLimit',
                    {
                        type: Sequelize.JSON,
                        defaultValue: {},
                        comment: '正式邀请码上限,{type5,type6,type7}',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClasses',
                    'status',
                    {
                        type: Sequelize.INTEGER,
                        comment: '1.开启中，2.已关闭',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClassMembers',
                    'type',
                    {
                        type: Sequelize.INTEGER,
                        comment: '用户类型，1.试听，2.正式',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClassMembers',
                    'endTime',
                    {
                        type: Sequelize.DATE,
                        comment: '到期时间',
                    },
                    { transaction: t }
                ),
            ]);

            await Promise.all([
                queryInterface.removeColumn('lessonOrganizations', 'count', {
                    transaction: t,
                }),
                queryInterface.removeColumn(
                    'lessonOrganizationClasses',
                    'begin',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationClasses',
                    'end',
                    { transaction: t }
                ),
            ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async t => {
            await Promise.all([
                queryInterface.addColumn(
                    'lessonOrganizations',
                    'count',
                    {
                        type: Sequelize.INTEGER,
                        comment: '学生人数上限',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClasses',
                    'begin',
                    {
                        type: Sequelize.DATE,
                        comment: '班级开始时间',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessonOrganizationClasses',
                    'end',
                    {
                        type: Sequelize.DATE,
                        comment: '班级结束时间',
                    },
                    { transaction: t }
                ),
            ]);

            await Promise.all([
                queryInterface.removeColumn(
                    'lessonOrganizationActivateCodes',
                    'type',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationActivateCodes',
                    'classIds',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizations',
                    'activateCodeLimit',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationClasses',
                    'status',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationClassMembers',
                    'type',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'lessonOrganizationClassMembers',
                    'endTime',
                    { transaction: t }
                ),
            ]);
        });
    },
};
