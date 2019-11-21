'use strict';

const Err = require('../err');

const createMsg = {
    sendSms: {
        isInt: {
            errmsg: Err.ARGS_ERR,
            param: { min: 0, max: 1 },
        },
    },
};

module.exports = {
    createMsg,
};
