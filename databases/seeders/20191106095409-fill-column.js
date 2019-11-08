'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const lessons = await queryInterface.sequelize.query(
                'SELECT id, extra FROM lessons',
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            for (let i = 0; i < lessons.length; i++) {
                // 更新lessons
                const element = lessons[i];
                if (element.extra && JSON.stringify(element.extra) !== '{}') {
                    let str = ``;
                    if (element.extra.coverUrl)
                        str += ` coverUrl='${element.extra.coverUrl}',`;
                    if (element.extra.duration)
                        str += ` duration='${element.extra.duration}',`;
                    if (element.extra.teacherVideoUrl)
                        str += ` teacherVideoUrl='${element.extra.teacherVideoUrl}',`;
                    if (element.extra.videoUrl)
                        str += ` videoUrl='${element.extra.videoUrl}',`;
                    if (str) {
                        str = str.substring(0, str.length - 1);
                        await queryInterface.sequelize.query(
                            `
            update lessons set ${str} where id = ${element.id}
          `,
                            { type: Sequelize.QueryTypes.UPDATE, transaction }
                        );
                    }
                }
            }

            const packageLessons = await queryInterface.sequelize.query(
                'SELECT id, extra FROM packageLessons',
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            for (let i = 0; i < packageLessons.length; i++) {
                // 更新packageLessons
                const element = packageLessons[i];
                if (element.extra && element.extra.lessonNo) {
                    await queryInterface.sequelize.query(
                        `
            update packageLessons set lessonNo=${element.extra.lessonNo} where id = ${element.id}
          `,
                        { type: Sequelize.QueryTypes.UPDATE, transaction }
                    );
                }
            }

            const packages = await queryInterface.sequelize.query(
                'SELECT id, extra FROM packages',
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            for (let i = 0; i < packages.length; i++) {
                // 更新packages
                const element = packages[i];
                if (element.extra && element.extra.lessonNo) {
                    await queryInterface.sequelize.query(
                        `
            update packages set coverUrl='${element.extra.coverUrl}' where id = ${element.id}
          `,
                        { type: Sequelize.QueryTypes.UPDATE, transaction }
                    );
                }
            }

            const activateCodes = await queryInterface.sequelize.query(
                'SELECT id, extra FROM lessonOrganizationActivateCodes',
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            for (let i = 0; i < activateCodes.length; i++) {
                // 更新activateCodes
                const element = activateCodes[i];
                if (element.extra && element.extra.name) {
                    await queryInterface.sequelize.query(
                        `
            update lessonOrganizationActivateCodes set name='${element.extra.name}' where id = ${element.id}
          `,
                        { type: Sequelize.QueryTypes.UPDATE, transaction }
                    );
                }
            }

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    },

    down: (queryInterface, Sequelize) => {
        //
    },
};
