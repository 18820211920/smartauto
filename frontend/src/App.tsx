import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AIChatPage from './pages/AIChatPage';
import SalesCustomer from './pages/sales/Customer';
import SalesQuote from './pages/sales/Quote';
import SalesContract from './pages/sales/Contract';

// 销售子页面
import SalesOverview from './pages/sales/Overview';
import SalesOpportunity from './pages/sales/Opportunity';
import SalesProject from './pages/sales/Project';

// 其他模块页面
import RndPage from './pages/rnd/Index';
import PurchasePage from './pages/purchase/Index';
import WarehousePage from './pages/warehouse/Index';
import ProductionPage from './pages/production/Index';
import LogisticsPage from './pages/logistics/Index';
import AcceptancePage from './pages/acceptance/Index';
import AftersalePage from './pages/aftersale/Index';
import FinancePage from './pages/finance/Index';
import HrPage from './pages/hr/Index';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/sales" replace />} />
          
          {/* 主布局路由 */}
          <Route path="/sales" element={<MainLayout />}>
            <Route index element={<SalesOverview />} />
            <Route path="customer" element={<SalesCustomer />} />
            <Route path="opportunity" element={<SalesOpportunity />} />
            <Route path="quote" element={<SalesQuote />} />
            <Route path="contract" element={<SalesContract />} />
            <Route path="project" element={<SalesProject />} />
          </Route>
          
          <Route path="/rnd" element={<MainLayout />}>
            <Route index element={<RndPage />} />
          </Route>
          
          <Route path="/purchase" element={<MainLayout />}>
            <Route index element={<PurchasePage />} />
          </Route>
          
          <Route path="/warehouse" element={<MainLayout />}>
            <Route index element={<WarehousePage />} />
          </Route>
          
          <Route path="/production" element={<MainLayout />}>
            <Route index element={<ProductionPage />} />
          </Route>
          
          <Route path="/logistics" element={<MainLayout />}>
            <Route index element={<LogisticsPage />} />
          </Route>
          
          <Route path="/acceptance" element={<MainLayout />}>
            <Route index element={<AcceptancePage />} />
          </Route>
          
          <Route path="/aftersale" element={<MainLayout />}>
            <Route index element={<AftersalePage />} />
          </Route>
          
          <Route path="/finance" element={<MainLayout />}>
            <Route index element={<FinancePage />} />
          </Route>
          
          <Route path="/hr" element={<MainLayout />}>
            <Route index element={<HrPage />} />
          </Route>
          
          {/* 其他路由 */}
          <Route path="/ai" element={<AIChatPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/sales" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
