const { BaseDao } = require('./base.dao');

class SysPermissionDao extends BaseDao {
  async findAll() {
    return this.query('SELECT * FROM sys_permission WHERE is_deleted=0 ORDER BY sort_order ASC');
  }
  async findByModule(module) {
    return this.query('SELECT * FROM sys_permission WHERE module=? AND is_deleted=0', [module]);
  }
  async findById(id) {
    return this.queryOne('SELECT * FROM sys_permission WHERE id=? AND is_deleted=0', [id]);
  }
}

module.exports = new SysPermissionDao();