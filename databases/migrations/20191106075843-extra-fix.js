'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        const { STRING, INTEGER } = Sequelize;

        return queryInterface.sequelize.transaction(t =>
            Promise.all([
                queryInterface.addColumn(
                    'lessons',
                    'coverUrl',
                    { type: Sequelize.STRING(1024), comment: '封面url' },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessons',
                    'duration',
                    {
                        type: Sequelize.STRING(32),
                        comment: '所需时长，如:90min',
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessons',
                    'teacherVideoUrl',
                    { type: Sequelize.STRING(1024), comment: '老师视频' },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'lessons',
                    'studentVideoUrl',
                    { type: Sequelize.STRING(1024), comment: '学生视频' },
                    { transaction: t }
                ),

                queryInterface.addColumn(
                    'packageLessons',
                    'lessonNo',
                    {
                        type: Sequelize.INTEGER,
                        comment: '在这个课程包内的序号',
                    },
                    { transaction: t }
                ),

                queryInterface.addColumn(
                    'packages',
                    'coverUrl',
                    { type: Sequelize.STRING(1024), comment: '课程序号' },
                    { transaction: t }
                ),

                queryInterface.addColumn(
                    'packages',
                    'refuseMsg',
                    { type: Sequelize.STRING(512), comment: '审核拒绝信息' },
                    { transaction: t }
                ),

                queryInterface.addColumn(
                    'lessonOrganizationActivateCodes',
                    'name',
                    { type: Sequelize.STRING(64), comment: '用户名' },
                    { transaction: t }
                ),
            ])
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t =>
            Promise.all([
                queryInterface.removeColumn('lessons', 'coverUrl', {
                    transaction: t,
                }),
                queryInterface.removeColumn('lessons', 'duration', {
                    transaction: t,
                }),
                queryInterface.removeColumn('lessons', 'teacherVideoUrl', {
                    transaction: t,
                }),
                queryInterface.removeColumn('lessons', 'studentVideoUrl', {
                    transaction: t,
                }),

                queryInterface.removeColumn('packageLessons', 'lessonNo', {
                    transaction: t,
                }),

                queryInterface.removeColumn('packages', 'coverUrl', {
                    transaction: t,
                }),

                queryInterface.removeColumn('packages', 'refuseMsg', {
                    transaction: t,
                }),

                queryInterface.removeColumn(
                    'lessonOrganizationActivateCodes',
                    'name',
                    { transaction: t }
                ),
            ])
        );
    },
};
