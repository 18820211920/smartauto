import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';

export default function Dashboard() {
  const { tenant } = useAuthStore();
  const [stats, _setStats] = useState({ users: 0, projects: 0, customers: 0 });

  useEffect(() => {
    // TODO: 调用API获取统计数据
  }, []);

  return (
    <div className="page">
      <h2 style={{ marginBottom: 24 }}>控制台</h2>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">租户</div>
          <div className="card-value">{tenant?.tenant_name || '-'}</div>
        </div>
        <div className="card">
          <div className="card-title">用户数</div>
          <div className="card-value">{stats.users}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            配额: {tenant?.max_users || 0}
          </div>
        </div>
        <div className="card">
          <div className="card-title">项目数</div>
          <div className="card-value">{stats.projects}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            配额: {tenant?.max_projects || 0}
          </div>
        </div>
        <div className="card">
          <div className="card-title">套餐到期</div>
          <div className="card-value" style={{ fontSize: 20 }}>
            {tenant?.package_expire ? tenant.package_expire.split('T')[0] : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}