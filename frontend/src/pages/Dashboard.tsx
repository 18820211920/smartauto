import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';

export default function Dashboard() {
  const { tenant } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, projects: 0, customers: 0, workorders: 0, orders: 0, materials: 0, invoices: 0, employees: 0 });
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data || stats);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleGenerateData = async () => {
    if (!window.confirm('将为本租户生成完整测试数据（客户/项目/研发/采购/仓库/生产/发货/售后/验收/财务/人事），是否继续？')) return;
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/testdata/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.code === 0) {
        setGenResult(data.data);
        fetchStats();
      } else {
        alert('生成失败: ' + data.message);
      }
    } catch (e: any) {
      alert('网络错误: ' + e.message);
    }
    setGenLoading(false);
  };

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
        <div className="card">
          <div className="card-title">客户</div>
          <div className="card-value">{stats.customers}</div>
        </div>
        <div className="card">
          <div className="card-title">生产工单</div>
          <div className="card-value">{stats.workorders}</div>
        </div>
        <div className="card">
          <div className="card-title">采购订单</div>
          <div className="card-value">{stats.orders}</div>
        </div>
        <div className="card">
          <div className="card-title">物料</div>
          <div className="card-value">{stats.materials}</div>
        </div>
        <div className="card">
          <div className="card-title">发票</div>
          <div className="card-value">{stats.invoices}</div>
        </div>
        <div className="card">
          <div className="card-title">员工</div>
          <div className="card-value">{stats.employees}</div>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          onClick={handleGenerateData}
          disabled={genLoading}
          style={{
            padding: '12px 32px',
            background: genLoading ? '#ccc' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: genLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {genLoading ? '生成中...' : '一键生成测试数据'}
        </button>
        {genResult && (
          <div style={{ marginTop: 16, padding: '16px 20px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#0369a1' }}>✓ 测试数据生成完成，共 {genResult.total_modules} 个模块：</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {genResult.details.map((item: any) => (
                <div key={item.module} style={{ padding: '8px 12px', background: '#fff', borderRadius: 6, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{item.module}</span>
                  <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: 8 }}>+{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
