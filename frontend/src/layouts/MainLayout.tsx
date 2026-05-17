import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Avatar, Button, Select, Spin, Tag } from 'antd';
import {
  HomeOutlined, TeamOutlined, ShoppingOutlined,
  AppstoreOutlined, BuildOutlined, CarOutlined, CheckCircleOutlined,
  ToolOutlined, DollarOutlined, ContactsOutlined, MessageOutlined,
  PlusOutlined, SendOutlined, PaperClipOutlined, AudioOutlined
} from '@ant-design/icons';
import { listModels, sendMessageStream, listSessions, type AIModel } from '../api/ai';
import { useAuthStore } from '../store/auth';
import './MainLayout.css';

const modules = [
  { key: 'business',  label: '业务模块',  icon: <TeamOutlined />,         color: '#1890ff', path: '/sales' },
  { key: 'rnd',        label: '研发模块',  icon: <BuildOutlined />,        color: '#722ed1', path: '/rnd' },
  { key: 'purchase',   label: '采购模块',  icon: <ShoppingOutlined />,    color: '#fa8c16', path: '/purchase' },
  { key: 'warehouse',  label: '仓库模块',  icon: <AppstoreOutlined />,    color: '#52c41a', path: '/warehouse' },
  { key: 'production', label: '生产模块',  icon: <BuildOutlined />,        color: '#f5222d', path: '/production' },
  { key: 'logistics',  label: '物流模块',  icon: <CarOutlined />,          color: '#13c2c2', path: '/logistics' },
  { key: 'acceptance', label: '验收模块',  icon: <CheckCircleOutlined />,  color: '#2f54eb', path: '/acceptance' },
  { key: 'aftersale',  label: '售后模块',  icon: <ToolOutlined />,         color: '#eb2f96', path: '/aftersale' },
  { key: 'finance',    label: '财务模块',  icon: <DollarOutlined />,       color: '#faad14', path: '/finance' },
  { key: 'hr',         label: '人事模块',  icon: <ContactsOutlined />,      color: '#a0d911', path: '/hr' },
];

// AI聊天状态
interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp?: string;
}

const defaultWelcome: ChatMessage[] = [
  { role: 'ai', content: '您好！我是鲁工自动化智能助手，可以帮您管理客户、跟踪商机、创建合同等。有什么可以帮您的？' },
];

// 根据当前路径获取当前模块
function getCurrentModule() {
  const path = window.location.pathname;
  if (path.startsWith('/sales')) return modules[0];
  if (path.startsWith('/rnd')) return modules[1];
  if (path.startsWith('/purchase')) return modules[2];
  if (path.startsWith('/warehouse')) return modules[3];
  if (path.startsWith('/production')) return modules[4];
  if (path.startsWith('/logistics')) return modules[5];
  if (path.startsWith('/acceptance')) return modules[6];
  if (path.startsWith('/aftersale')) return modules[7];
  if (path.startsWith('/finance')) return modules[8];
  if (path.startsWith('/hr')) return modules[9];
  return modules[0];
}

function HResizer({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div className="h-resizer" onMouseDown={onMouseDown}>
      <div className="h-resizer-grip">
        <span/><span/><span/><span/><span/>
      </div>
    </div>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);  // 获取登录用户信息

  // 当前模块（响应式）
  const currentModule = getCurrentModule();

  // AI聊天状态
  const [messages, setMessages] = useState<ChatMessage[]>(defaultWelcome);
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 加载模型列表
  useEffect(() => {
    listModels().then(data => {
      setModels(data);
      const defaultModel = data.find((m: AIModel) => m.is_default) || data[0];
      if (defaultModel) setSelectedModel(defaultModel.model_code);
    }).catch(() => {});
  }, []);

  // 加载会话列表
  useEffect(() => {
    if (showHistory) {
      listSessions(1, 50).then(res => {
        setSessions(res.items || []);
      }).catch(() => {});
    }
  }, [showHistory]);

  // 三栏宽度
  const [sidebarW, setSidebarW] = useState(240);
  const [chatW,    setChatW]    = useState(380);

  const headerH = 56;
  const [inputAreaH, setInputAreaH] = useState(120);

  // ---- 垂直分割线1 ----
  const onLeftDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startW = sidebarW;
    const onMove = (ev: MouseEvent) => setSidebarW(Math.max(200, Math.min(320, startW + ev.clientX - startX)));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, [sidebarW]);

  // ---- 垂直分割线2 ----
  const onRightDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startW = chatW;
    const onMove = (ev: MouseEvent) => setChatW(Math.max(280, Math.min(560, startW + ev.clientX - startX)));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, [chatW]);

  // ---- 水平分割线（消息区 ↔ 输入区） ----
  const onHDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startIH = inputAreaH;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      setInputAreaH(Math.max(60, Math.min(400, startIH + delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, [inputAreaH]);

  // 自动滚动
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);

    const aiMsg: ChatMessage = { role: 'ai', content: '' };
    setMessages(prev => [...prev, aiMsg]);

    const currentMessages = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const sid = await sendMessageStream(
        {
          session_id: sessionId || undefined,
          messages: [...currentMessages, { role: 'user', content: userMsg.content }],
          model_code: selectedModel || 'mock-gpt',
          stream: true
        },
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
              lastMsg.content += chunk;
            }
            return updated;
          });
        }
      );
      if (!sessionId && sid) setSessionId(sid);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'ai') {
          lastMsg.content = '抱歉，发生了错误。请稍后重试。';
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // 新建对话
  const handleNewChat = () => {
    setMessages(defaultWelcome);
    setSessionId('');
    setShowHistory(false);
  };

  // 切换会话
  const handleSelectSession = (sid: string) => {
    setSessionId(sid);
    setShowHistory(false);
  };

  return (
    <div className="smartauto-layout">
      {/* ---- 左侧导航 ---- */}
      <div className="sidebar" style={{ width: sidebarW }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">LG</div>
          <div className="sidebar-title">
            <div className="title-main">鲁工自动化</div>
            <div className="title-sub">项目管理系统</div>
          </div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-section">功能模块</div>
          {modules.map(mod => (
            <a key={mod.key}
              className={`nav-item ${currentModule.key === mod.key ? 'active' : ''}`}
              onClick={() => navigate(mod.path)}
            >
              <span className="nav-icon">{mod.icon}</span>
              <span className="nav-label">{mod.label}</span>
              {(mod.key === 'business' || mod.key === 'production') && <span className="nav-badge">{mod.key === 'business' ? 3 : 2}</span>}
            </a>
          ))}
          <div className="nav-section" style={{ marginTop: 12 }}>系统</div>
          <a className="nav-item" onClick={() => navigate('/')}>
            <span className="nav-icon"><HomeOutlined /></span>
            <span className="nav-label">返回首页</span>
          </a>
</div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar style={{ background: currentModule.color }}>{user?.realName?.[0] || user?.username?.[0] || 'U'}</Avatar>
            <div className="user-info">
              <div className="user-name">{user?.realName || user?.username || '用户'}</div>
              <div className="user-role">{user?.roleName || user?.username || ''}</div>
            </div>
          </div>
        </div>

      {/* ---- 中间聊天区 ---- */}
      <div className="chat-area" style={{ width: chatW }}>
        {/* 标题栏 */}
        <div className="chat-header" style={{ height: headerH, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
          <div className="chat-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
            {currentModule.icon}
            <span style={{ color: currentModule.color }}>{currentModule.label}</span>
            <span style={{ color: '#999', fontSize: 13 }}>· 智能助手</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            {models.length > 0 && (
              <Select
                size="small"
                value={selectedModel}
                onChange={setSelectedModel}
                style={{ width: 120, fontSize: 12 }}
                options={models.map(m => ({ value: m.model_code, label: m.model_name }))}
              />
            )}
            <Button type="text" icon={<PlusOutlined />} size="small" title="新建对话" onClick={handleNewChat} />
            <Button type="text" icon={<MessageOutlined />} size="small" title="历史记录" onClick={() => setShowHistory(!showHistory)} />
          </div>
        </div>

        {/* 消息区域（flex:1，自适应剩余空间） */}
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#fafafa' }}>
          {showHistory ? (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>历史会话</div>
              {sessions.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无历史记录</div>
              ) : (
                sessions.map(s => (
                  <div key={s.id} onClick={() => handleSelectSession(s.session_id)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: sessionId === s.session_id ? '#e6f7ff' : 'transparent' }}>
                    <div style={{ fontSize: 13, color: '#333' }}>{s.title || '新对话'}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{s.updated_at || s.created_at}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'user' ? 'user-message' : ''}`}>
                <Avatar className="msg-avatar" style={{ background: msg.role === 'ai' ? currentModule.color : '#666' }}>
                  {msg.role === 'ai' ? 'AI' : '张'}
                </Avatar>
                <div className="msg-bubble">
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', fontSize: 14, color: '#1a1a1a' }}>{msg.content}{isStreaming && idx === messages.length - 1 && msg.role === 'ai' ? <span style={{ animation: 'blink 1s infinite' }}>▊</span> : ''}</pre>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 水平分割线（消息区 ↔ 输入框） */}
        <HResizer onMouseDown={onHDown} />

        {/* 输入区域（固定高度，由分割线拖动控制） */}
        <div className="chat-input-wrap" style={{ height: inputAreaH, flexShrink: 0 }}>
          <div className="chat-input-inner" style={{ display: 'flex', height: '100%', gap: 0 }}>
            {/* 文本输入区 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px 8px 16px', overflow: 'hidden' }}>
              <Input.TextArea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="输入消息...（Enter发送，Shift+Enter换行）"
                variant="borderless"
                style={{
                  flex: 1,
                  resize: 'none',
                  background: '#f5f5f5',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                  overflowY: 'auto',
                }}
              />
            </div>

            {/* 右侧工具栏 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 12px 8px 4px', gap: 4, flexShrink: 0 }}>
              <Button type="text" icon={<PaperClipOutlined />} size="small" title="上传附件" style={{ color: '#666' }} />
              <Button type="text" icon={<AudioOutlined />} size="small" title="语音输入" style={{ color: '#666' }} />
              <Button
                type="primary"
                icon={isStreaming ? <Spin size="small" /> : <SendOutlined />}
                size="small"
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---- 垂直分割线2 ---- */}
      <div className="v-resizer" onMouseDown={onRightDown}><div className="v-resizer-bar" /></div>

{/* ---- 右侧内容区 ---- */}
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}