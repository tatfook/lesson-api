'use strict';

const AN_HOUR_SECONDS = 3600; // 一小时的秒
const A_DAY_HOURS = 24; // 一天的小时
const TWO = 2; //

module.exports = {
    PACKAGE_STATE_UNAUDIT: 0, // 课程包状态 未审核
    PACKAGE_STATE_AUDITING: 1, // 课程包状态 审核中
    PACKAGE_STATE_AUDIT_SUCCESS: 2, // 课程包状态 审核成功
    PACKAGE_STATE_AUDIT_FAILED: 3, // 课程包状态 审核失败

    PACKAGE_SUBSCRIBE_STATE_UNBUY: 0, // 课程包订阅状态 未购买
    PACKAGE_SUBSCRIBE_STATE_BUY: 1, // 课程包订阅状态 已购买

    TEACHER_KEY_STATE_UNUSED: 0, // 教师KEY状态 未使用
    TEACHER_KEY_STATE_USING: 1, // 教师KEY状态 使用中
    TEACHER_KEY_STATE_DISABLE: 2, // 教师KEY状态 禁用

    USER_IDENTIFY_DEFAULT: 0, // 普通用户
    USER_IDENTIFY_STUDENT: 1, // 学生
    USER_IDENTIFY_TEACHER: 2, // 讲师 共享教师
    USER_IDENTIFY_APPLY_TEACHER: 4, // 申请讲师中
    USER_IDENTIFY_ALLIANCE_MEMBER: 8, // 共享会员 联盟会员
    USER_IDENTIFY_TUTOR: 16, // 导师

    USER_ROLE_DEFAULT: 0, // 普通用户
    USER_ROLE_STUDENT: 1, // 学生
    USER_ROLE_TEACHER: 2, // 讲师
    USER_ROLE_ALLIANCE_MEMBER: 8, // 联盟会员
    USER_ROLE_TUTOR: 16, // 导师

    CLASSROOM_STATE_UNUSED: 0, // 课堂状态 未上课
    CLASSROOM_STATE_USING: 1, // 上课中
    CLASSROOM_STATE_USED: 2, // 上课结束

    LEARN_RECORD_STATE_START: 0, // 学习记录状态 自学
    LEARN_RECORD_STATE_FINISH: 1, // 学习记录状态 自学

    COIN_TYPE_SUBSCRIBE_PACKAGE: 0, // 知识币变更类型 订阅课程包
    COIN_TYPE_SYSTEM_DONATE: 1, //  知识币变更类型 系统赠送
    COIN_TYPE_PACKAGE_REWARD: 2, // 知识币变更类型 课程包返还

    TEACHER_PRIVILEGE_TEACH: 1, // 教师权限 教课权限

    TRADE_TYPE_CHARGE: 0, // 充值
    TRADE_TYPE_EXCHANGE: 1, // 兑换
    TRADE_TYPE_PACKAGE_BUY: 2, // 购买课程包
    TRADE_TYPE_LESSON_STUDY: 3, // 课程学习

    CLASS_MEMBER_ROLE_STUDENT: 1, // 学生
    CLASS_MEMBER_ROLE_TEACHER: 2, // 教师
    CLASS_MEMBER_ROLE_ADMIN: 64, // 管理员
    CLASS_MEMBER_FULL_ROLE: 67, // 满权限（64+2+1）

    KEEPWORKUSER_ADMIN_ROLEID: 10, // keepwork系统管理员roleId
    KEEPWORKUSER_ROLEID: 0, // keepwork系统普通用户roleId

    TOKEN_DEFAULT_EXPIRE: AN_HOUR_SECONDS * A_DAY_HOURS * TWO, // token默认过期时间，两天

    API_KEY: 'cda5ab42f101e9f739156e532f54db0d', // lesson_api的md5值

    ORG_MSG_TEMPLEID: '486724', // 机构消息模板id
    EVA_REPO_TEMPLETID: '479638', // 评估报告模板id
};
