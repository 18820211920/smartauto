// JWT认证中间件
const jwt = require('jsonwebtoken');
const config = require('../config');
const { Result } = require('../util/response');

// 验证Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json(Result.fail('未提供认证令牌', 401));
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.json(Result.fail('令牌无效或已过期', 401));
  }
};

// 验证租户状态
const verifyTenant = async (req, res, next) => {
  if (!req.user?.tenantId) {
    return res.json(Result.fail('租户信息缺失', 403));
  }
  const tenantService = require('../service/sys_tenant.service');
  const tenant = await tenantService.getTenantById(req.user.tenantId);
  if (!tenant) return res.json(Result.fail('租户不存在', 403));
  if (tenant.status === 1) return res.json(Result.fail('租户已冻结', 403));
  if (new Date(tenant.package_expire) < new Date()) return res.json(Result.fail('套餐已到期', 403));
  req.tenant = tenant;
  next();
};

// 验证套餐配额
const verifyQuota = (resource, limitField) => {
  return async (req, res, next) => {
    const { BaseDao } = require('../dao/base.dao');
    const baseDao = new BaseDao();
    const count = await baseDao.count(resource, { tenant_id: req.user.tenantId });
    const limit = req.tenant[limitField] || 0;
    if (count >= limit) {
      return res.json(Result.fail('已达配额上限，请升级套餐', 403));
    }
    next();
  };
};

module.exports = { verifyToken, verifyTenant, verifyQuota };