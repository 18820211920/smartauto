import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(form.username, form.password);
    setLoading(false);
    if (result.success) {
      // 登录成功，跳转到首页
      navigate('/sales', { replace: true });
    } else {
      setError(result.message || '登录失败');
    }
  };

  return (
    <div className="login-page">
      {/* 背景装饰 */}
      <div className="login-bg-decoration">
        <div className="login-bg-gradient"></div>
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-grid"></div>
      </div>

      <div className="login-container">
        {/* 左侧品牌区域 */}
        <div className="login-brand">
          <div className="login-brand-content">
            <div className="login-logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="40" height="40" rx="8" fill="#2563eb"/>
                <path d="M14 34V18L24 28L34 18V34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="18" r="3" fill="white"/>
              </svg>
            </div>
            <h1 className="login-brand-title">SmartAuto</h1>
            <p className="login-brand-subtitle">非标自动化设备公司<br/>全流程管理系统</p>
            <div className="login-brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>项目管理</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>生产跟踪</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>质量管控</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>数据分析</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="login-form-wrapper">
          <div className="login-card card">
            <div className="login-header">
              <h2>欢迎登录</h2>
              <p>请输入您的账号信息</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>用户名 / 手机号</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="请输入用户名或手机号"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>密码</label>
                <div className="input-wrapper password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="请输入密码"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">记住密码</span>
                </label>
                <a href="#" className="forgot-link">忘记密码？</a>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="btn-primary btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    登录中...
                  </>
                ) : '登录'}
              </button>
            </form>

            <div className="login-footer">
              <p>还没有账号？<a href="#">联系管理员</a></p>
            </div>
          </div>

          <div className="login-version">
            <span>SmartAuto ERP v2.0.0</span>
            <span className="version-divider">|</span>
            <span>© 2024 技术支持</span>
          </div>
        </div>
      </div>
    </div>
  );
}