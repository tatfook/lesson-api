'use strict';

const _ = require('lodash');
module.exports = {
    getParams() {
        return _.merge({}, this.request.body, this.query, this.params);
    },
};
