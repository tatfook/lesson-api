const { app, mock, assert } = require('egg-mock/bootstrap');
const _ = require('lodash');
const fs = require('fs');
const Chance = require('chance');
const loader = require('./setup/loader.js');

before(async () => {
    loader(app);
    app.chance = new Chance();
    await truncateAllTables();
});

async function readModelDir() {
    return new Promise(resolve => {
        fs.readdir('./app/model', (err, files) => {
            if (err) {
                return resolve([]);
            }
            return resolve(files);
        });
    });
}

async function truncateAllTables() {
    const files = await readModelDir();
    const ModelName = files.map(r => {
        return r.charAt(0).toUpperCase() + r.substring(1, r.length - 3)
    });

    const opts = { restartIdentity: true, cascade: true };
    const list = [];
    _.each(ModelName, m => {
        return list.push(app.model[m] && app.model[m].truncate(opts))
    });
    await Promise.all(list);
}

afterEach(async () => {
    await truncateAllTables();
});
