import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';

function App() {
  const { token } = useAuthStore();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={token ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="sales/customer" element={<div className="page"><h2>客户管理</h2></div>} />
          <Route path="sales/quote" element={<div className="page"><h2>报价管理</h2></div>} />
          <Route path="sales/contract" element={<div className="page"><h2>合同管理</h2></div>} />
          <Route path="project/list" element={<div className="page"><h2>项目列表</h2></div>} />
          <Route path="system/user" element={<div className="page"><h2>用户管理</h2></div>} />
          <Route path="system/role" element={<div className="page"><h2>角色管理</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;