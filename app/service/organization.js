
const _ = require("lodash");
const Service = require("../core/service.js");

class Organization extends Service {

	async getRoleId(organizationId, userId) {
		const members = await this.app.model.lessonOrganizationClassMembers.findAll({
			where: { organizationId, memberId: userId }
		}).then(list => list.map(o => o.toJSON()));

		let roleId = 0;
		_.each(members, o => { roleId = roleId | o.roleId; });

		return roleId;
	}

	async isMember({ organizationId, memberId }) {
		const member = await this.app.model.lessonOrganizationClassMembers.findAll({
			include: [
				{
					as: "lessonOrganizationClasses",
					model: this.app.model.lessonOrganizationClasses,
					where: {
						end: {
							"$gt": new Date(),
						}
					}
				},
			],
			where: {
				organizationId,
				memberId,
			}
		});

		return member.length;
	}
}

module.exports = Organization;
