const userService = require('../service/sys_user.service');
const { Result } = require('../util/response');

const controller = {
  async login(req, res) {
    const { username, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const result = await userService.login(username, password, ip);
    if (result.success) {
      res.json(Result.success(result, '登录成功'));
    } else {
      res.json(Result.fail(result.message));
    }
  },
  async list(req, res) {
    const users = await userService.listUsers(req.user.tenantId, req.query);
    res.json(Result.success(users));
  },
  async count(req, res) {
    const total = await userService.countUsers(req.user.tenantId);
    res.json(Result.success({ total, limit: req.tenant.max_users }));
  },
  async create(req, res) {
    const result = await userService.createUser(req.user.tenantId, req.body);
    res.json(result.success ? Result.success({ id: result.id }) : Result.fail(result.message));
  },
  async getInfo(req, res) {
    const user = await userService.getUserById(req.user.userId, req.user.tenantId);
    if (!user) return res.json(Result.fail('用户不存在'));
    const { password_hash, ...safeUser } = user;
    res.json(Result.success(safeUser));
  },
  async changePwd(req, res) {
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.userId, req.user.tenantId, oldPassword, newPassword);
    res.json(result.success ? Result.success() : Result.fail(result.message));
  },
  async freeze(req, res) {
    const result = await userService.freezeUser(req.params.id, req.user.tenantId);
    res.json(result.success ? Result.success() : Result.fail('操作失败'));
  }
};

module.exports = controller;