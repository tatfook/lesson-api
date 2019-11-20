'use strict';

const Service = require('../common/service.js');
const {
    CLASS_MEMBER_ROLE_TEACHER,
    CLASS_MEMBER_ROLE_ADMIN,
    CLASS_MEMBER_ROLE_STUDENT } = require('../common/consts');
const Err = require('../common/err');
const _ = require('lodash');

class Message extends Service {

    async pushServerUrl() {
        return this.config.self.pushServerBaseUrl;
    }

    // 拿到要通知的用户id,去重
    async getUserIds(organizationId, classIds, userIds) {
        return await this.ctx.model.LessonOrganizationClassMember
            .getUserIdsByOrganizationId(organizationId, classIds, userIds);
    }

    async getMembersAndRole(organizationId, classIds, userIds) {
        return await this.ctx.model.LessonOrganizationClassMember
            .getMembersAndRoleId(organizationId, classIds, userIds);
    }

    // 获取要发送短信的手机号
    async getCellPhone(organizationId, classIds, userIds) {
        const list = await this.getMembersAndRole(organizationId, classIds, userIds.map(r => r.userId));
        const userIdArr = [ ...list, ...(userIds.filter(o => o.roleId === CLASS_MEMBER_ROLE_STUDENT)) ];

        const parentPhone = await this.ctx.model.LessonOrganizationClassMember.findAll({
            where: {
                organizationId, memberId: { $in: userIdArr.map(r => r.userId) },
            },
        });
        return _.uniq(parentPhone.map(r => r.parentPhoneNum));
    }

    // 创建userMessages,推送和发短信
    async pushAndSendSms(organizationId, classIds, userIds, msg, msgId) {
        const userIdArr = await this.getUserIds(organizationId, classIds, userIds.map(r => r.userId));

        const userMsg = userIdArr.map(r => {
            return {
                userId: r,
                msgId,
            };
        });
        // 创建userMessages
        await this.ctx.model.UserMessage.bulkCreate(userMsg);
        // to push-server
        await this.ctx.helper.curl('post', `${this.pushServerUrl}api/v0/app/msg`, { userIds: userIdArr, msg });

        const limited = 200;
        // 发送短信,一次只能给200个手机发短信，每分钟只能发300次
        const phoneList = await this.getCellPhone(organizationId, classIds, userIds);
        let sendPhone = '';
        for (let i = 0; i < phoneList.length; i++) {
            const element = phoneList[i];
            if (_.isInteger((i + 1) / limited)) {
                sendPhone += `${element}`;
                await this.ctx.service.user.sendSms(sendPhone, [ msg.text ], 'XXX');
                sendPhone = '';
            } else {
                sendPhone += `${element},`;
            }
        }

        if (sendPhone) {
            sendPhone = sendPhone.substring(0, sendPhone.length - 1);
            await this.ctx.service.user.sendSms(sendPhone, [ msg.text ], 'XXX');
        }
    }

    // 发送消息
    async createMsg({ sendSms, msg, classIds, userIds },
        { userId, roleId, organizationId, username }) {

        if (![ CLASS_MEMBER_ROLE_TEACHER, CLASS_MEMBER_ROLE_ADMIN ].includes(roleId)) {
            return this.ctx.throw(403, Err.AUTH_ERR);
        }
        const [ senderInfo, member ] = await Promise.all([
            this.ctx.service.keepwork.getAllUserByCondition({ id: userId }),
            this.ctx.service.lessonOrganizationClassMember.getByCondition({ memberId: userId, organizationId }),
        ]);

        const message = await this.ctx.model.Message.create({
            sender: userId,
            organizationId,
            sendSms,
            type: 1,
            all: 0,
            msg,
            operator: username,
            senderName: roleId === CLASS_MEMBER_ROLE_ADMIN ? '管理员' : `${member.realname}老师`,
            senderPortrait: senderInfo.length ? senderInfo[0].portrait : '',
        });

        // 不等待
        this.pushAndSendSms(organizationId, classIds, userIds, msg, message.id);
    }
}

module.exports = Message;
