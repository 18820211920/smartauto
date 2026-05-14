const { BaseDao } = require('./base.dao');

class SysMenuDao extends BaseDao {
  async findAll() {
    return this.query('SELECT * FROM sys_menu WHERE is_deleted=0 ORDER BY sort_order ASC');
  }
  async findByUserId(userId) {
    return this.query(
      'SELECT DISTINCT m.* FROM sys_menu m INNER JOIN sys_role_permission rp ON m.id=rp.permission_id INNER JOIN sys_user_role ur ON rp.role_id=ur.role_id WHERE ur.user_id=? AND m.is_deleted=0 AND m.visible=0 ORDER BY m.sort_order ASC',
      [userId]
    );
  }
}

module.exports = new SysMenuDao();