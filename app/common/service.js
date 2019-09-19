const _ = require("lodash");
const Service = require("egg").Service;

class BaseService extends Service {
	get model() {
		return this.app.model;
	}
}

module.exports = BaseService;
