const { BaseDao } = require('./base.dao');

class SysTenantProjectDao extends BaseDao {
  async findByTenant(tenantId) {
    return this.query('SELECT * FROM sys_tenant_project WHERE tenant_id=? AND is_deleted=0 ORDER BY created_at DESC', [tenantId]);
  }
  async findById(id, tenantId) {
    return this.queryOne('SELECT * FROM sys_tenant_project WHERE id=? AND tenant_id=? AND is_deleted=0', [id, tenantId]);
  }
  async countByTenant(tenantId) {
    return this.count('sys_tenant_project', { tenant_id: tenantId });
  }
}

module.exports = new SysTenantProjectDao();