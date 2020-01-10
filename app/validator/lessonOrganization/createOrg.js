'use strict';

module.exports = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
        logo: {
            type: 'string',
        },
        email: {
            type: 'string',
        },
        cellphone: {
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
            required: [ 'type5', 'type6', 'type7' ],
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
                type: 'object',
                properties: {
                    packageId: {
                        type: 'number',
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
                        },
                    },
                },
            },
        },
    },
    required: [
        'visibility',
        'startDate',
        'endDate',
        'name',
        'loginUrl',
        'activateCodeLimit',
        'usernames',
        'type',
    ],
};
