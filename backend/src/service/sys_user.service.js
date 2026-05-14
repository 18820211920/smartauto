const userDao = require('../dao/sys_user.dao');
const userRoleDao = require('../dao/sys_user_role.dao');
const tenantDao = require('../dao/sys_tenant.dao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

class SysUserService {
  async getUserById(id, tenantId) { return userDao.findById(id, tenantId); }
  async getUserByUsername(username) { return userDao.findByUsername(username); }
  async listUsers(tenantId, filters = {}) { return userDao.findByTenant(tenantId, filters); }
  async countUsers(tenantId) { return userDao.count('sys_user', { tenant_id: tenantId }); }
  async getUserRoles(userId) { return userRoleDao.findByUserAndTenant(userId, null); }

  async createUser(tenantId, data) {
    const existing = await userDao.findByUsername(data.username);
    if (existing) return { success: false, message: '用户名已存在' };

    const pwdHash = await bcrypt.hash(data.password || 'SmartAuto@123', 10);
    const id = await userDao.insert('sys_user', {
      tenant_id: tenantId, username: data.username, password_hash: pwdHash,
      real_name: data.realName || data.username, phone: data.phone || '',
      email: data.email || '', dept_id: data.deptId || null,
      status: 0, pwd_expire_at: new Date(Date.now() + 90 * 86400000),
      failed_login_count: 0, login_count: 0,
      created_at: new Date(), is_deleted: 0
    });

    if (data.roleIds?.length) {
      for (const roleId of data.roleIds) {
        await userRoleDao.addRole(id, roleId, tenantId, data.projectId || null);
      }
    }
    return { success: true, id };
  }

  async login(username, password, ip) {
    const user = await userDao.findByUsername(username);
    if (!user) return { success: false, message: '用户名或密码错误' };

    const tenant = await tenantDao.findById(user.tenant_id);
    if (!tenant) return { success: false, message: '租户不存在' };
    if (tenant.status === 1) return { success: false, message: '账号已冻结，请联系客服' };
    if (tenant.package_expire && new Date(tenant.package_expire) < new Date()) return { success: false, message: '套餐已到期' };

    if (user.lock_expire_at && new Date(user.lock_expire_at) > new Date()) {
      const remain = Math.ceil((new Date(user.lock_expire_at) - new Date()) / 60000);
      return { success: false, message: `账号已锁定，${remain}分钟后重试` };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await userDao.incrementFailCount(user.id);
      if (user.failed_login_count + 1 >= config.saas.maxLoginFail) {
        return { success: false, message: `连续失败${config.saas.maxLoginFail}次，账号已锁定30分钟` };
      }
      return { success: false, message: `用户名或密码错误（剩余${config.saas.maxLoginFail - user.failed_login_count - 1}次）` };
    }

    await userDao.updateLoginInfo(user.id, ip, user.login_count || 0);

    const token = jwt.sign(
      { userId: user.id, username: user.username, tenantId: user.tenant_id, realName: user.real_name },
      config.jwt.secret, { expiresIn: config.jwt.expire }
    );

    return { success: true, token, user: { id: user.id, username: user.username, realName: user.real_name } };
  }

  async changePassword(userId, tenantId, oldPwd, newPwd) {
    const user = await userDao.findById(userId, tenantId);
    if (!user) return { success: false, message: '用户不存在' };
    const valid = await bcrypt.compare(oldPwd, user.password_hash);
    if (!valid) return { success: false, message: '原密码错误' };
    const hash = await bcrypt.hash(newPwd, 10);
    await userDao.update('sys_user', { password_hash: hash, updated_at: new Date() }, { id: userId });
    return { success: true };
  }

  async freezeUser(userId, tenantId) {
    await userDao.update('sys_user', { status: 1, updated_at: new Date() }, { id: userId, tenant_id: tenantId });
    return { success: true };
  }
}

module.exports = new SysUserService();