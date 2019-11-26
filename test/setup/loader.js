const md5 = require('blueimp-md5');
const loadFactory = require('./factory.js');
const helper = require('../../app/extend/helper');

module.exports = app => {
    app.mock = app.mock || {};

    app.login = async (user = {}) => {
        // 伪造token
        user.username = user.username || 'user0001';
        user.password = md5('123456');
        user.id = user.id || 1;
        user.roleId = user.roleId || 1;
        user.organizationId = user.organizationId || 1;

        const token = helper.jwtEncode(
            {
                userId: user.id,
                roleId: user.roleId,
                username: user.username,
                organizationId: user.organizationId,
            },
            app.config.self.secret,
            3600 * 24 * 2
        );
        return { token };
    };

    app.adminLogin = async (user = {}) => {
        // 伪造 admin token
        user.username = user.username || 'user0001';
        user.password = md5('123456');
        user.id = user.id || 1;
        user.roleId = user.roleId || 64;
        user.organizationId = user.organizationId || 1;

        const token = helper.jwtEncode(
            {
                userId: user.id,
                roleId: user.roleId,
                username: user.username,
                organizationId: user.organizationId,
            },
            app.config.self.adminSecret,
            3600 * 24 * 2
        );
        return { token };
    };

    loadFactory(app);
};
