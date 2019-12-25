'use strict';

const Service = require('../common/service.js');
const {
    TOKEN_DEFAULT_EXPIRE,
    CLASS_MEMBER_ROLE_ADMIN,
    CLASS_MEMBER_ROLE_STUDENT,
    CLASS_MEMBER_ROLE_TEACHER,
    FIVE,
    SIX,
    SEVEN,
} = require('../common/consts.js');

const _ = require('lodash');
const Err = require('../common/err');

class LessonOrgService extends Service {
    /**
     * 合并这个人在这个机构中的全部角色,并且生成一个token
     * @param {*} params 结构：{members,userId,username,organizationId,loginUrl}
     * @param {*} config token 的密钥，过期时间等
     */
    async mergeRoleIdAndGenToken(params, config) {
        let roleId = 0;
        _.each(params.members, o => {
            roleId = roleId | o.roleId;
        });

        // 生成token
        const token = this.ctx.helper.jwtEncode(
            {
                userId: params.userId,
                roleId,
                username: params.username,
                organizationId: params.organizationId,
                loginUrl: params.loginUrl,
            },
            config.secret,
            config.tokenExpire || TOKEN_DEFAULT_EXPIRE
        );

        return { token, roleId };
    }

    /**
     * 根据条件获取机构
     * @param {*} condition 必选 对象
     */
    async getByCondition(condition) {
        const ret = await this.ctx.model.LessonOrganization.findOne({
            where: condition,
        });
        return ret ? ret.get() : undefined;
    }

    /**
     * 获取用户加入的机构
     * @param {*} userId userId
     */
    async getUserOrganizations(userId) {
        const sql = `
		SELECT DISTINCT o.* FROM lessonOrganizations o
		LEFT JOIN lessonOrganizationClassMembers m ON o.id = m.organizationId 
		WHERE m.memberId = ${userId}
		`;
        const list = await this.ctx.model.query(sql, {
            type: this.ctx.model.QueryTypes.SELECT,
        });
        return list;
    }

    /**
     * 创建机构，如果传了usernames,packages，会创建机构管理员和机构package
     * @param {*} params {usernames,packages,...}
     */
    async createOrganization(params) {
        const organ = await this.ctx.model.LessonOrganization.create(
            params
        ).then(o => o && o.toJSON());
        if (!organ) return this.ctx.throw(500, Err.DB_ERR);

        // 创建机构package
        if (params.packages) {
            await this.createPackageForOrganization(params.packages, organ.id);
        }

        // 添加管理员
        if (params.usernames) {
            await this.createAdminForOrganization(params.usernames, organ.id);
        }

        return organ;
    }

    /**
     * 给机构增加packages
     * @param {*} packages packages
     * @param {*} organizationId organizationId
     */
    async createPackageForOrganization(packages, organizationId) {
        const p = _.map(packages, pkg => ({
            organizationId,
            classId: 0,
            packageId: pkg.packageId,
            lessons: pkg.lessons,
        }));
        await this.ctx.model.LessonOrganizationPackage.bulkCreate(p);
    }

    /**
     * 给机构增加admin成员
     * @param {*} usernames usernames
     * @param {*} organizationId organizationId
     */
    async createAdminForOrganization(usernames, organizationId) {
        const users = await this.ctx.service.keepwork.getAllUserByCondition({
            username: { $in: usernames },
        });

        const members = _.map(users, o => ({
            classId: 0,
            organizationId,
            memberId: o.id,
            roleId: CLASS_MEMBER_ROLE_ADMIN,
        }));
        await this.model.LessonOrganizationClassMember.bulkCreate(members);
        // 为管理员添加tLevel
        await Promise.all(
            users.map(user => {
                return this.ctx.service.lessonOrganizationClassMember.updateUserVipAndTLevel(
                    user.id
                );
            })
        );
    }

    /**
     * 给这个organization更新一下packages
     * @param {*} organizationId organizationId
     * @param {*} packages packages
     */
    async fixedClassPackage(organizationId, packages) {
        const pkgs = await this.model.LessonOrganizationPackage.findAll({
            where: { organizationId, classId: { $gt: 0 } },
        }).then(list => list.map(o => o.toJSON()));

        const datas = [];
        _.each(pkgs, o => {
            const pkg = _.find(packages, p => ~~p.packageId === ~~o.packageId);
            if (!pkg) return;
            const lessons = [];
            _.each(o.lessons, l => {
                const pl = _.find(
                    pkg.lessons,
                    pl => ~~pl.lessonId === ~~l.lessonId
                );
                if (pl) lessons.push(pl);
            });
            o.lessons = lessons;
            datas.push(o);
        });

        await this.model.LessonOrganizationPackage.destroy({
            where: { organizationId, classId: { $gt: 0 } },
        });
        await this.model.LessonOrganizationPackage.bulkCreate(datas);
    }

    /**
     * 根据organizationId更新
     * @param {*} params params
     * @param {*} organ organ
     * @param {*} authParams authParams
     */
    async updateOrganization(params, organ, authParams) {
        let transaction;
        try {
            transaction = await this.ctx.model.transaction();
            if (this.ctx.state.admin && this.ctx.state.admin.userId) {
                await this.ctx.model.LessonOrganization.update(params, {
                    where: { id: organ.id },
                    transaction,
                });
            } else {
                const { userId, roleId = 0, username } = authParams;
                if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
                    return this.ctx.throw(403, Err.AUTH_ERR);
                }
                await this.ctx.model.LessonOrganization.update(params, {
                    where: { id: organ.id },
                    transaction,
                });

                if (params.privilege && organ.privilege !== params.privilege) {
                    await this.ctx.model.LessonOrganizationLog.create({
                        organizationId: organ.id,
                        type: '系统',
                        description:
                            params.privilege === 0
                                ? '不允许任课教师管理学生信息'
                                : '允许任课教师管理学生信息',
                        handleId: userId,
                        username,
                    });
                }
            }
            if (new Date(params.endDate) < new Date()) {
                // 那么要结束机构的全部学生
                await this.ctx.model.LessonOrganizationClassMember.update(
                    {
                        endTime: params.endDate,
                    },
                    {
                        where: {
                            organizationId: organ.id,
                        },
                        transaction,
                    }
                );
            }
            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            this.ctx.throw(500, Err.DB_ERR);
        }
    }

    /**
     * ???
     * @param {*} packageId packageId
     * @param {*} classId classId
     * @param {*} roleId roleId
     * @param {*} userId userId
     * @param {*} organizationId organizationId
     */
    async getPackage(packageId, classId, roleId, userId, organizationId) {
        let list = [];
        if (classId !== undefined) {
            list = await this.model.LessonOrganizationPackage.findAll({
                where: { organizationId, packageId, classId },
            }).then(list => _.map(list, o => o.toJSON()));
        } else {
            const classIds = await this.model.LessonOrganizationClassMember.getAllClassIds(
                { memberId: userId, roleId, organizationId }
            );
            list = await this.model.LessonOrganizationPackage.findAll({
                where: {
                    organizationId,
                    packageId,
                    classId: { $in: classIds },
                },
            }).then(list => _.map(list, o => o.toJSON()));
        }

        list = this.ctx.service.lessonOrganizationPackage.mergePackages(list);

        return list[0];
    }

    async getPackageDetail(packageId, classId, roleId, userId, organizationId) {
        const pkg = await this.getPackage(
            packageId,
            classId,
            roleId,
            userId,
            organizationId
        );

        if (!pkg) return this.ctx.throw(400, Err.ARGS_ERR);

        const pkginfo = await this.ctx.model.Package.findOne({
            where: { id: pkg.packageId },
        }).then(o => o && o.toJSON());

        const lessonIds = _.map(pkg.lessons, o => o.lessonId);
        const lessons = await this.ctx.model.Lesson.findAll({
            where: { id: { [this.ctx.model.Op.in]: lessonIds } },
        }).then(list => _.map(list, o => o.toJSON()));

        _.each(pkg.lessons, o => {
            o.lesson = _.find(lessons, l => l.id === o.lessonId);
        });

        pkg.package = pkginfo;

        return pkg;
    }

    /**
     * 获取机构已用人数？？
     * @param {*} organizationId organizationId
     */
    async getOrganMemberCount(organizationId) {
        return await this.ctx.model.LessonOrganization.getUsedCount(
            organizationId
        );
    }

    /**
     * 获取机构学生的人数
     * @param {*} organizationId organizationId
     */
    async getStudentCount(organizationId) {
        return await this.ctx.model.LessonOrganization.getMemberCount(
            organizationId,
            1
        );
    }

    /**
     * 获取教师列表
     * @param {*} organizationId organizationId
     * @param {*} classId classId
     */
    async getTeachers(organizationId, classId) {
        return await this.ctx.model.LessonOrganization.getTeachers(
            organizationId,
            classId
        );
    }

    /**
     *
     * @param {*} organizationId organizationId
     * @param {*} classId classId
     * @param {*} type type 用户类型，1.试听，2.正式
     * @param {*} username username
     */
    async getStudentIds(organizationId, classId, type, username) {
        return await this.ctx.model.LessonOrganization.getStudentIds(
            organizationId,
            classId,
            type,
            username
        );
    }

    // 获取机构各角色的人数,和人数上限
    async getMemberCountByRoleId(organizationId) {
        const [studentCount, teacherCount, organ] = await Promise.all([
            this.ctx.model.LessonOrganization.getMemberCount(
                organizationId,
                CLASS_MEMBER_ROLE_STUDENT
            ),
            this.ctx.model.LessonOrganization.getMemberCount(
                organizationId,
                CLASS_MEMBER_ROLE_TEACHER
            ),
            this.getByCondition({ id: organizationId }),
        ]);

        return {
            studentCount,
            teacherCount,
            upperLimit: organ ? organ.count : 0,
        };
    }

    // 机构课程包【代替之前的graphQL接口】
    async getOrgPackages(organizationId) {
        const orgPackages = await this.ctx.model.LessonOrganization.getOrgPackages(
            organizationId
        );

        const lessonIds = []; // 提取lessonId,并找到它们
        orgPackages.forEach(r => {
            const lessons = r.lessons;

            lessons.forEach(rr => {
                lessonIds.push(rr.lessonId);
            });
        });
        const lessons = await this.ctx.model.Lesson.findAll({
            attributes: ['id', 'lessonName'],
            where: { id: { $in: lessonIds } },
        });

        for (let i = 0; i < orgPackages.length; i++) {
            const _lessons = orgPackages[i].lessons;

            for (let j = 0; j < _lessons.length; j++) {
                const index = _.findIndex(
                    lessons,
                    o => o.id === _lessons[j].lessonId
                );
                if (index > -1) {
                    // _lessons[j] = lessons[index];
                    _lessons[j] = {
                        id: lessons[index].id,
                        lessonName: lessons[index].lessonName,
                        lessonNo: _lessons[j].lessonNo,
                    };
                }
            }
        }

        return orgPackages;
    }

    // 校验是否在教师列表中&&是否存在这个用户
    async checkUserInvalid(username, organizationId) {
        const user = await this.ctx.model.User.findOne({ where: { username } });
        if (!user) this.ctx.throw(400, Err.USER_NOT_EXISTS);

        const isTeacher = await this.ctx.model.LessonOrganizationClassMember.findOne(
            {
                where: {
                    organizationId,
                    memberId: user.id,
                    roleId: CLASS_MEMBER_ROLE_TEACHER,
                },
            }
        );
        if (isTeacher) this.ctx.throw(409, Err.ALREADY_ISTEACHER_IN_ORG);
    }

    // 获取机构的所有班级，嵌套返回所有成员
    async getClassAndMembers(organizationId, roleId, userId) {
        const list = await this.ctx.model.LessonOrganizationClass.findAll({
            where: {
                organizationId, status: 1,
            },
            attributes: [
                ['id', 'classId'],
                ['name', 'className'],
            ],
            include: [
                {
                    as: 'lessonOrganizationClassMembers',
                    model: this.model.LessonOrganizationClassMember,
                    attributes: [
                        'memberId',
                        'realname',
                        'roleId',
                        'parentPhoneNum',
                    ],
                },
            ],
        });

        const retArr = [];
        for (let i = 0; i < list.length; i++) {
            const element = list[i].get();

            const obj = {
                classId: element.classId,
                className: element.className,
                teacherList: [],
                studentList: [],
            };

            const members = element.lessonOrganizationClassMembers;
            if (roleId === CLASS_MEMBER_ROLE_TEACHER) {
                // 老师只返回自己执教的班级
                const index = _.findIndex(
                    members,
                    o =>
                        o.memberId === userId &&
                        o.roleId & CLASS_MEMBER_ROLE_TEACHER
                );
                if (index === -1) continue;
            }

            // 老师学生分别加到teacherList和studentList中
            for (let j = 0; j < members.length; j++) {
                if (members[j].roleId & CLASS_MEMBER_ROLE_TEACHER) {
                    obj.teacherList.push({
                        userId: members[j].memberId,
                        realname: members[j].realname,
                    });
                }
                if (members[j].roleId & CLASS_MEMBER_ROLE_STUDENT) {
                    obj.studentList.push({
                        userId: members[j].memberId,
                        realname: members[j].realname,
                        parentPhoneNum: members[j].parentPhoneNum,
                    });
                }
            }
            retArr.push(obj);
        }
        return retArr;
    }

    // 获取用户加入的全部机构
    async getUserOrgInfo(userId, roleId) {
        return await this.ctx.model.LessonOrganization.getUserOrgInfo(
            userId,
            roleId
        );
    }

    // 检查设置的激活码上限是否合理
    async checkActivateCodeLimit(organizationId, { type5, type6, type7 }) {
        const ret = await this.ctx.model.LessonOrganizationActivateCode.getCountByTypeAndState(
            organizationId
        );
        const map = new Map();
        for (let i = 0; i < ret.length; i++) {
            map.set(ret[i].type, (map.get(ret[i].type) || 0) + ret[i].count);
        }
        if (
            map.get(FIVE) > type5 ||
            map.get(SIX) > type6 ||
            map.get(SEVEN) > type7
        ) {
            this.ctx.throw(400, Err.ACTIVATE_CODE_LIMIT_ERR);
        }
    }
}

module.exports = LessonOrgService;
