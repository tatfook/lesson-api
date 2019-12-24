'use strict';

module.exports = {
    type: 'object',
    properties: {
        ids: {
            type: 'array',
            items: {
                type: 'number',
                minimum: 1,
            },
            description: '激活码id',
        },
    },
};
