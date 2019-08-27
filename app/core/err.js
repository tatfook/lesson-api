
const errs = {};
class Err {
	constructor(code, message, data) {
		this.code = code;
		this.message = message;
		this.data = data;

		errs[code] = this;
	}

	static getByCode(code) {
		return errs[code];
	}
}

new Err(-1, "未知错误");
new Err(0, "服务器繁忙,请稍后重试...");
new Err(1, "课堂不存在");
new Err(2, "课堂人数已满");

module.exports = Err;
