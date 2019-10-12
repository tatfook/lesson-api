
const validator = require("validator");

// 以下是拓展方法，可按需添加

validator.isChineseName = function (str) {
	const regex = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/;
	return regex.test(str + "");
};

validator.isChineseGBK = function (str) {
	const regex = /[\u4e00-\u9fa5]/;
	return regex.test(str + "");
};

validator.isArray = function (obj) {
	if (typeof obj === "object" && obj.constructor == Array) {
		return true;
	}
	return false;
};

validator.isTimestamp = function (str) {
	const regex = /^\d{13}$/; // ^\d{11}|\d{13}$
	return regex.test(str + "");
};

validator.isReg = function (str, reg) {
	return reg.test(str + "");
};

module.exports = validator;
