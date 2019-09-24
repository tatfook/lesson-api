"use strict";

const errs = {
	"-1": {
		code: -1,
		message: "未知错误"
	},
	"0": {
		code: 0,
		message: "服务器繁忙,请稍后重试..."
	},
	"1": {
		code: 1,
		message: "课堂不存在"
	},
	"2": {
		code: 2,
		message: "课堂人数已满"
	}
};

module.exports = {
	getByCode: (code) => {
		return errs[code];
	},
	"UNKNOWN_ERR": "未知错误",
	"CLASSROOM_NOT_EXISTS": "课堂不存在",
	"CLASSROOM_FULL": "课堂人数已满",
	"USERNAME_OR_PWD_ERR": "用户名或密码错误",
	"LESSON_OR_PACKAGE_NOT_EXISTS": "课程或者课程包不存在",
	"NOT_YOUR_CLASS": "不是该班级学生",
	"DONT_IN_CLASSROOM_NOW": "当前没有在上课",
	"CLASSROOM_FINISHED": "课堂已结束",
	"CLASS_NOT_EXIST": "班级失效",
	"ARGS_ERR": "参数错误",
	"SQL_ERR": "SQL不合法",
	"AUTH_ERR": "没有权限",
	"ID_ERR": "ID错误",
	"NOT_FOUND": "资源找不到",
	"ALREADY_DISMISS": "已经下课",
	"DB_ERR": "数据库发生错误",
	"MEMBER_NOT_EXISTS": "班级成员不存在",
	"ORGANIZATION_NOT_FOUND": "机构不存在",
	"INVALID_ACTIVATE_CODE": "无效激活码",
	"ACTIVATE_CODE_NOT_MATCH_ORGAN": "激活码不属于这个机构",
	"CLASS_IS_FINISH": "班级已经结束",
	"INVALID_ORGAN": "无效机构",
	"ALREADY_IN_CLASS": "已经是该班级学生",
	"MEMBERS_UPPER_LIMIT": "人数已达上限",
};
