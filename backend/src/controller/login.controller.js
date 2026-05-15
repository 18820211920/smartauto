const bcrypt = require('bcryptjs');
const jwtUtil = require('../middleware/jwt');
const { Result } = require('../util/response');
const { getPool } = require('../dao/base.dao');

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json(Result.fail('用户名和密码不能为空', 400));
    }

    // 查询用户
    const pool = getPool();
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM sys_user WHERE username = ? AND is_deleted = 0', [username]);
    conn.release();

    if (rows.length === 0) {
      return res.status(401).json(Result.fail('用户名或密码错误', 401));
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json(Result.fail('账号已被禁用', 403));
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json(Result.fail('用户名或密码错误', 401));
    }

    // 生成token
    const token = jwtUtil.sign({
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      role_id: user.role_id
    });

    res.json(Result.success({
      token: token,
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        avatar: user.avatar,
        tenant_id: user.tenant_id
      }
    }, '登录成功'));
  } catch (e) {
    res.status(500).json(Result.fail(e.message, 500));
  }
};

// 获取当前用户信息
exports.getInfo = async (req, res) => {
  try {
    const user = req.user;
    res.json(Result.success({
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      role_id: user.role_id
    }));
  } catch (e) {
    res.status(500).json(Result.fail(e.message, 500));
  }
};
