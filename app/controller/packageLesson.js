'use strict';

const Controller = require('./baseController.js');

class PackageLessonsController extends Controller {
    get modelName() {
        return 'PackageLesson';
    }
}

module.exports = PackageLessonsController;
