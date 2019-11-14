'use strict';

const email = require('./app/common/email.js');
const api = require('./app/common/api.js');

module.exports = async app => {
    email(app);
    api(app);
};
