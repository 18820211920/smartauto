const express = require('express');
const cors = require('cors');
const config = require('./config');
const { verifyToken, verifyTenant } = require('./middleware/auth');
const { setTenantFilter } = require('./middleware/tenant');

// 路由
const tenantRoutes = require('./modules/sys_tenant/routes');
const packageRoutes = require('./modules/sys_package/routes');
const userRoutes = require('./modules/sys_user/routes');
const roleRoutes = require('./modules/sys_role/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/tenant', tenantRoutes);
app.use('/api/package', packageRoutes);
app.use('/api/user', userRoutes);
app.use('/api/role', roleRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartauto-backend', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ code: -1, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: -1, message: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`SmartAuto Backend started on port ${config.port}`);
});

module.exports = app;