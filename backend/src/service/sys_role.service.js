const roleDao = require('../dao/sys_role.dao');

class SysRoleService {
  async getRoleById(id) { return roleDao.findById(id); }
  async listRoles(tenantId) { return roleDao.findByTenant(tenantId); }
  async listSystemRoles() { return roleDao.findSystemRoles(); }

  async getDataScope(roleId) {
    const role = await roleDao.findById(roleId);
    if (!role) return { all: true };
    return { all: role.data_scope === 1, self: role.data_scope === 3, deptId: role.dept_id };
  }

  async getRolePermissions(roleId) { return roleDao.getRolePermissions(roleId); }
}

module.exports = new SysRoleService();