const { BaseDao } = require('./base.dao');

class SysUserRoleDao extends BaseDao {
  async findByUserId(userId) {
    return this.query(
      'SELECT ur.*,r.role_name,r.role_code FROM sys_user_role ur LEFT JOIN sys_role r ON ur.role_id=r.id WHERE ur.user_id=? AND ur.is_deleted=0',
      [userId]
    );
  }
  async findByUserAndTenant(userId, tenantId) {
    return this.query(
      'SELECT ur.*,r.role_name,r.role_code FROM sys_user_role ur LEFT JOIN sys_role r ON ur.role_id=r.id WHERE ur.user_id=? AND ur.tenant_id=? AND ur.is_deleted=0',
      [userId, tenantId]
    );
  }
  async addRole(userId, roleId, tenantId, projectId = null) {
    return this.insert('sys_user_role', {
      user_id: userId, role_id: roleId, tenant_id: tenantId,
      project_id: projectId, created_at: new Date(), is_deleted: 0
    });
  }
  async removeUserRoles(userId) {
    return this.update('sys_user_role', { is_deleted: 1 }, { user_id: userId });
  }
}

module.exports = new SysUserRoleDao();