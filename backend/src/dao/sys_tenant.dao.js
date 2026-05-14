const { BaseDao } = require('./base.dao');

class SysTenantDao extends BaseDao {
  async findById(id) {
    return this.queryOne('SELECT * FROM sys_tenant WHERE id=? AND is_deleted=0', [id]);
  }
  async findByCode(code) {
    return this.queryOne('SELECT * FROM sys_tenant WHERE tenant_code=? AND is_deleted=0', [code]);
  }
  async findAll(filters = {}) {
    let sql = 'SELECT t.*,p.package_name FROM sys_tenant t LEFT JOIN sys_package p ON t.package_id=p.id WHERE t.is_deleted=0';
    const params = [];
    if (filters.status !== undefined) { sql += ' AND t.status=?'; params.push(filters.status); }
    sql += ' ORDER BY t.created_at DESC';
    return this.query(sql, params);
  }
  async updateStatus(id, status) {
    return this.update('sys_tenant', { status, updated_at: new Date() }, { id });
  }
  async freezeExpired() {
    return this.execute("UPDATE sys_tenant SET status=1,updated_at=NOW() WHERE package_expire < CURDATE() AND status=0 AND is_deleted=0");
  }
  async count() {
    return this.count('sys_tenant', { is_deleted: 0 });
  }
}

module.exports = new SysTenantDao();