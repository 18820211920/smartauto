const { BaseDao } = require('./base.dao');

class SysDeptDao extends BaseDao {
  async findByTenant(tenantId) {
    return this.query('SELECT * FROM sys_dept WHERE tenant_id=? AND is_deleted=0 ORDER BY sort_order ASC', [tenantId]);
  }
  async findById(id, tenantId) {
    return this.queryOne('SELECT * FROM sys_dept WHERE id=? AND tenant_id=? AND is_deleted=0', [id, tenantId]);
  }
}

module.exports = new SysDeptDao();