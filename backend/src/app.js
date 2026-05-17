const express = require('express');
const cors = require('cors');
require('dotenv').config();

const config = {
  port: process.env.PORT || 3847,
  jwt: {
    secret: process.env.JWT_SECRET || 'smartauto-jwt-secret-2024-lg-auto',
    expire: process.env.JWT_EXPIRE || '7d'
  }
};

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接池
let pool = null;
const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: 'localhost',
      user: 'smartauto',
      password: 'SmartAuto@2024!',
      database: 'smartauto',
      socketPath: '/var/run/mysqld/mysqld.sock',
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
};

// ============== 修复3: 到期二次检查中间件 ==============
const checkTenantActive = async (tenant_id) => {
  const p = getPool();
  const [rows] = await p.query(
    'SELECT status, package_expire FROM sys_tenant WHERE id = ? AND is_deleted = 0',
    [tenant_id]
  );
  if (rows.length > 0) {
    const t = rows[0];
    if (t.status === 2) return { ok: false, msg: '租户已被禁用，请联系管理员' };
    if (t.package_expire && new Date(t.package_expire) < new Date()) {
      return { ok: false, msg: '套餐已到期，请续费后使用' };
    }
  }
  return { ok: true };
};

// ============== 修复4: 权限中间件 ==============
const checkRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role_id || 1;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ code: 403, message: '权限不足，需要角色: ' + roles.join('/') });
    }
    next();
  };
};

const checkPermission = (...perms) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const p = getPool();
      // 查用户所有权限（含角色继承）
      const [perms1] = await p.query(
        'SELECT DISTINCT p.permission_code FROM sys_user_role ur JOIN sys_role_permission rp ON ur.role_id=rp.role_id JOIN sys_permission p ON rp.permission_id=p.id WHERE ur.user_id=? AND ur.is_deleted=0',
        [userId]
      );
      const [perms2] = await p.query(
        'SELECT DISTINCT permission_code FROM sys_user_permission WHERE user_id=? AND is_deleted=0',
        [userId]
      );
      const userPerms = new Set([...perms1.map(r=>r.permission_code), ...perms2.map(r=>r.permission_code)]);
      const has = perms.every(p => userPerms.has(p));
      if (!has) {
        return res.status(403).json({ code: 403, message: '权限不足，需要: ' + perms.join('/') });
      }
      next();
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  };
};

// JWT验证中间件（修复3: 加租户到期二次检查）
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), config.jwt.secret);
    req.user = payload;
    // 修复3: 即使token有效，也二次检查租户是否到期
    checkTenantActive(payload.tenant_id).then(result => {
      if (!result.ok) {
        return res.status(403).json({ code: 403, message: result.msg });
      }
      next();
    }).catch(e => {
      return res.status(500).json({ code: 500, message: '租户检查失败' });
    });
  } catch (e) {
    return res.status(401).json({ code: 401, message: 'Token无效' });
  }
};

// ============ 登录接口（修复3: 加租户到期拦截） ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    
    const p = getPool();
    const [rows] = await p.query(
      'SELECT id, tenant_id, username, password_hash, real_name FROM sys_user WHERE username = ? AND is_deleted = 0',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    
    // 修复3: 登录时检查租户到期
    const tenantCheck = await checkTenantActive(user.tenant_id);
    if (!tenantCheck.ok) {
      return res.status(403).json({ code: 403, message: tenantCheck.msg });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, tenant_id: user.tenant_id, role_id: user.role_id || 1 },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );
    
    res.json({ code: 0, message: '登录成功', data: { token: token, user: { id: user.id, username: user.username, real_name: user.real_name, tenant_id: user.tenant_id } } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 修复2: 注册接口（带用户配额检查） ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, tenant_code, contact_name, contact_phone, contact_email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    if (!tenant_code) {
      return res.status(400).json({ code: 400, message: '租户编码不能为空' });
    }

    const p = getPool();

    // 查找租户
    const [tenants] = await p.query(
      'SELECT id, max_users, max_projects, package_expire, status FROM sys_tenant WHERE tenant_code = ? AND is_deleted = 0',
      [tenant_code]
    );
    if (tenants.length === 0) {
      return res.status(400).json({ code: 400, message: '租户不存在，请联系管理员开通' });
    }
    const tenant = tenants[0];

    // 检查租户状态
    const tenantCheck = await checkTenantActive(tenant.id);
    if (!tenantCheck.ok) {
      return res.status(403).json({ code: 403, message: tenantCheck.msg });
    }

    // 修复2: 检查用户数配额
    const [uc] = await p.query(
      'SELECT COUNT(*) as c FROM sys_user WHERE tenant_id = ? AND is_deleted = 0',
      [tenant.id]
    );
    if (uc[0].c >= tenant.max_users) {
      return res.status(403).json({ code: 403, message: '用户配额已满（' + tenant.max_users + '人），请联系管理员升级套餐' });
    }

    // 检查用户名唯一
    const [ex] = await p.query('SELECT id FROM sys_user WHERE username = ? AND is_deleted = 0', [username]);
    if (ex.length > 0) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    // 创建用户
    const hash = await bcrypt.hash(password, 10);
    const [r2] = await p.query(
      'INSERT INTO sys_user (username, password_hash, real_name, tenant_id, role_id, creator_id, created_at) VALUES (?, ?, ?, ?, 3, ?, NOW())',
      [username, hash, contact_name || username, tenant.id, tenant.id]
    );

    res.status(201).json({ code: 201, message: '注册成功', data: { user_id: r2.insertId } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 修复2: 项目创建接口（带项目配额检查） ============
app.post('/api/project/create', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { project_name, project_code, description } = req.body;
    if (!project_name || !project_code) {
      return res.status(400).json({ code: 400, message: '项目名称和编码不能为空' });
    }

    const p = getPool();

    // 修复2: 检查项目配额
    const [tc] = await p.query(
      'SELECT COUNT(*) as c FROM sys_tenant_project WHERE tenant_id = ?',
      [tenantId]
    );
    const maxP = req.user.max_projects || 999;
    if (tc[0].c >= maxP) {
      return res.status(403).json({ code: 403, message: '项目配额已满（' + maxP + '个），请联系管理员升级套餐' });
    }

    const [r] = await p.query(
      'INSERT INTO sys_tenant_project (project_code, project_name, description, status, tenant_id, created_at) VALUES (?, ?, ?, 1, ?, NOW())',
      [project_code, project_name, description || '', tenantId]
    );
    res.status(201).json({ code: 201, message: '创建成功', data: { id: r.insertId } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ AI模型管理接口 ============
app.get('/api/ai/model/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query(
      'SELECT id, model_name, model_code, provider, api_endpoint, max_tokens, temperature, cost_per_input, cost_per_output, is_default, status FROM ai_model WHERE tenant_id = ? AND status = 1 ORDER BY sort_order, id',
      [tenantId]
    );
    res.json({ code: 0, message: 'success', data: { items: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ AI对话接口 ============
app.post('/api/ai/chat/send', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { session_id, messages, model_code } = req.body;
    
    const sid = session_id || 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    const startTime = Date.now();
    let responseText = '';
    
    if (lastUserMessage.includes('客户') || lastUserMessage.includes('商机')) {
      responseText = '根据您的需求，我为您找到了以下信息：\n\n1. 当前共有4个客户，其中A级客户3个\n2. 活跃商机1个，金额80万元\n3. 建议关注比亚迪公司的Pack生产线项目\n\n需要我帮您做更详细的分析吗？';
    } else if (lastUserMessage.includes('合同') || lastUserMessage.includes('报价')) {
      responseText = '关于合同和报价：\n\n1. 当前有1份合同，金额70万元\n2. 报价单1份，金额75万元\n3. 商机跟进中，阶段为合同谈判\n\n还有其他问题吗？';
    } else if (lastUserMessage.includes('帮助') || lastUserMessage.includes('怎么')) {
      responseText = '我是SmartAuto AI助手，可以帮您：\n\n1. 查询客户信息和商机状态\n2. 查看报价单和合同进度\n3. 分析销售数据和业绩\n4. 回答系统使用相关问题\n\n请告诉我您的需求！';
    } else {
      responseText = '收到您的消息：「' + lastUserMessage.substring(0, 50) + (lastUserMessage.length > 50 ? '...' : '') + '」\n\n我将为您处理这个请求。如需更多帮助，请详细描述您的问题。';
    }
    
    const latencyMs = Date.now() - startTime;
    const promptTokens = Math.ceil(lastUserMessage.length / 4);
    const completionTokens = Math.ceil(responseText.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const cost = (promptTokens * 0.0001 + completionTokens * 0.0002) / 1000;
    
    const p = getPool();
    const roleMap = { user: 1, assistant: 2, system: 0 };
    for (const msg of messages) {
      if (msg.role === 'user') {
        const roleNum = roleMap[msg.role] || 0;
        await p.query(
          'INSERT INTO ai_message (tenant_id, session_id, conversation_id, role, content, model_id) VALUES (?, ?, 1, ?, ?, 1)',
          [tenantId, sid, roleNum, msg.content]
        );
      }
    }
    
    await p.query(
      'INSERT INTO ai_message (tenant_id, session_id, conversation_id, role, content, model_id, input_tokens, output_tokens, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, sid, 1, 2, responseText, 1, promptTokens, completionTokens, latencyMs]
    );
    
    await p.query(
      'INSERT INTO ai_session (tenant_id, user_id, session_id, title, model_code, message_count, total_tokens, total_cost, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE message_count = message_count + 2, total_tokens = total_tokens + ?, total_cost = total_cost + ?, last_message = ?, updated_at = NOW()',
      [tenantId, userId, sid, lastUserMessage.substring(0, 50), model_code || 'mock-gpt', messages.length, totalTokens, cost, lastUserMessage.substring(0, 100), totalTokens, cost, lastUserMessage.substring(0, 100)]
    );
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        session_id: sid,
        message: responseText,
        model: model_code || 'mock-gpt',
        usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens },
        cost: cost,
        latency_ms: latencyMs
      }
    });
  } catch (e) {
    console.error('AI chat error:', e);
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ AI会话列表接口 ============
app.get('/api/ai/session/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    
    const p = getPool();
    
    const [countRows] = await p.query(
      'SELECT COUNT(*) as total FROM ai_session WHERE tenant_id = ? AND user_id = ? AND is_deleted = 0',
      [tenantId, userId]
    );
    const total = countRows[0]?.total || 0;
    
    const [rows] = await p.query(
      'SELECT id, session_id, title, model_code, message_count, total_tokens, total_cost, last_message, is_star, created_at, updated_at FROM ai_session WHERE tenant_id = ? AND user_id = ? AND is_deleted = 0 ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      [tenantId, userId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );
    
    res.json({ code: 0, message: 'success', data: { list: rows, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ AI会话消息历史 ============
app.get('/api/ai/session/:sessionId/messages', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { sessionId } = req.params;
    
    const p = getPool();
    const [rows] = await p.query(
      'SELECT id, role, content, input_tokens, output_tokens, latency_ms, created_at FROM ai_message WHERE tenant_id = ? AND session_id = ? ORDER BY id',
      [tenantId, sessionId]
    );
    
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 删除会话 ============
app.delete('/api/ai/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { sessionId } = req.params;
    
    const p = getPool();
    await p.query(
      'UPDATE ai_session SET is_deleted = 1 WHERE tenant_id = ? AND session_id = ?',
      [tenantId, sessionId]
    );
    
    res.json({ code: 0, message: 'success' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 修复1: 客户管理接口（加字段长度校验） ============
app.get('/api/sales/customer/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name, level, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    let sql = 'SELECT * FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (name) { sql += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push('%' + name + '%', '%' + name + '%'); }
    if (level) { sql += ' AND level = ?'; params.push(level); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/sales/customer/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [totalRows] = await p.query('SELECT COUNT(*) as total FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [levelRows] = await p.query('SELECT level, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY level', [tenantId]);
    const [statusRows] = await p.query('SELECT status, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    
    res.json({ code: 0, message: 'success', data: { total: totalRows[0]?.total || 0, byLevel: levelRows, byStatus: statusRows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM crm_customer WHERE id = ? AND tenant_id = ? AND is_deleted = 0', [req.params.id, tenantId]);
    
    rows.length > 0 ? res.json({ code: 0, message: 'success', data: rows[0] }) : res.status(404).json({ code: 404, message: 'not found' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: POST customer 加字段长度校验
app.post('/api/sales/customer', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ code: 400, message: '客户名称不能为空' });
    }
    
    // 修复1: 字段长度校验
    const MAX = { name: 200, short_name: 100, level: 16, type: 32, status: 16, industry: 64, contact_name: 50, contact_phone: 32, contact_email: 128, province: 32, city: 32, address: 256, description: 1000 };
    for (const [field, limit] of Object.entries(MAX)) {
      if (req.body[field] && String(req.body[field]).length > limit) {
        return res.status(400).json({ code: 400, message: field + '长度超限(' + limit + '字符)' });
      }
    }
    
    const p = getPool();
    const [codeRows] = await p.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_customer WHERE code LIKE ?', ['KH%']);
    const code = 'KH' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await p.query(
      'INSERT INTO crm_customer (tenant_id, code, name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, name, short_name || '', level || 'B', type || 'potential', status || 'active', industry || '', contact_name || '', contact_phone || '', contact_email || '', province || '', city || '', address || '', description || '', req.user.id]
    );
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: PUT customer 加字段长度校验
app.put('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description } = req.body;
    
    // 修复1: 字段长度校验
    const MAX = { name: 200, short_name: 100, level: 16, type: 32, status: 16, industry: 64, contact_name: 50, contact_phone: 32, contact_email: 128, province: 32, city: 32, address: 256, description: 1000 };
    for (const [field, limit] of Object.entries(MAX)) {
      if (req.body[field] && String(req.body[field]).length > limit) {
        return res.status(400).json({ code: 400, message: field + '长度超限(' + limit + '字符)' });
      }
    }
    
    const p = getPool();
    const [result] = await p.query(
      'UPDATE crm_customer SET name=?, short_name=?, level=?, type=?, status=?, industry=?, contact_name=?, contact_phone=?, contact_email=?, province=?, city=?, address=?, description=? WHERE id=? AND tenant_id=?',
      [name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description, req.params.id, tenantId]
    );
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.delete('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE crm_customer SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 商机管理接口（修复1: 加字段长度校验） ============
app.get('/api/sales/business/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name, status, priority } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    let sql = 'SELECT b.*, c.customer_name as customer_name FROM crm_business b LEFT JOIN crm_customer c ON b.customer_id=c.id WHERE b.tenant_id=? AND b.is_deleted=0';
    const params = [tenantId];
    if (name) { sql += ' AND b.name LIKE ?'; params.push('%' + name + '%'); }
    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (priority) { sql += ' AND b.priority = ?'; params.push(priority); }
    
    const [countRows] = await p.query(sql.replace('SELECT b.*, c.customer_name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY b.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: POST business 加字段长度校验
app.post('/api/sales/business', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, customer_id, amount, stage, priority, close_date, description } = req.body;
    
    if (!name || !customer_id) {
      return res.status(400).json({ code: 400, message: '商机名称和客户不能为空' });
    }
    
    // 修复1: 字段长度校验
    const MAX = { name: 200, stage: 32, priority: 16, description: 1000 };
    for (const [field, limit] of Object.entries(MAX)) {
      if (req.body[field] && String(req.body[field]).length > limit) {
        return res.status(400).json({ code: 400, message: field + '长度超限(' + limit + '字符)' });
      }
    }
    
    const p = getPool();
    const [codeRows] = await p.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_business WHERE code LIKE ?', ['SJ%']);
    const code = 'SJ' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await p.query(
      'INSERT INTO crm_business (tenant_id, code, name, customer_id, amount, stage, priority, close_date, description, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, name, customer_id, amount || 0, stage || 'prospecting', priority || 'medium', close_date || null, description || '', req.user.id]
    );
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: PUT business 加字段长度校验
app.put('/api/sales/business/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, customer_id, amount, stage, priority, close_date, description, status } = req.body;
    
    // 修复1: 字段长度校验
    const MAX = { name: 200, stage: 32, priority: 16, description: 1000 };
    for (const [field, limit] of Object.entries(MAX)) {
      if (req.body[field] && String(req.body[field]).length > limit) {
        return res.status(400).json({ code: 400, message: field + '长度超限(' + limit + '字符)' });
      }
    }
    
    const p = getPool();
    const [result] = await p.query(
      'UPDATE crm_business SET name=?, customer_id=?, amount=?, stage=?, priority=?, close_date=?, description=?, status=? WHERE id=? AND tenant_id=?',
      [name, customer_id, amount, stage, priority, close_date, description, status, req.params.id, tenantId]
    );
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.delete('/api/sales/business/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE crm_business SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 报价单管理接口（修复1: 加字段长度校验） ============
app.get('/api/sales/quote/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, customer_id, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    let sql = 'SELECT q.*, c.customer_name as customer_name FROM crm_quote q LEFT JOIN crm_customer c ON q.customer_id=c.id WHERE q.tenant_id=? AND q.is_deleted=0';
    const params = [tenantId];
    if (customer_id) { sql += ' AND q.customer_id = ?'; params.push(customer_id); }
    if (status) { sql += ' AND q.status = ?'; params.push(status); }
    
    const [countRows] = await p.query(sql.replace('SELECT q.*, c.customer_name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY q.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: POST quote 加字段长度校验
app.post('/api/sales/quote', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { customer_id, business_id, subject, amount, valid_days } = req.body;
    
    if (!customer_id || !subject) {
      return res.status(400).json({ code: 400, message: '客户和报价主题不能为空' });
    }
    
    // 修复1: 字段长度校验
    if (subject && subject.length > 200) {
      return res.status(400).json({ code: 400, message: 'subject长度超限(200字符)' });
    }
    
    const p = getPool();
    const [codeRows] = await p.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_quote WHERE code LIKE ?', ['BJ%']);
    const code = 'BJ' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await p.query(
      'INSERT INTO crm_quote (tenant_id, code, customer_id, business_id, subject, amount, valid_days, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, customer_id, business_id || null, subject, amount || 0, valid_days || 30, 'draft', req.user.id]
    );
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: PUT quote 加字段长度校验
app.put('/api/sales/quote/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { subject, amount, valid_days, status } = req.body;
    
    // 修复1: 字段长度校验
    if (subject && subject.length > 200) {
      return res.status(400).json({ code: 400, message: 'subject长度超限(200字符)' });
    }
    
    const p = getPool();
    const [result] = await p.query(
      'UPDATE crm_quote SET subject=?, amount=?, valid_days=?, status=? WHERE id=? AND tenant_id=?',
      [subject, amount, valid_days, status, req.params.id, tenantId]
    );
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 合同管理接口（修复1: 加字段长度校验） ============
app.get('/api/sales/contract/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, customer_id, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    let sql = 'SELECT c.*, cu.customer_name as customer_name FROM crm_contract c LEFT JOIN crm_customer cu ON c.customer_id=cu.id WHERE c.tenant_id=? AND c.is_deleted=0';
    const params = [tenantId];
    if (customer_id) { sql += ' AND c.customer_id = ?'; params.push(customer_id); }
    if (status) { sql += ' AND c.status = ?'; params.push(status); }
    
    const [countRows] = await p.query(sql.replace('SELECT c.*, cu.customer_name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: POST contract 加字段长度校验
app.post('/api/sales/contract', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { customer_id, quote_id, code, subject, amount, sign_date, start_date, end_date } = req.body;
    
    if (!customer_id || !subject) {
      return res.status(400).json({ code: 400, message: '客户和合同名称不能为空' });
    }
    
    // 修复1: 字段长度校验
    if (subject && subject.length > 200) {
      return res.status(400).json({ code: 400, message: 'subject长度超限(200字符)' });
    }
    
    const p = getPool();
    const [codeRows] = await p.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_contract WHERE code LIKE ?', ['HT%']);
    const contractCode = code || 'HT' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await p.query(
      'INSERT INTO crm_contract (tenant_id, code, customer_id, quote_id, subject, amount, sign_date, start_date, end_date, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, contractCode, customer_id, quote_id || null, subject, amount || 0, sign_date || new Date(), start_date || new Date(), end_date || null, 'active', req.user.id]
    );
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: contractCode } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 修复1: PUT contract 加字段长度校验
app.put('/api/sales/contract/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { subject, amount, start_date, end_date, status } = req.body;
    
    // 修复1: 字段长度校验
    if (subject && subject.length > 200) {
      return res.status(400).json({ code: 400, message: 'subject长度超限(200字符)' });
    }
    
    const p = getPool();
    const [result] = await p.query(
      'UPDATE crm_contract SET subject=?, amount=?, start_date=?, end_date=?, status=? WHERE id=? AND tenant_id=?',
      [subject, amount, start_date, end_date, status, req.params.id, tenantId]
    );
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});


// ============ P0: 销售概览统计 ============
app.get('/api/sales/overview/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    // 客户统计
    const [customerTotal] = await p.query('SELECT COUNT(*) as total FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [customerByLevel] = await p.query('SELECT level, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY level', [tenantId]);
    const [customerByStatus] = await p.query('SELECT status, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    
    // 商机统计
    const [bizTotal] = await p.query('SELECT COUNT(*) as total, SUM(amount) as total_amount FROM crm_business WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [bizByStage] = await p.query('SELECT stage, COUNT(*) as count, SUM(amount) as amount FROM crm_business WHERE tenant_id = ? AND is_deleted = 0 GROUP BY stage', [tenantId]);
    const [bizByPriority] = await p.query('SELECT priority, COUNT(*) as count FROM crm_business WHERE tenant_id = ? AND is_deleted = 0 GROUP BY priority', [tenantId]);
    
    // 报价单统计
    const [quoteTotal] = await p.query('SELECT COUNT(*) as total, SUM(amount) as total_amount FROM crm_quote WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [quoteByStatus] = await p.query('SELECT status, COUNT(*) as count FROM crm_quote WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    
    // 合同统计
    const [contractTotal] = await p.query('SELECT COUNT(*) as total, SUM(amount) as total_amount FROM crm_contract WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [contractByStatus] = await p.query('SELECT status, COUNT(*) as count FROM crm_contract WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    
    // 项目统计
    const [projectTotal] = await p.query('SELECT COUNT(*) as total FROM sys_tenant_project WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [projectByStatus] = await p.query('SELECT status, COUNT(*) as count FROM sys_tenant_project WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    
    res.json({ code: 0, message: 'success', data: {
      customer: { total: customerTotal[0]?.total || 0, byLevel: customerByLevel, byStatus: customerByStatus },
      business: { total: bizTotal[0]?.total || 0, totalAmount: bizTotal[0]?.total_amount || 0, byStage: bizByStage, byPriority: bizByPriority },
      quote: { total: quoteTotal[0]?.total || 0, totalAmount: quoteTotal[0]?.total_amount || 0, byStatus: quoteByStatus },
      contract: { total: contractTotal[0]?.total || 0, totalAmount: contractTotal[0]?.total_amount || 0, byStatus: contractByStatus },
      project: { total: projectTotal[0]?.total || 0, byStatus: projectByStatus }
    }});
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ P0: 项目管理API ============
app.get('/api/sales/project/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, name } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    
    let sql = 'SELECT * FROM sys_tenant_project WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (name) { sql += ' AND project_name LIKE ?'; params.push('%' + name + '%'); }
    
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.post('/api/sales/project', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { project_name, project_code, description, status } = req.body;
    if (!project_name) {
      return res.status(400).json({ code: 400, message: '项目名称不能为空' });
    }
    if (project_name && project_name.length > 200) {
      return res.status(400).json({ code: 400, message: 'project_name长度超限(200字符)' });
    }
    const code = project_code || 'PRJ' + String(Date.now()).slice(-8);
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO sys_tenant_project (project_code, project_name, description, status, tenant_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [code, project_name, description || '', status || 'active', tenantId]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.put('/api/sales/project/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { project_name, description, status } = req.body;
    if (project_name && project_name.length > 200) {
      return res.status(400).json({ code: 400, message: 'project_name长度超限(200字符)' });
    }
    const p = getPool();
    const [result] = await p.query(
      'UPDATE sys_tenant_project SET project_name=?, description=?, status=? WHERE id=? AND tenant_id=?',
      [project_name, description, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'not found' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.delete('/api/sales/project/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE sys_tenant_project SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'not found' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ P0: 客户列表（概览用） ============
app.get('/api/sales/overview/customer/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query(
      'SELECT code, name, short_name, level, type, status, industry, contact_name, contact_phone FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 ORDER BY level DESC, id DESC LIMIT 100',
      [tenantId]
    );
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ P0: 商机列表（概览用） ============
app.get('/api/sales/overview/business/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query(
      `SELECT b.id, b.code, b.name, b.amount, b.stage, b.priority, b.close_date, b.status, c.customer_name as customer_name
       FROM crm_business b LEFT JOIN crm_customer c ON b.customer_id=c.id
       WHERE b.tenant_id = ? AND b.is_deleted = 0 ORDER BY b.id DESC LIMIT 100`,
      [tenantId]
    );
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ P0: 合同列表（概览用） ============
app.get('/api/sales/overview/contract/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query(
      `SELECT c.id, c.code, c.subject, c.amount, c.sign_date, c.start_date, c.end_date, c.status, cu.customer_name as customer_name
       FROM crm_contract c LEFT JOIN crm_customer cu ON c.customer_id=cu.id
       WHERE c.tenant_id = ? AND c.is_deleted = 0 ORDER BY c.id DESC LIMIT 50`,
      [tenantId]
    );
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 健康检查 ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartauto-backend' });
});


// ============ 财务管理模块 ============

// --- 收入 ---
app.get('/api/finance/income/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM fin_income WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/finance/income', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, source_id, source_name, customer_id, customer_name, amount, receipt_date, payment_method, invoice_no, description } = req.body;
    if (!amount) return res.status(400).json({ code: 400, message: '金额不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(income_no, 3) AS UNSIGNED)) as m FROM fin_income WHERE income_no LIKE ?', ['SR%']);
    const income_no = 'SR' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const [result] = await p.query(
      'INSERT INTO fin_income (tenant_id, income_no, type, source_id, source_name, customer_id, customer_name, amount, receipt_date, payment_method, invoice_no, description, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, income_no, type || 'other', source_id, source_name || '', customer_id, customer_name || '', amount, receipt_date, payment_method || 'bank', invoice_no || '', description || '', req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, income_no } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/finance/income/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, source_id, source_name, customer_id, customer_name, amount, receipt_date, payment_method, invoice_no, status, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE fin_income SET type=?, source_id=?, source_name=?, customer_id=?, customer_name=?, amount=?, receipt_date=?, payment_method=?, invoice_no=?, status=?, description=? WHERE id=? AND tenant_id=?',
      [type, source_id, source_name, customer_id, customer_name, amount, receipt_date, payment_method, invoice_no, status, description, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/finance/income/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE fin_income SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 支出 ---
app.get('/api/finance/expense/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM fin_expense WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/finance/expense', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, target, amount, expense_date, payment_method, invoice_no, description } = req.body;
    if (!amount) return res.status(400).json({ code: 400, message: '金额不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(expense_no, 3) AS UNSIGNED)) as m FROM fin_expense WHERE expense_no LIKE ?', ['ZC%']);
    const expense_no = 'ZC' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const [result] = await p.query(
      'INSERT INTO fin_expense (tenant_id, expense_no, type, target, amount, expense_date, payment_method, invoice_no, description, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, expense_no, type || 'other', target || '', amount, expense_date, payment_method || 'bank', invoice_no || '', description || '', req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, expense_no } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/finance/expense/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, target, amount, expense_date, payment_method, invoice_no, status, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE fin_expense SET type=?, target=?, amount=?, expense_date=?, payment_method=?, invoice_no=?, status=?, description=? WHERE id=? AND tenant_id=?',
      [type, target, amount, expense_date, payment_method, invoice_no, status, description, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/finance/expense/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE fin_expense SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 发票 ---
app.get('/api/finance/invoice/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM fin_invoice WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/finance/invoice', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, customer_id, customer_name, amount, tax_rate, issue_date, remark } = req.body;
    if (!amount) return res.status(400).json({ code: 400, message: '金额不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(invoice_no, 3) AS UNSIGNED)) as m FROM fin_invoice WHERE invoice_no LIKE ?', ['FP%']);
    const invoice_no = 'FP' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const tax_amount = amount * (parseFloat(tax_rate) || 0);
    const [result] = await p.query(
      'INSERT INTO fin_invoice (tenant_id, invoice_no, type, customer_id, customer_name, amount, tax_rate, tax_amount, issue_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, invoice_no, type || 'normal', customer_id, customer_name || '', amount, tax_rate || 0, tax_amount, issue_date, remark || '']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, invoice_no } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/finance/invoice/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { type, customer_id, customer_name, amount, tax_rate, tax_amount, status, issue_date, remark } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE fin_invoice SET type=?, customer_id=?, customer_name=?, amount=?, tax_rate=?, tax_amount=?, status=?, issue_date=?, remark=? WHERE id=? AND tenant_id=?',
      [type, customer_id, customer_name, amount, tax_rate, tax_amount, status, issue_date, remark, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 账户 ---
app.get('/api/finance/account/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [list] = await p.query('SELECT * FROM fin_account WHERE tenant_id = ? ORDER BY id', [tenantId]);
    res.json({ code: 0, message: 'success', data: { list } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/finance/account', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { account_name, account_type, bank_name, account_no, balance, currency, status } = req.body;
    if (!account_name) return res.status(400).json({ code: 400, message: '账户名称不能为空' });
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO fin_account (tenant_id, account_name, account_type, bank_name, account_no, balance, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, account_name, account_type || 'bank', bank_name || '', account_no || '', balance || 0, currency || 'CNY', status || 1]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/finance/account/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { account_name, account_type, bank_name, account_no, balance, currency, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE fin_account SET account_name=?, account_type=?, bank_name=?, account_no=?, balance=?, currency=?, status=? WHERE id=? AND tenant_id=?',
      [account_name, account_type, bank_name, account_no, balance, currency, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 财务统计 ---
app.get('/api/finance/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [incomes] = await p.query('SELECT COALESCE(SUM(amount), 0) as total FROM fin_income WHERE tenant_id = ? AND is_deleted = 0 AND status = "confirmed"', [tenantId]);
    const [expenses] = await p.query('SELECT COALESCE(SUM(amount), 0) as total FROM fin_expense WHERE tenant_id = ? AND is_deleted = 0 AND status = "paid"', [tenantId]);
    const [accounts] = await p.query('SELECT COALESCE(SUM(balance), 0) as total FROM fin_account WHERE tenant_id = ?', [tenantId]);
    const [invoiceStats] = await p.query('SELECT status, COUNT(*) as count, SUM(amount) as amount FROM fin_invoice WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    res.json({ code: 0, message: 'success', data: {
      totalIncome: parseFloat(incomes[0]?.total || 0),
      totalExpense: parseFloat(expenses[0]?.total || 0),
      netProfit: parseFloat(incomes[0]?.total || 0) - parseFloat(expenses[0]?.total || 0),
      accountBalance: parseFloat(accounts[0]?.total || 0),
      invoiceStats
    }});
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// ============ 人事管理模块 ============

// --- 部门 ---
app.get('/api/hr/department/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [list] = await p.query('SELECT * FROM hr_department WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id', [tenantId]);
    res.json({ code: 0, message: 'success', data: { list } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/hr/department', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { dept_no, dept_name, parent_id, manager_id, manager_name, description } = req.body;
    if (!dept_name) return res.status(400).json({ code: 400, message: '部门名称不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(dept_no, 5) AS UNSIGNED)) as m FROM hr_department WHERE dept_no LIKE ?', ['DEPT%']);
    const deptNo = dept_no || 'DEPT' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const [result] = await p.query(
      'INSERT INTO hr_department (tenant_id, dept_no, dept_name, parent_id, manager_id, manager_name, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenantId, deptNo, dept_name, parent_id, manager_id, manager_name || '', description || '']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, dept_no: deptNo } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/hr/department/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { dept_name, parent_id, manager_id, manager_name, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE hr_department SET dept_name=?, parent_id=?, manager_id=?, manager_name=?, description=? WHERE id=? AND tenant_id=?',
      [dept_name, parent_id, manager_id, manager_name, description, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 员工 ---
app.get('/api/hr/employee/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, department_id } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM hr_employee WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (department_id) { sql += ' AND department_id = ?'; params.push(department_id); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/hr/employee', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { real_name, gender, id_card, phone, email, department_id, department_name, position, join_date, salary } = req.body;
    if (!real_name) return res.status(400).json({ code: 400, message: '姓名不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(emp_no, 3) AS UNSIGNED)) as m FROM hr_employee WHERE emp_no LIKE ?', ['YG%']);
    const emp_no = 'YG' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const [result] = await p.query(
      'INSERT INTO hr_employee (tenant_id, emp_no, real_name, gender, id_card, phone, email, department_id, department_name, position, join_date, salary, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, emp_no, real_name, gender || 'other', id_card || '', phone || '', email || '', department_id, department_name || '', position || '', join_date, salary || 0, req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, emp_no } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/hr/employee/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { real_name, gender, id_card, phone, email, department_id, department_name, position, join_date, status, salary } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE hr_employee SET real_name=?, gender=?, id_card=?, phone=?, email=?, department_id=?, department_name=?, position=?, join_date=?, status=?, salary=? WHERE id=? AND tenant_id=?',
      [real_name, gender, id_card, phone, email, department_id, department_name, position, join_date, status, salary, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/hr/employee/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE hr_employee SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 考勤 ---
app.get('/api/hr/attendance/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, emp_id, status, start_date, end_date } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM hr_attendance WHERE tenant_id = ?';
    const params = [tenantId];
    if (emp_id) { sql += ' AND emp_id = ?'; params.push(emp_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (start_date) { sql += ' AND date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND date <= ?'; params.push(end_date); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/hr/attendance', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { emp_id, emp_name, date, check_in, check_out, work_hours, status, description } = req.body;
    if (!emp_id || !date) return res.status(400).json({ code: 400, message: '员工和日期不能为空' });
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO hr_attendance (tenant_id, emp_id, emp_name, date, check_in, check_out, work_hours, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, emp_id, emp_name || '', date, check_in, check_out, work_hours || 0, status || 'normal', description || '']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 工资 ---
app.get('/api/hr/salary/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, emp_id, status, salary_month } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    let sql = 'SELECT * FROM hr_salary WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (emp_id) { sql += ' AND emp_id = ?'; params.push(emp_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (salary_month) { sql += ' AND salary_month = ?'; params.push(salary_month); }
    const [countRows] = await p.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    sql += ' ORDER BY salary_month DESC, id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await p.query(sql, params);
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/hr/salary', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { emp_id, emp_name, salary_month, base_salary, bonus, deduction } = req.body;
    if (!emp_id || !salary_month) return res.status(400).json({ code: 400, message: '员工和月份不能为空' });
    const p = getPool();
    const [r] = await p.query('SELECT MAX(CAST(SUBSTRING(salary_no, 3) AS UNSIGNED)) as m FROM hr_salary WHERE salary_no LIKE ?', ['GZ%']);
    const salary_no = 'GZ' + String((r[0]?.m || 0) + 1).padStart(4, '0');
    const net_salary = (parseFloat(base_salary) || 0) + (parseFloat(bonus) || 0) - (parseFloat(deduction) || 0);
    const [result] = await p.query(
      'INSERT INTO hr_salary (tenant_id, emp_id, emp_name, salary_no, salary_month, base_salary, bonus, deduction, net_salary, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, emp_id, emp_name || '', salary_no, salary_month, base_salary || 0, bonus || 0, deduction || 0, net_salary, req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, salary_no, net_salary } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/hr/salary/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { base_salary, bonus, deduction, status, pay_date } = req.body;
    const p = getPool();
    const net_salary = (parseFloat(base_salary) || 0) + (parseFloat(bonus) || 0) - (parseFloat(deduction) || 0);
    const [result] = await p.query(
      'UPDATE hr_salary SET base_salary=?, bonus=?, deduction=?, net_salary=?, status=?, pay_date=? WHERE id=? AND tenant_id=?',
      [base_salary, bonus, deduction, net_salary, status, pay_date, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 人事统计 ---
app.get('/api/hr/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [empTotal] = await p.query('SELECT COUNT(*) as total FROM hr_employee WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [empByStatus] = await p.query('SELECT status, COUNT(*) as count FROM hr_employee WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    const [empByDept] = await p.query('SELECT department_name, COUNT(*) as count FROM hr_employee WHERE tenant_id = ? AND is_deleted = 0 GROUP BY department_name', [tenantId]);
    const [attendStats] = await p.query('SELECT status, COUNT(*) as count FROM hr_attendance WHERE tenant_id = ? GROUP BY status', [tenantId]);
    const [salaryStats] = await p.query('SELECT status, COUNT(*) as count, SUM(net_salary) as total FROM hr_salary WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    const [deptStats] = await p.query('SELECT COUNT(*) as total FROM hr_department WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    res.json({ code: 0, message: 'success', data: {
      employee: { total: empTotal[0]?.total || 0, byStatus: empByStatus, byDept: empByDept },
      attendance: { byStatus: attendStats },
      salary: { byStatus: salaryStats },
      department: { total: deptStats[0]?.total || 0 }
    }});
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});



// ========== 采购管理模块 ==========
// --- 供应商 ---
app.get('/api/purchase/supplier/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM pur_supplier WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/purchase/supplier', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { supplier_code, supplier_name, contact_person, contact_phone, credit_level, payment_days, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO pur_supplier (tenant_id, supplier_code, supplier_name, contact_person, contact_phone, credit_level, payment_days, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, supplier_code, supplier_name, contact_person, contact_phone, credit_level || 'B', payment_days || 30, status || 'active']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/purchase/supplier/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { supplier_name, contact_person, contact_phone, credit_level, payment_days, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE pur_supplier SET supplier_name=?, contact_person=?, contact_phone=?, credit_level=?, payment_days=?, status=? WHERE id=? AND tenant_id=?',
      [supplier_name, contact_person, contact_phone, credit_level, payment_days, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/purchase/supplier/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE pur_supplier SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 采购申请 ---
app.get('/api/purchase/request/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM pur_request WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/purchase/request', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { request_no, title, request_type, supplier_id, total_amount, description, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO pur_request (tenant_id, request_no, title, request_type, supplier_id, total_amount, description, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, request_no, title, request_type || 'standard', supplier_id, total_amount || 0, description, status || 'draft', req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/purchase/request/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { title, request_type, supplier_id, total_amount, description, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE pur_request SET title=?, request_type=?, supplier_id=?, total_amount=?, description=?, status=? WHERE id=? AND tenant_id=?',
      [title, request_type, supplier_id, total_amount, description, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 采购订单 ---
app.get('/api/purchase/order/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM pur_order WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/purchase/order', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { order_no, supplier_id, total_amount, expected_date, payment_terms, description, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO pur_order (tenant_id, order_no, supplier_id, total_amount, expected_date, payment_terms, description, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, order_no, supplier_id, total_amount || 0, expected_date, payment_terms, description, status || 'pending', req.user.id]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/purchase/order/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { supplier_id, total_amount, expected_date, payment_terms, description, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE pur_order SET supplier_id=?, total_amount=?, expected_date=?, payment_terms=?, description=?, status=? WHERE id=? AND tenant_id=?',
      [supplier_id, total_amount, expected_date, payment_terms, description, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 采购收货 ---
app.get('/api/purchase/receive/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM pur_receive WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/purchase/receive', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { receive_no, order_id, supplier_name, warehouse_id, warehouse_name, total_amount, status, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO pur_receive (tenant_id, receive_no, order_id, supplier_name, warehouse_id, warehouse_name, total_amount, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, receive_no, order_id, supplier_name, warehouse_id, warehouse_name, total_amount || 0, status || 'pending', description]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/purchase/receive/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { order_id, supplier_name, warehouse_id, warehouse_name, total_amount, status, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE pur_receive SET order_id=?, supplier_name=?, warehouse_id=?, warehouse_name=?, total_amount=?, status=?, description=? WHERE id=? AND tenant_id=?',
      [order_id, supplier_name, warehouse_id, warehouse_name, total_amount, status, description, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// ========== 仓库管理模块 ==========
// --- 仓库 ---
app.get('/api/warehouse/warehouse/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM wh_warehouse WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/warehouse/warehouse', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { warehouse_code, warehouse_name, warehouse_type, address, manager, capacity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO wh_warehouse (tenant_id, warehouse_code, warehouse_name, warehouse_type, address, manager, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, warehouse_code, warehouse_name, warehouse_type, address, manager, capacity || 0, status || 'active']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/warehouse/warehouse/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { warehouse_name, warehouse_type, address, manager, capacity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE wh_warehouse SET warehouse_name=?, warehouse_type=?, address=?, manager=?, capacity=?, status=? WHERE id=? AND tenant_id=?',
      [warehouse_name, warehouse_type, address, manager, capacity, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/warehouse/warehouse/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE wh_warehouse SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 物料 ---
app.get('/api/warehouse/material/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM wh_material WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/warehouse/material', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { material_code, material_name, spec, unit, category, safe_stock, cost, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO wh_material (tenant_id, material_code, material_name, spec, unit, category, safe_stock, cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, material_code, material_name, spec, unit, category, safe_stock || 0, cost || 0, status || 'active']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/warehouse/material/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { material_name, spec, unit, category, safe_stock, cost, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE wh_material SET material_name=?, spec=?, unit=?, category=?, safe_stock=?, cost=?, status=? WHERE id=? AND tenant_id=?',
      [material_name, spec, unit, category, safe_stock, cost, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/warehouse/material/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE wh_material SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 库存 ---
app.get('/api/warehouse/inventory/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM wh_inventory WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 入库 ---
app.get('/api/warehouse/inbound/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM wh_inbound WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/warehouse/inbound', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { inbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO wh_inbound (tenant_id, inbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, inbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity || 0, status || 'pending']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/warehouse/inbound/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { warehouse_id, warehouse_name, material_id, material_name, quantity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE wh_inbound SET warehouse_id=?, warehouse_name=?, material_id=?, material_name=?, quantity=?, status=? WHERE id=? AND tenant_id=?',
      [warehouse_id, warehouse_name, material_id, material_name, quantity, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 出库 ---
app.get('/api/warehouse/outbound/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM wh_outbound WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/warehouse/outbound', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { outbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO wh_outbound (tenant_id, outbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, outbound_no, source_type, source_no, warehouse_id, warehouse_name, material_id, material_name, quantity || 0, status || 'pending']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/warehouse/outbound/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { warehouse_id, warehouse_name, material_id, material_name, quantity, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE wh_outbound SET warehouse_id=?, warehouse_name=?, material_id=?, material_name=?, quantity=?, status=? WHERE id=? AND tenant_id=?',
      [warehouse_id, warehouse_name, material_id, material_name, quantity, status, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// ========== 生产装配模块 ==========
// --- 工单 ---
app.get('/api/production/workorder/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM mfg_work_order WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/production/workorder', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { order_no, product_name, product_id, bom_id, planned_qty, completed_qty, start_date, end_date, workshop, status, priority, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO mfg_work_order (tenant_id, order_no, product_name, product_id, bom_id, planned_qty, completed_qty, start_date, end_date, workshop, status, priority, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, order_no, product_name, product_id, bom_id, planned_qty || 0, completed_qty || 0, start_date, end_date, workshop, status || 'planned', priority || 'medium', description]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/production/workorder/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { product_name, product_id, bom_id, planned_qty, completed_qty, start_date, end_date, workshop, status, priority, description } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE mfg_work_order SET product_name=?, product_id=?, bom_id=?, planned_qty=?, completed_qty=?, start_date=?, end_date=?, workshop=?, status=?, priority=?, description=? WHERE id=? AND tenant_id=?',
      [product_name, product_id, bom_id, planned_qty, completed_qty, start_date, end_date, workshop, status, priority, description, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/production/workorder/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE mfg_work_order SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 工序 ---
app.get('/api/production/process/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM mfg_process WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/production/process', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { work_order_id, process_name, process_seq, workstation, worker_id, worker_name, planned_hours, actual_hours, status, start_time, end_time } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO mfg_process (tenant_id, work_order_id, process_name, process_seq, workstation, worker_id, worker_name, planned_hours, actual_hours, status, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, work_order_id, process_name, process_seq || 1, workstation, worker_id, worker_name, planned_hours || 0, actual_hours || 0, status || 'pending', start_time, end_time]
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.put('/api/production/process/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { process_name, process_seq, workstation, worker_id, worker_name, planned_hours, actual_hours, status, start_time, end_time } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'UPDATE mfg_process SET process_name=?, process_seq=?, workstation=?, worker_id=?, worker_name=?, planned_hours=?, actual_hours=?, status=?, start_time=?, end_time=? WHERE id=? AND tenant_id=?',
      [process_name, process_seq, workstation, worker_id, worker_name, planned_hours, actual_hours, status, start_time, end_time, req.params.id, tenantId]
    );
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.delete('/api/production/process/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [result] = await p.query('UPDATE mfg_process SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 生产报工 ---
app.get('/api/production/report/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM mfg_report WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC', [tenantId]);
    res.json({ code: 0, message: 'success', data: rows });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

app.post('/api/production/report', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { work_order_id, process_id, report_no, worker_id, worker_name, output_qty, qualified_qty, rejected_qty, work_hours, status } = req.body;
    const p = getPool();
    const [result] = await p.query(
      'INSERT INTO mfg_report (tenant_id, work_order_id, process_id, report_no, worker_id, worker_name, output_qty, qualified_qty, rejected_qty, work_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, work_order_id, process_id, report_no, worker_id, worker_name, output_qty || 0, qualified_qty || 0, rejected_qty || 0, work_hours || 0, status || 'draft']
    );
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// --- 生产统计 ---
app.get('/api/production/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [woTotal] = await p.query('SELECT COUNT(*) as total FROM mfg_work_order WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [woByStatus] = await p.query('SELECT status, COUNT(*) as count FROM mfg_work_order WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    const [procTotal] = await p.query('SELECT COUNT(*) as total FROM mfg_process WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [procByStatus] = await p.query('SELECT status, COUNT(*) as count FROM mfg_process WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    const [reportTotal] = await p.query('SELECT COUNT(*) as total FROM mfg_report WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [reportByStatus] = await p.query('SELECT status, COUNT(*) as count FROM mfg_report WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    res.json({ code: 0, message: 'success', data: {
      workOrder: { total: woTotal[0]?.total || 0, byStatus: woByStatus },
      process: { total: procTotal[0]?.total || 0, byStatus: procByStatus },
      report: { total: reportTotal[0]?.total || 0, byStatus: reportByStatus }
    }});
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});


// ============ 物流发货模块 ============
app.get('/api/logistics/delivery/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    res.json({ code: 0, message: 'success', data: { list: rows, total: c.total } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.post('/api/logistics/delivery', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { delivery_no, order_no, customer_id, customer_name, contact_name, contact_phone, address, warehouse_id, warehouse_name, total_qty, total_amount, shipping_method, tracking_no, status, estimated_date, description } = req.body;
    const p = getPool();
    const [r] = await p.query('INSERT INTO logis_delivery (tenant_id, delivery_no, order_no, customer_id, customer_name, contact_name, contact_phone, address, warehouse_id, warehouse_name, total_qty, total_amount, shipping_method, tracking_no, status, estimated_date, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [tenantId, delivery_no, order_no, customer_id, customer_name, contact_name, contact_phone, address, warehouse_id, warehouse_name, total_qty||0, total_amount||0, shipping_method, tracking_no, status||'pending', estimated_date, description]);
    res.status(201).json({ code: 201, message: 'created', data: { id: r.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.put('/api/logistics/delivery/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_no, order_no, customer_id, customer_name, contact_name, contact_phone, address, warehouse_id, warehouse_name, total_qty, total_amount, shipping_method, tracking_no, status, estimated_date, actual_date, description } = req.body;
    const p = getPool();
    await p.query('UPDATE logis_delivery SET delivery_no=?, order_no=?, customer_id=?, customer_name=?, contact_name=?, contact_phone=?, address=?, warehouse_id=?, warehouse_name=?, total_qty=?, total_amount=?, shipping_method=?, tracking_no=?, status=?, estimated_date=?, actual_date=?, description=? WHERE id=? AND tenant_id=?', [delivery_no, order_no, customer_id, customer_name, contact_name, contact_phone, address, warehouse_id, warehouse_name, total_qty||0, total_amount||0, shipping_method, tracking_no, status, estimated_date, actual_date, description, id, req.user.tenant_id]);
    res.json({ code: 0, message: 'success' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.delete('/api/logistics/delivery/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const p = getPool();
    await p.query('UPDATE logis_delivery SET is_deleted=1 WHERE id=? AND tenant_id=?', [id, req.user.tenant_id]);
    res.json({ code: 0, message: 'success' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/logistics/shipment/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0 AND tracking_no IS NOT NULL AND tracking_no != "" ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/logistics/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [[s]] = await p.query("SELECT COUNT(*) as shipped FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0 AND status IN ('shipped','in_transit','delivered')", [tenantId]);
    const [[d]] = await p.query("SELECT COUNT(*) as delivered FROM logis_delivery WHERE tenant_id = ? AND is_deleted = 0 AND status = 'delivered'", [tenantId]);
    res.json({ code: 0, message: 'success', data: { total: c.total||0, shipped: s.shipped||0, delivered: d.delivered||0 } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// ============ 验收闭环模块 ============
app.get('/api/acceptance/inspection/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM accept_delivery WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM accept_delivery WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    res.json({ code: 0, message: 'success', data: { list: rows, total: c.total } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.post('/api/acceptance/inspection', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { inspection_no, project_id, project_name, inspection_type, inspector_id, inspector_name, inspection_date, location, status, conclusion, description } = req.body;
    const p = getPool();
    const [r] = await p.query('INSERT INTO accept_delivery (tenant_id, inspection_no, project_id, project_name, inspection_type, inspector_id, inspector_name, inspection_date, location, status, conclusion, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [tenantId, inspection_no, project_id, project_name, inspection_type, inspector_id, inspector_name, inspection_date, location, status||'draft', conclusion, description]);
    res.status(201).json({ code: 201, message: 'created', data: { id: r.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.put('/api/acceptance/inspection/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { inspection_no, project_id, project_name, inspection_type, inspector_id, inspector_name, inspection_date, location, status, conclusion, description } = req.body;
    const p = getPool();
    await p.query('UPDATE accept_delivery SET inspection_no=?, project_id=?, project_name=?, inspection_type=?, inspector_id=?, inspector_name=?, inspection_date=?, location=?, status=?, conclusion=?, description=? WHERE id=? AND tenant_id=?', [inspection_no, project_id, project_name, inspection_type, inspector_id, inspector_name, inspection_date, location, status, conclusion, description, id, req.user.tenant_id]);
    res.json({ code: 0, message: 'success' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/acceptance/inspection/:id/items', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM accept_item WHERE tenant_id = ? AND inspection_id = ? AND is_deleted = 0 ORDER BY id', [req.user.tenant_id, id]);
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.post('/api/acceptance/inspection/:id/items', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, check_method, standard, actual_value, result, remark } = req.body;
    const p = getPool();
    const [r] = await p.query('INSERT INTO accept_item (tenant_id, inspection_id, item_name, check_method, standard, actual_value, result, remark) VALUES (?,?,?,?,?,?,?,?)', [req.user.tenant_id, id, item_name, check_method, standard, actual_value, result, remark]);
    res.status(201).json({ code: 201, message: 'created', data: { id: r.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/acceptance/quality/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM accept_item WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/acceptance/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM accept_delivery WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [[s]] = await p.query("SELECT COUNT(*) as passed FROM accept_delivery WHERE tenant_id = ? AND is_deleted = 0 AND status IN ('passed','accepted')", [tenantId]);
    res.json({ code: 0, message: 'success', data: { total: c.total||0, passed: s.passed||0 } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});

// ============ 售后维保模块 ============
app.get('/api/aftersale/ticket/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM after_sale_order WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM after_sale_order WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    res.json({ code: 0, message: 'success', data: { list: rows, total: c.total } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.post('/api/aftersale/ticket', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { ticket_no, title, type, priority, customer_id, customer_name, contact_name, contact_phone, product_id, product_name, serial_no, status, assignee_id, assignee_name, description } = req.body;
    const p = getPool();
    const [r] = await p.query('INSERT INTO after_sale_order (tenant_id, ticket_no, title, type, priority, customer_id, customer_name, contact_name, contact_phone, product_id, product_name, serial_no, status, assignee_id, assignee_name, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [tenantId, ticket_no, title, type||'consultation', priority||'medium', customer_id, customer_name, contact_name, contact_phone, product_id, product_name, serial_no, status||'open', assignee_id, assignee_name, description]);
    res.status(201).json({ code: 201, message: 'created', data: { id: r.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.put('/api/aftersale/ticket/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ticket_no, title, type, priority, customer_id, customer_name, contact_name, contact_phone, product_id, product_name, serial_no, status, assignee_id, assignee_name, description } = req.body;
    const p = getPool();
    await p.query('UPDATE after_sale_order SET ticket_no=?, title=?, type=?, priority=?, customer_id=?, customer_name=?, contact_name=?, contact_phone=?, product_id=?, product_name=?, serial_no=?, status=?, assignee_id=?, assignee_name=?, description=? WHERE id=? AND tenant_id=?', [ticket_no, title, type, priority, customer_id, customer_name, contact_name, contact_phone, product_id, product_name, serial_no, status, assignee_id, assignee_name, description, id, req.user.tenant_id]);
    res.json({ code: 0, message: 'success' });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/aftersale/ticket/:id/replies', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM after_maintenance WHERE tenant_id = ? AND order_id = ? AND is_deleted = 0 ORDER BY id', [req.user.tenant_id, id]);
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.post('/api/aftersale/ticket/:id/replies', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_no, replier_id, replier_name, content, is_internal } = req.body;
    const p = getPool();
    const [r] = await p.query('INSERT INTO after_maintenance (tenant_id, order_id, reply_no, replier_id, replier_name, content, is_internal) VALUES (?,?,?,?,?,?,?)', [req.user.tenant_id, id, reply_no, replier_id, replier_name, content, is_internal||0]);
    res.status(201).json({ code: 201, message: 'created', data: { id: r.insertId } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/aftersale/visit/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, pageSize = 20 } = req.query;
    const p = getPool();
    const [rows] = await p.query('SELECT * FROM after_maintenance WHERE tenant_id = ? AND is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?', [tenantId, parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize)]);
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});
app.get('/api/aftersale/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [[c]] = await p.query('SELECT COUNT(*) as total FROM after_sale_order WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [[s]] = await p.query("SELECT COUNT(*) as open FROM after_sale_order WHERE tenant_id = ? AND is_deleted = 0 AND status = 'open'", [tenantId]);
    const [[r]] = await p.query("SELECT COUNT(*) as resolved FROM after_sale_order WHERE tenant_id = ? AND is_deleted = 0 AND status = 'resolved'", [tenantId]);
    res.json({ code: 0, message: 'success', data: { total: c.total||0, open: s.open||0, resolved: r.resolved||0 } });
  } catch (e) { res.status(500).json({ code: 500, message: e.message }); }
});


// ============ 系统通用接口（菜单/租户/套餐/当前用户） ============
app.get('/api/system/menu', verifyToken, async (req, res) => {
  try {
    const p = getPool();
    // 查一级菜单（sys_menu无tenant_id，全局共享）
    const [parents] = await p.query(
      'SELECT id, menu_name, path, icon, component FROM sys_menu WHERE is_deleted=0 AND parent_id=0 AND status=1 AND visible=1 ORDER BY sort_order'
    );
    // 查二级菜单
    const parentIds = parents.map(m => m.id);
    let children = [];
    if (parentIds.length > 0) {
      const placeholders = parentIds.map(() => '?').join(',');
      [children] = await p.query(
        'SELECT id, parent_id, menu_name, path, icon, component FROM sys_menu WHERE is_deleted=0 AND parent_id IN (' + placeholders + ') AND status=1 AND visible=1 ORDER BY sort_order',
        [...parentIds]
      );
    }
    // 组装树
    const menuTree = parents.map(parent => ({
      ...parent,
      children: children.filter(c => c.parent_id === parent.id)
    }));
    res.json({ code: 0, message: 'success', data: { list: menuTree } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/system/tenant', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const [rows] = await p.query(
      'SELECT id, tenant_code, tenant_name, package_id, package_expire, max_users, max_projects, status FROM sys_tenant WHERE id=? AND is_deleted=0',
      [tenantId]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '租户不存在' });
    // 查套餐名
    let packageName = '';
    if (rows[0].package_id) {
      const [pkgs] = await p.query('SELECT package_name FROM sys_package WHERE id=? AND is_deleted=0', [rows[0].package_id]);
      if (pkgs.length > 0) packageName = pkgs[0].package_name;
    }
    res.json({ code: 0, message: 'success', data: { ...rows[0], package_name: packageName } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/system/package', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    // 租户套餐信息从sys_tenant的package_id关联sys_package
    const [tenantRows] = await p.query(
      'SELECT package_id FROM sys_tenant WHERE id=? AND is_deleted=0',
      [tenantId]
    );
    if (tenantRows.length === 0) return res.json({ code: 0, message: 'success', data: { list: [] } });
    const pkgId = tenantRows[0].package_id;
    if (!pkgId) return res.json({ code: 0, message: 'success', data: { list: [] } });
    const [rows] = await p.query(
      'SELECT id, package_name, user_limit, project_limit, storage_limit, ai_quota, price, features FROM sys_package WHERE id=? AND is_deleted=0',
      [pkgId]
    );
    res.json({ code: 0, message: 'success', data: { list: rows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/system/currentUser', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const p = getPool();
    const [rows] = await p.query(
      'SELECT id, username, real_name, email, phone, avatar FROM sys_user WHERE id=? AND is_deleted=0',
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '用户不存在' });
    const user = rows[0];
    // 查角色列表（sys_user无role_id字段，需从sys_user_role查）
    const [roles] = await p.query(
      'SELECT r.id, r.role_name FROM sys_user_role ur JOIN sys_role r ON ur.role_id=r.id WHERE ur.user_id=? AND ur.is_deleted=0',
      [userId]
    );
    // 查权限列表
    const [perms] = await p.query(
      'SELECT DISTINCT p.permission_code FROM sys_user_role ur JOIN sys_role_permission rp ON ur.role_id=rp.role_id JOIN sys_permission p ON rp.permission_id=p.id WHERE ur.user_id=? AND ur.is_deleted=0',
      [userId]
    );
    res.json({ code: 0, message: 'success', data: {
      ...user,
      roles: roles.map(r => r.role_name),
      permissions: perms.map(p => p.permission_code)
    }});
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});


// ============ 404处理 ============
app.use((req, res) => {
  res.status(404).json({ code: -1, message: '接口不存在' });
});

// ============ 错误处理 ============
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: -1, message: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log('SmartAuto Backend started on port ' + config.port);
});

module.exports = app;

// ============ AI流式对话接口 (SSE) ============
app.post('/api/ai/chat/stream', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { session_id, messages, model_code } = req.body;
    
    const sid = session_id || 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    const startTime = Date.now();
    let responseText = '';
    
    // Mock响应逻辑
    if (lastUserMessage.includes('客户') || lastUserMessage.includes('商机')) {
      responseText = '根据您的需求，我为您找到了以下信息：\n\n1. 当前共有4个客户，其中A级客户3个\n2. 活跃商机1个，金额80万元\n3. 建议关注比亚迪公司的Pack生产线项目\n\n需要我帮您做更详细的分析吗？';
    } else if (lastUserMessage.includes('合同') || lastUserMessage.includes('报价')) {
      responseText = '关于合同和报价：\n\n1. 当前有1份合同，金额70万元\n2. 报价单1份，金额75万元\n3. 商机跟进中，阶段为合同谈判\n\n还有其他问题吗？';
    } else if (lastUserMessage.includes('帮助') || lastUserMessage.includes('怎么')) {
      responseText = '我是SmartAuto AI助手，可以帮您：\n\n1. 查询客户信息和商机状态\n2. 查看报价单和合同进度\n3. 分析销售数据和业绩\n4. 回答系统使用相关问题\n\n请告诉我您的需求！';
    } else {
      responseText = '收到您的消息：「' + lastUserMessage.substring(0, 50) + (lastUserMessage.length > 50 ? '...' : '') + '」\n\n我将为您处理这个请求。如需更多帮助，请详细描述您的问题。';
    }
    
    // 保存用户消息
    const p = getPool();
    for (const msg of messages) {
      if (msg.role === 'user') {
        await p.query(
          'INSERT INTO ai_message (tenant_id, session_id, conversation_id, role, content, model_id) VALUES (?, ?, 1, 1, ?, 1)',
          [tenantId, sid, msg.content]
        );
      }
    }
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // 流式输出
    const chunks = responseText.split('');
    let fullResponse = '';
    
    for (const char of chunks) {
      fullResponse += char;
      res.write('data: ' + JSON.stringify({ 
        type: 'chunk', 
        content: char,
        full: fullResponse
      }) + '\n\n');
      await new Promise(r => setTimeout(r, 20));
    }
    
    // 计算统计
    const latencyMs = Date.now() - startTime;
    const promptTokens = Math.ceil(lastUserMessage.length / 4);
    const completionTokens = Math.ceil(responseText.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const cost = (promptTokens * 0.0001 + completionTokens * 0.0002) / 1000;
    
    // 保存AI响应
    await p.query(
      'INSERT INTO ai_message (tenant_id, session_id, conversation_id, role, content, model_id, input_tokens, output_tokens, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, sid, 1, 2, responseText, 1, promptTokens, completionTokens, latencyMs]
    );
    
    // 更新会话
    await p.query(
      'INSERT INTO ai_session (tenant_id, user_id, session_id, title, model_code, message_count, total_tokens, total_cost, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE message_count = message_count + 2, total_tokens = total_tokens + ?, total_cost = total_cost + ?, last_message = ?, updated_at = NOW()',
      [tenantId, userId, sid, lastUserMessage.substring(0, 50), model_code || 'mock-gpt', messages.length, totalTokens, cost, lastUserMessage.substring(0, 100), totalTokens, cost, lastUserMessage.substring(0, 100)]
    );
    
    // 发送完成信号
    res.write('data: ' + JSON.stringify({ 
      type: 'done',
      session_id: sid,
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens },
      cost: cost,
      latency_ms: latencyMs
    }) + '\n\n');
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (e) {
    console.error('AI stream error:', e);
    res.write('data: ' + JSON.stringify({ type: 'error', message: e.message }) + '\n\n');
    res.end();
  }
});
