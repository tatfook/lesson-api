'use strict';

const _ = require('lodash');
const hooks = require('../common/sequelizeHooks');
const { PACKAGE_STATE_AUDIT_SUCCESS } = require('../common/consts.js');

module.exports = app => {
    const { BIGINT, STRING, INTEGER, DATE } = app.Sequelize;

    const HALFK = 512;

    const model = app.model.define(
        'packages',
        {
            id: {
                type: BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },

            userId: {
                type: BIGINT,
                allowNull: false,
            },

            packageName: {
                type: STRING,
                allowNull: false,
                unique: true,
            },

            subjectId: {
                type: BIGINT,
            },

            minAge: {
                type: INTEGER,
                defaultValue: 0,
            },

            maxAge: {
                type: INTEGER,
                defaultValue: 1000,
            },

            state: {
                //  0 - 初始状态  1 - 审核中  2 - 审核成功  3 - 审核失败  4 - 异常态(审核成功后被改坏可不用此状态 用0代替)
                type: INTEGER,
                defaultValue: 0,
            },

            intro: {
                type: STRING(HALFK),
            },

            rmb: {
                // 人民币
                type: INTEGER,
                defaultValue: 0,
            },

            coin: {
                type: INTEGER,
                defaultValue: 0,
            },

            auditAt: {
                type: DATE,
            },

            lastClassroomCount: {
                type: INTEGER,
                defaultValue: 0,
            },
        },
        {
            underscored: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
        }
    );

    model.getById = async (id, userId) => {
        const where = { id };

        if (userId) where.userId = userId;

        const data = await app.model.Package.findOne({ where });

        return data && data.get({ plain: true });
    };

    model.audit = async (packageId, userId, state) => {
        if (~~state !== PACKAGE_STATE_AUDIT_SUCCESS || !userId) {
            await app.model.LessonOrganizationPackage.destroy({
                where: { packageId },
            });
            return;
        }

        await Promise.all([
            app.model.Package.update(
                { auditAt: new Date() },
                { where: { id: packageId } }
            ),
            app.model.Subscribe.upsert({ userId, packageId }),
        ]);
    };

    model.lessons = async packageId => {
        const sql = `select l.*, pl.lessonNo from packageLessons as pl, lessons as l 
		   where pl.lessonId = l.id and pl.packageId = :packageId`;

        let list = await app.model.query(sql, {
            type: app.model.QueryTypes.SELECT,
            replacements: { packageId },
        });
        const TEN_THOUSAND = 10000;
        list = list.map(r => {
            r.lessonNo = r.lessonNo || TEN_THOUSAND;
            return r;
        });

        return _.sortBy(list, [ 'lessonNo' ]);
    };

    model.adminUpdateHook = async function(obj) {
        await this.audit(obj.id, obj.userId, obj.state);
    };

    model.associate = () => {
        app.model.Package.hasMany(app.model.PackageLesson, {
            as: 'packageLessons',
            foreignKey: 'packageId',
            sourceKey: 'id',
            constraints: false,
        });

        app.model.Package.hasMany(app.model.LessonOrganizationPackage, {
            as: 'lessonOrganizationPackages',
            foreignKey: 'packageId',
            sourceKey: 'id',
            constraints: false,
        });

        app.model.Package.belongsTo(app.model.User, {
            as: 'User',
            foreignKey: 'userId',
            targetKey: 'id',
            constraints: false,
        });
    };

    hooks(app);

    return model;
};
