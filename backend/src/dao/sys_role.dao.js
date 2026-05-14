const { BaseDao } = require('./base.dao');

class SysRoleDao extends BaseDao {
  async findById(id) {
    return this.queryOne('SELECT * FROM sys_role WHERE id=? AND is_deleted=0', [id]);
  }
  async findByTenant(tenantId) {
    return this.query('SELECT * FROM sys_role WHERE (tenant_id IS NULL OR tenant_id=?) AND is_deleted=0 ORDER BY sort_order ASC', [tenantId]);
  }
  async findSystemRoles() {
    return this.query('SELECT * FROM sys_role WHERE role_type=1 AND is_deleted=0');
  }
  async getRolePermissions(roleId) {
    return this.query(
      'SELECT p.* FROM sys_permission p INNER JOIN sys_role_permission rp ON p.id=rp.permission_id WHERE rp.role_id=? AND p.is_deleted=0 AND rp.is_deleted=0',
      [roleId]
    );
  }
}

module.exports = new SysRoleDao();