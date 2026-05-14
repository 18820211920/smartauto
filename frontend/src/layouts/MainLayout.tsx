import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/auth';

const menuItems = [
  { label: '首页', path: '/' },
  { label: '销售管理', children: [
    { label: '客户管理', path: '/sales/customer' },
    { label: '报价管理', path: '/sales/quote' },
    { label: '合同管理', path: '/sales/contract' },
  ]},
  { label: '项目管理', children: [
    { label: '项目列表', path: '/project/list' },
  ]},
  { label: '系统管理', children: [
    { label: '用户管理', path: '/system/user' },
    { label: '角色管理', path: '/system/role' },
  ]},
];

export default function MainLayout() {
  const { user, tenant, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      <aside className="sidebar" style={{ width: collapsed ? 60 : 220 }}>
        <div className="logo">{collapsed ? 'SA' : 'SmartAuto'}</div>
        <nav>
          {menuItems.map((item) => (
            <div key={item.label} className="nav-group">
              {item.children ? (
                <>
                  <div className="nav-parent" onClick={() => setCollapsed(!collapsed)}>
                    {item.label}
                  </div>
                  {!collapsed && item.children.map((child) => (
                    <div key={child.path} className="nav-child" onClick={() => navigate(child.path)}>
                      {child.label}
                    </div>
                  ))}
                </>
              ) : (
                <div className="nav-item" onClick={() => navigate(item.path)}>{item.label}</div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="tenant-name">{tenant?.tenant_name || ''}</span>
            {tenant?.package_name && <span className="package-tag">{tenant.package_name}</span>}
          </div>
          <div className="topbar-right">
            <span>{user?.realName || user?.username}</span>
            <button className="btn-secondary" onClick={logout}>退出</button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}