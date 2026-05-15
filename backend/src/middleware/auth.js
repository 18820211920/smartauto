
const jwtUtil = require('./jwt');
const { fail } = require('../util/response');

// 验证Token
exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return fail(res, '未登录或Token已过期', 401);
  }
  
  const token = auth.replace('Bearer ', '');
  const payload = jwtUtil.verify(token);
  
  if (!payload) {
    return fail(res, 'Token无效或已过期', 401);
  }
  
  req.user = payload;
  next();
};

// 验证租户
exports.verifyTenant = (req, res, next) => {
  if (!req.user?.tenant_id) {
    return fail(res, '租户信息无效', 403);
  }
  req.tenant = { id: req.user.tenant_id };
  next();
};

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    // 如果不需要认证的接口，放行
    if (req.path === '/login' || req.path === '/health') {
      return next();
    }
    return fail(res, '未登录或Token已过期', 401);
  }
  
  const token = auth.replace('Bearer ', '');
  const payload = jwtUtil.verify(token);
  
  if (!payload) {
    return fail(res, 'Token无效或已过期', 401);
  }
  
  req.user = payload;
  req.tenant = { id: payload.tenant_id };
  next();
};
