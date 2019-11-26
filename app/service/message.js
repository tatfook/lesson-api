'use strict';

const Service = require('../common/service.js');
const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_ADMIN,
    CLASS_MEMBER_ROLE_STUDENT,
    ORG_MSG_TEMPLEID,
} = require('../common/consts');
const Err = require('../common/err');
const _ = require('lodash');

class Message extends Service {
    pushServerUrl() {
        return this.config.self.pushServerBaseUrl;
    }

    // 拿到要通知的用户id,去重
    async getUserIds(organizationId, classIds, userIds) {
        return await this.ctx.model.LessonOrganizationClassMember.getUserIdsByOrganizationId(
            organizationId,
            classIds,
            userIds
        );
    }

    // 获取学生用户
    async getMembersAndRole(organizationId, classIds, userIds) {
        return await this.ctx.model.LessonOrganizationClassMember.getMembersAndRoleId(
            organizationId,
            classIds,
            userIds
        );
    }

    // 获取要发送短信的手机号
    async getCellPhone(organizationId, classIds, userIds) {
        const list = await this.getMembersAndRole(
            organizationId,
            classIds,
            userIds.map(r => r.userId)
        );
        const userIdArr = [
            ...list,
            ...userIds.filter(o => o.roleId === CLASS_MEMBER_ROLE_STUDENT),
        ];

        const parentPhone = await this.ctx.model.LessonOrganizationClassMember.findAll(
            {
                where: {
                    organizationId,
                    memberId: { $in: userIdArr.map(r => r.userId) },
                },
            }
        );
        return _.uniq(parentPhone.map(r => r.parentPhoneNum));
    }

    // 创建userMessages,推送和发短信
    async pushAndSendSms({
        organizationId,
        classIds,
        userIds,
        sendSms,
        msg,
        msgId,
        senderName,
    }) {
        const userIdArr = await this.getUserIds(
            organizationId,
            classIds,
            userIds.map(r => r.userId)
        );

        const userMsg = userIdArr.map(r => {
            return {
                userId: r,
                msgId,
            };
        });

        const [ , , org ] = await Promise.all([
            // 创建userMessages
            this.ctx.model.UserMessage.bulkCreate(userMsg),

            // to push-server 推送
            this.ctx.helper.curl(
                'post',
                `${this.pushServerUrl()}api/v0/app/msg`,
                {
                    userIds: userIdArr,
                    msg,
                },
                {
                    headers: {
                        Authorization: this.ctx.request.header.authorization,
                    },
                }
            ),

            // get OrgName
            this.ctx.model.LessonOrganization.findOne({
                attributes: [ 'name' ],
                where: { id: organizationId },
            }),
        ]);

        const limited = 200;
        // 发送短信,一次只能给200个手机发短信，每分钟只能发300次
        if (~~sendSms === 1) {
            const phoneList = await this.getCellPhone(
                organizationId,
                classIds,
                userIds
            );
            let sendPhone = '';
            for (let i = 0; i < phoneList.length; i++) {
                const element = phoneList[i];
                if (_.isInteger((i + 1) / limited)) {
                    sendPhone += `${element}`;
                    await this.ctx.service.user.sendSms(
                        sendPhone,
                        [ org.name, senderName, msg.text ],
                        ORG_MSG_TEMPLEID
                    );
                    sendPhone = '';
                } else {
                    sendPhone += `${element},`;
                }
            }

            if (sendPhone) {
                sendPhone = sendPhone.substring(0, sendPhone.length - 1);
                await this.ctx.service.user.sendSms(
                    sendPhone,
                    [ org.name, senderName, msg.text ],
                    ORG_MSG_TEMPLEID
                );
            }
        }
    }

    // 发送消息
    async createMsg(
        { sendSms, msg, classIds, userIds, sendClassIds },
        { userId, roleId, organizationId, username },
        _roleId
    ) {
        if (
            !(CLASS_MEMBER_ROLE_TEACHER & roleId) &&
            !(CLASS_MEMBER_ROLE_ADMIN & roleId)
        ) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }
        const [ senderInfo, member ] = await Promise.all([
            this.ctx.service.keepwork.getAllUserByCondition({ id: userId }),
            this.ctx.service.lessonOrganizationClassMember.getByCondition({
                memberId: userId,
                organizationId,
            }),
        ]);

        const message = await this.ctx.model.Message.create({
            sender: ~~_roleId === CLASS_MEMBER_ROLE_ADMIN ? -1 : userId,
            organizationId,
            sendSms,
            sendClassIds,
            type: 1,
            all: 0,
            msg,
            operator: username,
            senderName:
                ~~_roleId === CLASS_MEMBER_ROLE_ADMIN
                    ? '管理员'
                    : `${member.realname}老师`,
            senderPortrait: senderInfo.length ? senderInfo[0].portrait : '',
        });

        // 推送，创建用户消息，和发送短信
        await this.pushAndSendSms({
            organizationId,
            classIds,
            userIds,
            sendSms,
            msg,
            msgId: message.id,
            senderName:
                ~~_roleId === CLASS_MEMBER_ROLE_ADMIN
                    ? ''
                    : `${member.realname}`,
        });
    }

    async getMessages(queryOptions, userId, roleId, organizationId) {
        const condition = {
            organizationId,
            sender: ~~roleId === CLASS_MEMBER_ROLE_ADMIN ? -1 : userId,
        };

        const ret = await this.ctx.model.Message.findAndCountAll({
            ...queryOptions,
            attributes: [ 'id', 'msg', 'sendSms', 'sendClassIds', 'createdAt' ],
            where: condition,
        });

        const sendClassIds = _.uniq(ret.rows.reduce((p, c) => [ ...p, ...c.sendClassIds ], []));

        // 找出分别发给了哪些班级
        const classNames = await this.ctx.model.LessonOrganizationClass.findAll({
            attributes: [ 'id', 'name' ],
            where: { id: { $in: sendClassIds } },
        });
        ret.rows = ret.rows.map(r => {
            r = r.get ? r.get() : r;
            const sendClassIds = r.sendClassIds;
            let sendTo = '';
            sendClassIds.forEach(r => {
                const index = _.findIndex(classNames, o => o.id === ~~r);
                if (index > -1) {
                    sendTo += classNames[index].name;
                }
            });
            r.sendTo = sendTo;
            delete r.sendClassIds;
            return r;
        });

        return ret;
    }

    // 创建用户的注册消息
    async createRegisterMsg(user) {
        const msg = await this.ctx.model.Message.create({
            sender: 0,
            type: 0,
            all: 0,
            msg: {
                type: 1,
                user: {
                    ...user,
                    password: undefined,
                },
            },
        }).then(o => o && o.toJSON());
        return await this.ctx.model.UserMessage.create({
            userId: user.id,
            msgId: msg.id,
            status: 0,
        }).then(o => o && o.toJSON());
    }
}

module.exports = Message;
