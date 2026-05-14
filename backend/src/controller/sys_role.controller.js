const roleService = require('../service/sys_role.service');
const { Result } = require('../util/response');

const controller = {
  async list(req, res) {
    const roles = await roleService.listRoles(req.user.tenantId);
    res.json(Result.success(roles));
  },
  async permissions(req, res) {
    const perms = await roleService.getRolePermissions(req.params.roleId);
    res.json(Result.success(perms));
  },
  async dataScope(req, res) {
    const ds = await roleService.getDataScope(req.params.roleId);
    res.json(Result.success(ds));
  }
};

module.exports = controller;