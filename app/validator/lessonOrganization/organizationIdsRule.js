'use strict';

module.exports = {
	type: 'object',
	properties: {
		organizationIds: {
			type: 'array',
			items: {
				type: 'number',
				minimum: 1,
			},
		},
	},
};
