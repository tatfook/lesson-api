'use strict';

const _ = require('lodash');
const Service = require('../common/service.js');

class Organization extends Service {
    async getRoleId(organizationId, userId) {
        const members = await this.app.model.LessonOrganizationClassMember.findAll(
            {
                where: { organizationId, memberId: userId },
            }
        ).then(list => list.map(o => o.toJSON()));

        let roleId = 0;
        _.each(members, o => {
            roleId = roleId | o.roleId;
        });

        return roleId;
    }
}

module.exports = Organization;
