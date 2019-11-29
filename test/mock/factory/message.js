module.exports = app => {
    const { factory } = app;
    const tableName = 'Message';

    factory.define(tableName, app.model[tableName], {
        sender: factory.chance('integer', {
            min: -1,
        }),
        sendSms: factory.chance('integer', {
            min: 0,
            max: 1,
        }),
        organizationId: factory.assoc('LessonOrganization', 'id'),
        type: factory.chance('integer', {
            min: 0,
            max: 1,
        }),
        realname: factory.chance('integer', {
            min: 13000000000,
            max: 20000000000,
        }),
        sendClassIds: [
            factory.chance('integer', {
                min: 13000000000,
                max: 20000000000,
            }),
        ],
        msg: {
            type: factory.chance('integer', {
                min: 0,
                max: 2,
            }),
            text: factory.chance('string', {
                length: 8,
            }),
        },
        createdAt: new Date(),
    });
};
