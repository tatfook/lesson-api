'use strict';

module.exports = {
    type: 'object',
    properties: {
        activateCodeLimit: {
            type: 'object',
            properties: {
			  	type5: {
                    type: 'number',
			  	},
			  	type6: {
                    type: 'number',
			  	},
			  	type7: {
                    type: 'number',
			  	},
            },
            required: [
			  'type5',
			  'type6',
			  'type7',
            ],
        },
		  usernames: {
            type: 'array',
            items: {
			  type: 'string',
            },
		  },
		  name: {
            type: 'string',
		  },
		  loginUrl: {
            type: 'string',
		  },
		  startDate: {
            type: 'string',
		  },
		  endDate: {
            type: 'string',
		  },
		  visibility: {
            type: 'number',
		  },
		  privilege: {
            type: 'number',
		  },
		  type: {
            type: 'string',
            description: '1.试用  2.正式',
		  },
    },
    required: [
        'type',
        'startDate',
        'endDate',
        'loginUrl',
        'name',
        'usernames',
        'activateCodeLimit',
        'visibility',
    ],
};
