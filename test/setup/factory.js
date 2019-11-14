const path = require('path');

const { factory } = require('factory-girl');

module.exports = app => {
    app.factory = factory;
    app.loader.loadToApp(
        path.join(app.config.baseDir, 'test/mock/factory'),
        Symbol('_factory')
    );
};
