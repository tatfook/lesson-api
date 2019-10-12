
const Err = require("../err");

const classId = {
	isInt: {
		errmsg: Err.CLASSID_ERR,
		param: { min: 1 }
	}
};

const star = {
	isInt: {
		errmsg: Err.STAR_ERR,
		param: { min: 1, max: 5 }
	}
};

const createReport = {
	name: {
		isLength: {
			errmsg: Err.REPORT_NAME_ERR,
			param: { min: 1, max: 64 }
		}
	},
	type: {
		isInt: {
			errmsg: Err.REPORT_TYPE_ERR,
			param: { min: 1, max: 2 }
		}
	},
	classId
};

const reportList = {
	classId
};

const createUserReport = {
	studentId: {
		isInt: {
			errmsg: Err.USERID_ERR,
			param: { min: 1 }
		}
	},
	reportId: {
		isInt: {
			errmsg: Err.REPORT_ID_ERR,
			param: { min: 1 }
		}
	},
	star,
	spatial: star,
	collaborative: star,
	creative: star,
	logical: star,
	compute: star,
	coordinate: star,
	comment: {
		isLength: {
			errmsg: Err.COMMENT_LEN_ERR,
			param: { min: 1, max: 256 }
		}
	},
	mediaUrl: {
		isArray: {
			errmsg: Err.MEDIAURL_ERR
		}
	}
};

const reportDetailList = {
	status: {
		isInt: {
			errmsg: Err.COMMENT_STATUS_ERR,
			param: { min: 1, max: 2 }
		}
	}
};

const userReportDetail = {
	studentId: {
		isInt: {
			errmsg: Err.USERID_ERR,
			param: { min: 1 }
		}
	}
};

const updateUserReport = {
	userReportId: {
		isInt: {
			errmsg: Err.REPORT_ID_ERR,
			param: { min: 1 }
		}
	},
	star,
	spatial: star,
	collaborative: star,
	creative: star,
	logical: star,
	compute: star,
	coordinate: star,
	comment: {
		isLength: {
			errmsg: Err.COMMENT_LEN_ERR,
			param: { min: 1, max: 256 }
		}
	},
	mediaUrl: {
		isArray: {
			errmsg: Err.MEDIAURL_ERR
		}
	}
};

const sendSms = {
	cellphone: {
		isReg: {
			errmsg: Err.CELLPHONE_ERR,
			param: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-7|9])|(?:5[0-3|5-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1|8|9]))\d{8}$/
		}
	}
};

const verifyCode = {
	cellphone: {
		isReg: {
			errmsg: Err.CELLPHONE_ERR,
			param: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-7|9])|(?:5[0-3|5-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1|8|9]))\d{8}$/
		}
	},
	verifCode: {
		isLength: {
			errmsg: Err.VERIFCODE_ERR,
			param: { min: 6, max: 6 }
		}
	}
};

module.exports = {
	createReport, reportList, createUserReport, reportDetailList, userReportDetail,
	updateUserReport, sendSms, verifyCode
};