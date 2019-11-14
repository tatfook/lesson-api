'use strict';

const Service = require('../common/service.js');
const Err = require('../common/err');
const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_ADMIN,
} = require('../common/consts.js');

class LessonOrgIndexService extends Service {
    async changePassword(params, authParams) {
        const { userId, organizationId, username, roleId } = authParams;

        if (roleId < CLASS_MEMBER_ROLE_TEACHER) {
            return this.ctx.throw(400, Err.AUTH_ERR);
        }

        if (roleId < CLASS_MEMBER_ROLE_ADMIN) {
            const teacher = await this.ctx.service.lessonOrganizationClassMember.getByCondition(
                {
                    organizationId,
                    classId: params.classId,
                    memberId: userId,
                }
            );
            if (teacher.roleId < CLASS_MEMBER_ROLE_TEACHER) {
                return this.throw(400, Err.AUTH_ERR);
            }
        }

        const member = await this.ctx.service.lessonOrganizationClassMember.getByCondition(
            {
                organizationId,
                classId: params.classId,
                memberId: params.memberId,
            }
        );
        if (!member) return false;

        const ok = await this.ctx.service.user.updateKeepworkResourceByCondition(
            {
                password: this.ctx.helper.md5(params.password),
                resources: 'users',
            },
            { id: params.memberId }
        );

        this.model.LessonOrganizationLog.create({
            organizationId,
            type: '学生',
            username,
            handleId: userId,
            description: '修改密码, 学生: ' + (member.realname || ''),
        });
        return ok;
    }

    /**
     *
     * @param {*} queryOptions queryOptions
     * @param {*} condition condition
     */
    async getLog(queryOptions, condition) {
        const logs = await this.ctx.model.LessonOrganizationLog.findAndCountAll(
            {
                ...queryOptions,
                where: condition,
            }
        );
        return logs;
    }
}

module.exports = LessonOrgIndexService;
