const Roles = require("../config/roles.json");

class rbacPolicyDecisionPoint {
  constructor(){
    this.permissions = [];
  }

  getPermissionsByRoleName(roleName) {
    const role = Roles.roles.find((role) => role.name === roleName);
    return role ? role.permissions : [];
  }
}

module.exports = rbacPolicyDecisionPoint;