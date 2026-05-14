import { useState } from 'react';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(form.username, form.password);
    setLoading(false);
    if (!result.success) setError(result.message || '登录失败');
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1>SmartAuto</h1>
        <p className="subtitle">非标自动化设备公司全流程管理系统</p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>用户名</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-field">
            <label>密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}