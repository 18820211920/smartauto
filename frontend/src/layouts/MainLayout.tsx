import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Input, Avatar, Button } from 'antd';
import {
  HomeOutlined, TeamOutlined, ShoppingOutlined,
  AppstoreOutlined, BuildOutlined, CarOutlined, CheckCircleOutlined,
  ToolOutlined, DollarOutlined, ContactsOutlined, MessageOutlined,
  PlusOutlined, SendOutlined, PaperClipOutlined
} from '@ant-design/icons';
import './MainLayout.css';

// 模块配置
const modules = [
  { key: 'business', label: '业务模块', icon: <TeamOutlined />, color: '#1890ff', path: '/sales' },
  { key: 'rnd', label: '研发模块', icon: <BuildOutlined />, color: '#722ed1', path: '/rnd' },
  { key: 'purchase', label: '采购模块', icon: <ShoppingOutlined />, color: '#fa8c16', path: '/purchase' },
  { key: 'warehouse', label: '仓库模块', icon: <AppstoreOutlined />, color: '#52c41a', path: '/warehouse' },
  { key: 'production', label: '生产模块', icon: <BuildOutlined />, color: '#f5222d', path: '/production' },
  { key: 'logistics', label: '物流模块', icon: <CarOutlined />, color: '#13c2c2', path: '/logistics' },
  { key: 'acceptance', label: '验收模块', icon: <CheckCircleOutlined />, color: '#2f54eb', path: '/acceptance' },
  { key: 'aftersale', label: '售后模块', icon: <ToolOutlined />, color: '#eb2f96', path: '/aftersale' },
  { key: 'finance', label: '财务模块', icon: <DollarOutlined />, color: '#faad14', path: '/finance' },
  { key: 'hr', label: '人事模块', icon: <ContactsOutlined />, color: '#a0d911', path: '/hr' },
];

// 模拟对话数据
const mockMessages = [
  { role: 'ai', content: '您好！我是业务模块Agent，您的智能业务助手。我可以帮您管理客户、跟踪商机、创建合同等。' },
  { role: 'user', content: '查看今天的待办事项' },
  { role: 'ai', content: '📋 今日待办事项\n\n🔴 紧急（3项）\n• 10:00 回复华为技术关于装配线的技术疑问\n• 17:00前 提交比亚迪最终报价\n• 14:00 与宁德时代视频会议' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, _setCollapsed] = useState(false);
  const [messages, setMessages] = useState(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 获取当前模块
  const getCurrentModule = () => {
    const path = location.pathname;
    return modules.find(m => path.startsWith(m.path))?.key || 'business';
  };

  const currentModule = getCurrentModule();
  const currentModuleConfig = modules.find(m => m.key === currentModule) || modules[0];

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages([...messages, { role: 'user', content: inputValue }]);
    setInputValue('');
    // 模拟AI回复
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '好的，我会帮您处理。请稍候...'
      }]);
    }, 1000);
  };

  return (
    <div className="smartauto-layout">
      {/* 左侧导航 */}
      <div className="sidebar" style={{ width: collapsed ? 64 : 256 }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">LG</div>
          {!collapsed && (
            <div className="sidebar-title">
              <div className="title-main">鲁工自动化</div>
              <div className="title-sub">项目管理系统</div>
            </div>
          )}
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">功能模块</div>
          {modules.map(module => (
            <a
              key={module.key}
              className={`nav-item ${currentModule === module.key ? 'active' : ''}`}
              onClick={() => navigate(module.path)}
              style={{ '--module-color': module.color } as React.CSSProperties}
            >
              <span className="nav-icon">{module.icon}</span>
              {!collapsed && <span className="nav-label">{module.label}</span>}
              {!collapsed && module.key === 'business' && <span className="nav-badge">3</span>}
              {!collapsed && module.key === 'production' && <span className="nav-badge">2</span>}
            </a>
          ))}

          <div className="nav-section" style={{ marginTop: 12 }}>系统</div>
          <a className="nav-item" onClick={() => navigate('/')}>
            <span className="nav-icon"><HomeOutlined /></span>
            {!collapsed && <span className="nav-label">返回首页</span>}
          </a>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <Avatar style={{ background: currentModuleConfig.color }}>张</Avatar>
            {!collapsed && (
              <div className="user-info">
                <div className="user-name">张三</div>
                <div className="user-role">业务经理</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中间对话区 */}
      <div className="chat-area">
        <div className="chat-header">
          <div className="chat-header-title" style={{ color: currentModuleConfig.color }}>
            {currentModuleConfig.icon}
            {currentModuleConfig.label} · 智能助手
          </div>
          <div className="chat-header-actions">
            <Button type="text" icon={<PlusOutlined />} title="新建对话" />
            <Button type="text" icon={<MessageOutlined />} title="历史记录" />
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role === 'user' ? 'user-message' : ''}`}>
              <Avatar className={`message-avatar ${msg.role}`} style={{ background: msg.role === 'ai' ? currentModuleConfig.color : '#666' }}>
                {msg.role === 'ai' ? 'AI' : '张'}
              </Avatar>
              <div className="message-content">
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{msg.content}</pre>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <Input.TextArea
              className="chat-input"
              placeholder="输入消息...（Shift+Enter 换行）"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <div className="chat-input-actions">
              <Button type="text" icon={<PaperClipOutlined />} title="上传文件" />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}
