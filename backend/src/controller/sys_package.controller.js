const packageService = require('../service/sys_package.service');
const { Result } = require('../util/response');

const controller = {
  async list(req, res) {
    const packages = await packageService.listEnabledPackages();
    res.json(Result.success(packages));
  },
  async all(req, res) {
    const packages = await packageService.listPackages();
    res.json(Result.success(packages));
  },
  async get(req, res) {
    const pkg = await packageService.getPackageById(req.params.id);
    res.json(pkg ? Result.success(pkg) : Result.fail('套餐不存在'));
  },
  async create(req, res) {
    const result = await packageService.createPackage(req.body);
    res.json(result.success ? Result.success({ id: result.id }) : Result.fail(result.message));
  }
};

module.exports = controller;