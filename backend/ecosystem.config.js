module.exports = {
  apps: [{
    name: 'smartauto-api',
    script: './src/app.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3847,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USER: 'smartauto',
      DB_PASSWORD: 'SmartAuto@2024!',
      DB_NAME: 'smartauto',
      JWT_SECRET: 'smartauto-jwt-secret-2024-lg-auto',
      JWT_EXPIRE: '7d',
      CORS_ORIGIN: '*'
    }
  }]
};
