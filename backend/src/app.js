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

// JWT验证中间件
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), config.jwt.secret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: 'Token无效' });
  }
};

// ============ 登录接口 ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    
    const p = getPool();
    const conn = await p.getConnection();
    const [rows] = await conn.query('SELECT id, tenant_id, username, password_hash, real_name FROM sys_user WHERE username = ? AND is_deleted = 0', [username]);
    conn.release();
    
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
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

// ============ AI模型管理接口 ============
app.get('/api/ai/model/list', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    const [rows] = await conn.query(
      'SELECT id, model_name, model_code, provider, api_endpoint, max_tokens, temperature, cost_per_input, cost_per_output, is_default, status FROM ai_model WHERE tenant_id = ? AND status = 1 ORDER BY sort_order, id',
      [tenantId]
    );
    conn.release();
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
    const conn = await p.getConnection();
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        await conn.query(
          'INSERT INTO ai_message (tenant_id, session_id, role, content, model_code) VALUES (?, ?, ?, ?, ?)',
          [tenantId, sid, msg.role, msg.content, model_code || 'mock-gpt']
        );
      }
    }
    
    await conn.query(
      'INSERT INTO ai_message (tenant_id, session_id, role, content, model_code, prompt_tokens, completion_tokens, latency_ms, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, sid, 'assistant', responseText, model_code || 'mock-gpt', promptTokens, completionTokens, latencyMs, cost]
    );
    
    await conn.query(
      'INSERT INTO ai_session (tenant_id, user_id, session_id, title, model_code, message_count, total_tokens, total_cost, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE message_count = message_count + 2, total_tokens = total_tokens + ?, total_cost = total_cost + ?, last_message = ?, updated_at = NOW()',
      [tenantId, userId, sid, lastUserMessage.substring(0, 50), model_code || 'mock-gpt', messages.length, totalTokens, cost, lastUserMessage.substring(0, 100), totalTokens, cost, lastUserMessage.substring(0, 100)]
    );
    
    conn.release();
    
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
    const conn = await p.getConnection();
    
    const [countRows] = await conn.query(
      'SELECT COUNT(*) as total FROM ai_session WHERE tenant_id = ? AND user_id = ? AND is_deleted = 0',
      [tenantId, userId]
    );
    const total = countRows[0]?.total || 0;
    
    const [rows] = await conn.query(
      'SELECT id, session_id, title, model_code, message_count, total_tokens, total_cost, last_message, is_star, created_at, updated_at FROM ai_session WHERE tenant_id = ? AND user_id = ? AND is_deleted = 0 ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      [tenantId, userId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );
    conn.release();
    
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
    const conn = await p.getConnection();
    const [rows] = await conn.query(
      'SELECT id, role, content, model_code, prompt_tokens, completion_tokens, latency_ms, cost, created_at FROM ai_message WHERE tenant_id = ? AND session_id = ? ORDER BY id',
      [tenantId, sessionId]
    );
    conn.release();
    
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
    const conn = await p.getConnection();
    const [result] = await conn.query(
      'UPDATE ai_session SET is_deleted = 1 WHERE tenant_id = ? AND session_id = ?',
      [tenantId, sessionId]
    );
    conn.release();
    
    res.json({ code: 0, message: 'success' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 客户管理接口 ============
app.get('/api/sales/customer/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name, level, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    
    let sql = 'SELECT * FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0';
    const params = [tenantId];
    if (name) { sql += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push('%' + name + '%', '%' + name + '%'); }
    if (level) { sql += ' AND level = ?'; params.push(level); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    
    const [countRows] = await conn.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await conn.query(sql, params);
    conn.release();
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/sales/customer/stats', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    const [totalRows] = await conn.query('SELECT COUNT(*) as total FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0', [tenantId]);
    const [levelRows] = await conn.query('SELECT level, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY level', [tenantId]);
    const [statusRows] = await conn.query('SELECT status, COUNT(*) as count FROM crm_customer WHERE tenant_id = ? AND is_deleted = 0 GROUP BY status', [tenantId]);
    conn.release();
    
    res.json({ code: 0, message: 'success', data: { total: totalRows[0]?.total || 0, byLevel: levelRows, byStatus: statusRows } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.get('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    const [rows] = await conn.query('SELECT * FROM crm_customer WHERE id = ? AND tenant_id = ? AND is_deleted = 0', [req.params.id, tenantId]);
    conn.release();
    
    rows.length > 0 ? res.json({ code: 0, message: 'success', data: rows[0] }) : res.status(404).json({ code: 404, message: 'not found' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.post('/api/sales/customer', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ code: 400, message: '客户名称不能为空' });
    }
    
    const p = getPool();
    const conn = await p.getConnection();
    const [codeRows] = await conn.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_customer WHERE code LIKE ?', ['KH%']);
    const code = 'KH' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await conn.query(
      'INSERT INTO crm_customer (tenant_id, code, name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, name, short_name || '', level || 'B', type || 'potential', status || 'active', industry || '', contact_name || '', contact_phone || '', contact_email || '', province || '', city || '', address || '', description || '', req.user.id]
    );
    conn.release();
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.put('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description } = req.body;
    
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query(
      'UPDATE crm_customer SET name=?, short_name=?, level=?, type=?, status=?, industry=?, contact_name=?, contact_phone=?, contact_email=?, province=?, city=?, address=?, description=? WHERE id=? AND tenant_id=?',
      [name, short_name, level, type, status, industry, contact_name, contact_phone, contact_email, province, city, address, description, req.params.id, tenantId]
    );
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.delete('/api/sales/customer/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query('UPDATE crm_customer SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 商机管理接口 ============
app.get('/api/sales/business/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name, status, priority } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    
    let sql = 'SELECT b.*, c.name as customer_name FROM crm_business b LEFT JOIN crm_customer c ON b.customer_id=c.id WHERE b.tenant_id=? AND b.is_deleted=0';
    const params = [tenantId];
    if (name) { sql += ' AND b.name LIKE ?'; params.push('%' + name + '%'); }
    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (priority) { sql += ' AND b.priority = ?'; params.push(priority); }
    
    const [countRows] = await conn.query(sql.replace('SELECT b.*, c.name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY b.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await conn.query(sql, params);
    conn.release();
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.post('/api/sales/business', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, customer_id, amount, stage, priority, close_date, description } = req.body;
    
    if (!name || !customer_id) {
      return res.status(400).json({ code: 400, message: '商机名称和客户不能为空' });
    }
    
    const p = getPool();
    const conn = await p.getConnection();
    const [codeRows] = await conn.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_business WHERE code LIKE ?', ['SJ%']);
    const code = 'SJ' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await conn.query(
      'INSERT INTO crm_business (tenant_id, code, name, customer_id, amount, stage, priority, close_date, description, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, name, customer_id, amount || 0, stage || 'prospecting', priority || 'medium', close_date || null, description || '', req.user.id]
    );
    conn.release();
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.put('/api/sales/business/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, customer_id, amount, stage, priority, close_date, description, status } = req.body;
    
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query(
      'UPDATE crm_business SET name=?, customer_id=?, amount=?, stage=?, priority=?, close_date=?, description=?, status=? WHERE id=? AND tenant_id=?',
      [name, customer_id, amount, stage, priority, close_date, description, status, req.params.id, tenantId]
    );
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.delete('/api/sales/business/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query('UPDATE crm_business SET is_deleted=1 WHERE id=? AND tenant_id=?', [req.params.id, tenantId]);
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'delete failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 报价单管理接口 ============
app.get('/api/sales/quote/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, customer_id, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    
    let sql = 'SELECT q.*, c.name as customer_name FROM crm_quote q LEFT JOIN crm_customer c ON q.customer_id=c.id WHERE q.tenant_id=? AND q.is_deleted=0';
    const params = [tenantId];
    if (customer_id) { sql += ' AND q.customer_id = ?'; params.push(customer_id); }
    if (status) { sql += ' AND q.status = ?'; params.push(status); }
    
    const [countRows] = await conn.query(sql.replace('SELECT q.*, c.name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY q.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await conn.query(sql, params);
    conn.release();
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.post('/api/sales/quote', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { customer_id, business_id, subject, amount, valid_days } = req.body;
    
    if (!customer_id || !subject) {
      return res.status(400).json({ code: 400, message: '客户和报价主题不能为空' });
    }
    
    const p = getPool();
    const conn = await p.getConnection();
    const [codeRows] = await conn.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_quote WHERE code LIKE ?', ['BJ%']);
    const code = 'BJ' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await conn.query(
      'INSERT INTO crm_quote (tenant_id, code, customer_id, business_id, subject, amount, valid_days, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, code, customer_id, business_id || null, subject, amount || 0, valid_days || 30, 'draft', req.user.id]
    );
    conn.release();
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: code } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.put('/api/sales/quote/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { subject, amount, valid_days, status } = req.body;
    
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query(
      'UPDATE crm_quote SET subject=?, amount=?, valid_days=?, status=? WHERE id=? AND tenant_id=?',
      [subject, amount, valid_days, status, req.params.id, tenantId]
    );
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 合同管理接口 ============
app.get('/api/sales/contract/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, customer_id, status } = req.query;
    const tenantId = req.user.tenant_id;
    const p = getPool();
    const conn = await p.getConnection();
    
    let sql = 'SELECT c.*, cu.name as customer_name FROM crm_contract c LEFT JOIN crm_customer cu ON c.customer_id=cu.id WHERE c.tenant_id=? AND c.is_deleted=0';
    const params = [tenantId];
    if (customer_id) { sql += ' AND c.customer_id = ?'; params.push(customer_id); }
    if (status) { sql += ' AND c.status = ?'; params.push(status); }
    
    const [countRows] = await conn.query(sql.replace('SELECT c.*, cu.name as customer_name', 'SELECT COUNT(*) as total'), params);
    const total = countRows[0]?.total || 0;
    
    sql += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const [list] = await conn.query(sql, params);
    conn.release();
    
    res.json({ code: 0, message: 'success', data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.post('/api/sales/contract', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { customer_id, quote_id, code, subject, amount, sign_date, start_date, end_date } = req.body;
    
    if (!customer_id || !subject) {
      return res.status(400).json({ code: 400, message: '客户和合同名称不能为空' });
    }
    
    const p = getPool();
    const conn = await p.getConnection();
    const [codeRows] = await conn.query('SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) as max_num FROM crm_contract WHERE code LIKE ?', ['HT%']);
    const contractCode = code || 'HT' + String((codeRows[0]?.max_num || 0) + 1).padStart(4, '0');
    
    const [result] = await conn.query(
      'INSERT INTO crm_contract (tenant_id, code, customer_id, quote_id, subject, amount, sign_date, start_date, end_date, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, contractCode, customer_id, quote_id || null, subject, amount || 0, sign_date || new Date(), start_date || new Date(), end_date || null, 'active', req.user.id]
    );
    conn.release();
    
    res.status(201).json({ code: 201, message: 'created', data: { id: result.insertId, code: contractCode } });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

app.put('/api/sales/contract/:id', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { subject, amount, start_date, end_date, status } = req.body;
    
    const p = getPool();
    const conn = await p.getConnection();
    const [result] = await conn.query(
      'UPDATE crm_contract SET subject=?, amount=?, start_date=?, end_date=?, status=? WHERE id=? AND tenant_id=?',
      [subject, amount, start_date, end_date, status, req.params.id, tenantId]
    );
    conn.release();
    
    result.affectedRows > 0 ? res.json({ code: 0, message: 'success' }) : res.status(400).json({ code: 400, message: 'update failed' });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// ============ 健康检查 ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartauto-backend' });
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

