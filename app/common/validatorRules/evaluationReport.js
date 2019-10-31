
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

const cellphone = {
	isReg: {
		errmsg: Err.CELLPHONE_ERR,
		param: /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-7|9])|(?:5[0-3|5-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1|8|9]))\d{8}$/
	}
};

const verifCode = {
	isLength: {
		errmsg: Err.VERIFCODE_ERR,
		param: { min: 6, max: 6 }
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

const updateReport = {
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
	},
	classId: {
		isInt: {
			errmsg: Err.CLASSID_ERR,
			param: { min: 1 }
		}
	},
	type: {
		isInt: {
			errmsg: Err.REPORT_TYPE_ERR,
			param: { min: 1, max: 2 }
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
	cellphone
};

const verifyCode = {
	cellphone,
	verifCode
};


const updateUserInfo = {
	portrait: {
		isReg: {
			errmsg: Err.PORTRAIT_ERR,
			param: /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/
		}
	},
	realname: {
		isLength: {
			errmsg: Err.REALNAME_ERR,
			param: { min: 1, max: 255 }
		}
	}
};

const updateParentNum = {
	parentPhoneNum: cellphone,
	verifCode
};

// 修改家长手机号第二步
const updateParentNum2 = {
	parentPhoneNum: cellphone,
	verifCode,
	newParentPhoneNum: cellphone,
	newVerifCode: verifCode
};

const evaluationStatistics = {
	classId: {
		isInt: {
			errmsg: Err.CLASSID_ERR,
			param: { min: 1 }
		}
	}
};

const reportToParent = {
	baseUrl: {
		isURL: {
			errmsg: Err.BASEURL_ERR,
			param: { protocols: ["http", "https"] }
		}
	},
	realname: {
		isLength: {
			errmsg: Err.REALNAME_ERR,
			param: { min: 1, max: 255 }
		}
	},
	orgName: {
		isLength: {
			errmsg: Err.ORGNAME_LEN_ERR,
			param: { min: 1, max: 255 }
		}
	},
	star,
	parentPhoneNum: cellphone
};

const adminGetReport = {
	days: {
		isInt: {
			errmsg: Err.ARGS_ERR,
			param: { min: 1 }
		}
	}
};


module.exports = {
	createReport, updateReport, reportList, createUserReport, reportDetailList, userReportDetail,
	updateUserReport, sendSms, verifyCode, updateUserInfo, updateParentNum, updateParentNum2,
	evaluationStatistics, reportToParent, adminGetReport
};