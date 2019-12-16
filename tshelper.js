'use strict';
/**
 * run `npx ets` to generate d.ts files
 * https://www.npmjs.com/package/egg-ts-helper#generator
 */
module.exports = {
    watchDirs: {
        validator: {
            directory: 'app/validator', // files directory.
            generator: 'auto', // generator name, eg: class、auto、function、object
            interface: 'IValidator', // interface name
            declareTo: 'Application.validator', // declare to this interface
        },
    },
};
