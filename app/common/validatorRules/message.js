'use strict';

const Err = require('../err');

const createMsg = {
    sendSms: {
        isInt: {
            errmsg: Err.ARGS_ERR,
            param: { min: 0, max: 1 },
        },
    },
    type: {
        isInt: {
            errmsg: Err.MSG_TYPE_ERR,
            param: { min: 3, max: 3 },
        },
    },
    text: {
        isLength: {
            errmsg: Err.MSG_TEXT_ERR,
            param: { min: 1, max: 512 },
        },
    },
};

module.exports = {
    createMsg,
};