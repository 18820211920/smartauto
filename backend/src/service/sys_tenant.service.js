const tenantDao = require('../dao/sys_tenant.dao');
const packageDao = require('../dao/sys_package.dao');
const userDao = require('../dao/sys_user.dao');

class SysTenantService {
  async getTenantById(id) { return tenantDao.findById(id); }
  async getTenantByCode(code) { return tenantDao.findByCode(code); }
  async listTenants(filters = {}) { return tenantDao.findAll(filters); }
  async countTenants() { return tenantDao.count(); }

  async createTenant(data) {
    const existing = await tenantDao.findByCode(data.tenantCode);
    if (existing) return { success: false, message: '租户编码已存在' };
    if (!data.packageId) data.packageId = 1;
    const pkg = await packageDao.findById(data.packageId);
    if (!pkg) return { success: false, message: '套餐不存在' };

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (pkg.package_type === 1 ? 30 : 365));

    const id = await tenantDao.insert('sys_tenant', {
      tenant_code: data.tenantCode, tenant_name: data.tenantName,
      contact_name: data.contactName || '', contact_phone: data.contactPhone || '',
      contact_email: data.contactEmail || '', package_id: data.packageId,
      package_start: new Date(), package_expire: expireDate,
      max_users: pkg.max_users, max_projects: pkg.max_projects,
      status: 0, created_at: new Date(), is_deleted: 0
    });
    return { success: true, id };
  }

  async updateTenant(id, data) {
    data.updated_at = new Date();
    delete data.tenant_code; delete data.id; delete data.package_id;
    await tenantDao.update('sys_tenant', data, { id });
    return { success: true };
  }

  async freezeTenant(id) {
    await tenantDao.updateStatus(id, 1);
    return { success: true };
  }

  async unfreezeTenant(id) {
    await tenantDao.updateStatus(id, 0);
    return { success: true };
  }

  async freezeExpired() {
    await tenantDao.freezeExpired();
  }
}

module.exports = new SysTenantService();