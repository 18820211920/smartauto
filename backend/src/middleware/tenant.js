// 租户隔离中间件 - 所有请求强制注入 tenant_id/project_id 过滤
const setTenantFilter = (req, res, next) => {
  req.filter = {
    tenant_id: req.user?.tenantId || null,
    project_id: req.body?.project_id || req.query?.project_id || null,
    is_deleted: 0
  };
  next();
};

// 数据权限过滤
const setDataScope = async (req, res, next) => {
  if (!req.user?.userId || !req.user?.roleId) {
    req.dataScopeFilter = {};
    return next();
  }
  const roleService = require('../service/sys_role.service');
  const ds = await roleService.getDataScope(req.user.roleId);
  if (ds.all) {
    req.dataScopeFilter = {};
  } else if (ds.self) {
    req.dataScopeFilter = { created_by: req.user.userId };
  } else {
    req.dataScopeFilter = {};
  }
  next();
};

module.exports = { setTenantFilter, setDataScope };