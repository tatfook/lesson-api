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
		  packages: {
            type: 'array',
            items: {
			  type: 'object',
			  properties: {
                    packageId: {
				  type: 'number',
				  minimum: 1,
                    },
                    lessons: {
				  type: 'array',
				  items: {
                            type: 'object',
                            properties: {
					  lessonId: {
                                    type: 'number',
                                    minimum: 1,
					  },
					  lessonNo: {
                                    type: 'number',
                                    minimum: 1,
					  },
                            },
                            required: [
					  'lessonId',
					  'lessonNo',
                            ],
				  },
                    },
			  },
			  required: [
                    'packageId',
                    'lessons',
			  ],
            },
		  },
    },
    required: [
		  'organizationIds',
		  'packages',
    ],
};
