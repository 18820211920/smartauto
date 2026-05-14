const packageDao = require('../dao/sys_package.dao');

class SysPackageService {
  async getPackageById(id) { return packageDao.findById(id); }
  async listPackages() { return packageDao.findAll(); }
  async listEnabledPackages() { return packageDao.findEnabled(); }

  async createPackage(data) {
    const id = await packageDao.insert('sys_package', {
      package_code: data.packageCode, package_name: data.packageName,
      package_type: data.packageType || 2,
      price_monthly: data.priceMonthly || 0, price_yearly: data.priceYearly || 0,
      max_users: data.maxUsers || 5, max_projects: data.maxProjects || 2,
      features: JSON.stringify(data.features || {}),
      data_retention_days: data.dataRetentionDays || 365,
      support_level: data.supportLevel || '基础',
      sort_order: data.sortOrder || 0, status: 0,
      created_at: new Date(), is_deleted: 0
    });
    return { success: true, id };
  }
}

module.exports = new SysPackageService();