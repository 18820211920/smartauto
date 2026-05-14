// SmartAuto 配置文件
require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartauto',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'smartauto_jwt_secret',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  saas: {
    defaultPackageId: 1,
    maxLoginFail: 5,
    lockExpireMinutes: 30,
    pwdExpireDays: 90
  }
};