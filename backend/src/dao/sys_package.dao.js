const { BaseDao } = require('./base.dao');

class SysPackageDao extends BaseDao {
  async findById(id) {
    return this.queryOne('SELECT * FROM sys_package WHERE id=? AND is_deleted=0', [id]);
  }
  async findByCode(code) {
    return this.queryOne('SELECT * FROM sys_package WHERE package_code=? AND is_deleted=0', [code]);
  }
  async findAll() {
    return this.query('SELECT * FROM sys_package WHERE is_deleted=0 ORDER BY sort_order ASC');
  }
  async findEnabled() {
    return this.query('SELECT * FROM sys_package WHERE status=0 AND is_deleted=0 ORDER BY sort_order ASC');
  }
}

module.exports = new SysPackageDao();