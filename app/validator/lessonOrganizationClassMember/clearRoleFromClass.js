'use strict';
const {
    CLASS_MEMBER_ROLE_STUDENT,
    CLASS_MEMBER_ROLE_TEACHER,
} = require('../../common/consts');
module.exports = {
    type: 'object',
    properties: {
        memberId: {
            type: 'number',
            minimum: 1,
        },
        _roleId: {
            type: 'number',
            enum: [ CLASS_MEMBER_ROLE_STUDENT, CLASS_MEMBER_ROLE_TEACHER ],
        },
        classId: {
            type: 'number',
            minimum: 1,
        },
    },
};
