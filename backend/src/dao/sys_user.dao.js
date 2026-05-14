const { BaseDao } = require('./base.dao');

class SysUserDao extends BaseDao {
  async findById(id, tenantId) {
    return this.queryOne('SELECT * FROM sys_user WHERE id=? AND tenant_id=? AND is_deleted=0', [id, tenantId]);
  }
  async findByUsername(username) {
    return this.queryOne('SELECT * FROM sys_user WHERE username=? AND is_deleted=0', [username]);
  }
  async findByPhone(phone, tenantId) {
    return this.queryOne('SELECT * FROM sys_user WHERE phone=? AND tenant_id=? AND is_deleted=0', [phone, tenantId]);
  }
  async findByTenant(tenantId, filters = {}) {
    let sql = 'SELECT id,username,real_name,phone,email,dept_id,status,last_login_at,created_at FROM sys_user WHERE tenant_id=? AND is_deleted=0';
    const params = [tenantId];
    if (filters.status !== undefined) { sql += ' AND status=?'; params.push(filters.status); }
    sql += ' ORDER BY created_at DESC';
    return this.query(sql, params);
  }
  async updateLoginInfo(id, ip, count) {
    return this.update('sys_user', {
      last_login_at: new Date(), last_login_ip: ip,
      login_count: count + 1, failed_login_count: 0, updated_at: new Date()
    }, { id });
  }
  async incrementFailCount(id) {
    return this.update('sys_user', {
      failed_login_count: 1,
      lock_expire_at: new Date(Date.now() + 30 * 60 * 1000),
      updated_at: new Date()
    }, { id });
  }
  async resetFailCount(id) {
    return this.update('sys_user', { failed_login_count: 0, updated_at: new Date() }, { id });
  }
}

module.exports = new SysUserDao();