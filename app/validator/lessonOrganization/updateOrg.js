
'use strict';

module.exports = {
    type: 'object',
    properties: {
	  id: {
            type: 'number',
	  },
	  name: {
            type: 'string',
	  },
	  logo: {
            type: 'null',
	  },
	  email: {
            type: 'null',
	  },
	  cellphone: {
            type: 'null',
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
	  location: {
            type: 'string',
	  },
	  visibility: {
            type: 'number',
	  },
	  type: {
            type: 'number',
            description: '1.试用 2.正式',
            minimum: 1,
            maximum: 2,
	  },
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
	  packages: {
            type: 'array',
            items: {
		  type: 'string',
            },
	  },
    },
    required: [
	  'visibility',
	  'startDate',
	  'endDate',
	  'id',
	  'name',
	  'loginUrl',
	  'activateCodeLimit',
	  'usernames',
	  'type',
    ],
};
