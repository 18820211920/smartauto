const tenantService = require('../service/sys_tenant.service');
const { Result } = require('../util/response');

const controller = {
  async getInfo(req, res) {
    const tenant = await tenantService.getTenantById(req.user.tenantId);
    res.json(Result.success(tenant));
  },
  async update(req, res) {
    const result = await tenantService.updateTenant(req.user.tenantId, req.body);
    res.json(result.success ? Result.success() : Result.fail(result.message));
  },
  async list(req, res) {
    const tenants = await tenantService.listTenants(req.query);
    res.json(Result.success(tenants));
  },
  async create(req, res) {
    const result = await tenantService.createTenant(req.body);
    res.json(result.success ? Result.success({ id: result.id }) : Result.fail(result.message));
  },
  async freeze(req, res) {
    const { id, action } = req.body;
    const result = action === 'unfreeze'
      ? await tenantService.unfreezeTenant(id)
      : await tenantService.freezeTenant(id);
    res.json(result.success ? Result.success() : Result.fail(result.message));
  }
};

module.exports = controller;