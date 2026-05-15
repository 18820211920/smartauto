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
import ProductPage from './pages/rnd/ProductPage';
import BomPage from './pages/rnd/BomPage';
import TaskPage from './pages/rnd/TaskPage';
import DrawingPage from './pages/rnd/DrawingPage';
import PurchasePage from './pages/purchase/Index';
import WarehousePage from './pages/warehouse/Index';
import ProductionPage from './pages/production/Index';
import LogisticsPage from './pages/logistics/Index';
import AcceptancePage from './pages/acceptance/Index';
import AftersalePage from './pages/aftersale/Index';
import FinancePage from './pages/finance/Index';
import HrPage from './pages/hr/Index';

// 浅色专业主题（WorkBuddy风格）
const theme = {
  token: {
    // 字体颜色：黑色系
    colorText: '#1a1a1a',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorTextQuaternary: '#cccccc',
    // 背景色：灰白色系
    colorBgBase: '#f5f5f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#f0f0f0',
    colorBgMask: 'rgba(0,0,0,0.45)',
    // 主色
    colorPrimary: '#2563eb',
    colorPrimaryHover: '#1d4ed8',
    colorPrimaryActive: '#1e40af',
    // 边框
    colorBorder: '#e8e8e8',
    colorBorderSecondary: '#f0f0f0',
    // 成功/警告/危险
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#2563eb',
    // 圆角
    borderRadius: 8,
    borderRadiusLG: 10,
    borderRadiusSM: 6,
    // 字体
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    // 间距
    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,
    // 阴影
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.12)',
  },
  algorithm: undefined, // 禁用暗色算法，保持浅色
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
            <Route path="product" element={<ProductPage />} />
            <Route path="bom" element={<BomPage />} />
            <Route path="task" element={<TaskPage />} />
            <Route path="drawing" element={<DrawingPage />} />
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
