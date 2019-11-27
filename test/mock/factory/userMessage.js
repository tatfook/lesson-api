module.exports = app => {
    const { factory } = app;
    const tableName = 'UserMessage';

    factory.define(tableName, app.model[tableName], {
        userId: factory.chance('integer', {
            min: 1,
        }),
        msgId: factory.assoc('Message', 'id'),
        status: factory.chance('integer', {
            min: 0,
            max: 1,
        }),
    });
};
