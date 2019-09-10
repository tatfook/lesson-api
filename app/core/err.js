
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
	}
};
