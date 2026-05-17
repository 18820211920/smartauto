/**
 * 研发模块AI智能分析助手 - Phase 4
 */
import { useState, useRef, useEffect } from 'react';
import { Card, Tag, Button, Spin, message } from 'antd';
import { sendMessageStream, type AIMessage } from '../../api/ai';

export default function RndAIAssistant() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadRndData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rnd/stats');
      const data = await res.json();
      if (data.code === 0) setSummaryData(data.data);
    } catch (e: any) { message.error('Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRndData(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: AIMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const aiMsg: AIMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, aiMsg]);

    try {
      await sendMessageStream(
        { messages: [...messages, userMsg], model_code: 'mock-gpt' },
        (_content, full) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') last.content = full;
            return updated;
          });
        },
        () => { generateInsights(); },
        (error) => { message.error('AI Error: ' + error.message); }
      );
    } finally { setStreaming(false); }
  };

  const generateInsights = () => {
    if (!summaryData) return;
    const newInsights: any[] = [];
    
    if (summaryData.product?.total > 0) {
      newInsights.push({
        type: 'product', title: '[Product] Product Overview',
        content: `Total ${summaryData.product.total} products. Active: ${summaryData.product.active || 0}.`
      });
    }
    if (summaryData.bom?.total > 0) {
      newInsights.push({
        type: 'bom', title: '[BOM] Bill of Materials',
        content: `Total ${summaryData.bom.total} BOMs. Completed: ${summaryData.bom.completed || 0}.`
      });
    }
    if (summaryData.task?.total > 0) {
      newInsights.push({
        type: 'task', title: '[Task] R&D Tasks',
        content: `Total ${summaryData.task.total} tasks. In progress: ${summaryData.task.in_progress || 0}.`
      });
    }
    setInsights(newInsights);
  };

  const quickQueries = [
    { label: 'BOM Analysis', query: 'Analyze BOM structure and give optimization suggestions' },
    { label: 'Task Status', query: 'Show R&D task status and bottlenecks' },
    { label: 'Tech Debt', query: 'Identify technical debt and refactoring priorities' },
  ];

  const typeColors: Record<string, string> = {
    product: '#1890ff', bom: '#722ed1', task: '#fa8c16', drawing: '#52c41a'
  };

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <Card title="R&D AI Assistant" extra={<Button size="small" onClick={() => { setMessages([]); setInsights([]); }}>New</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickQueries.map(q => (
            <Tag.CheckableTag key={q.label} checked={false} onChange={() => setInput(q.query)} style={{ cursor: 'pointer', padding: '4px 12px' }}>
              {q.label}
            </Tag.CheckableTag>
          ))}
        </div>
        <div style={{ height: 400, overflow: 'auto', marginBottom: 16, padding: '8px 0' }}>
          {loading && <Spin tip="Loading data..." style={{ display: 'block', textAlign: 'center', margin: 20 }} />}
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              <p>Welcome to R&D AI Assistant</p>
              <p style={{ fontSize: 12 }}>Analyze product/BOM/task/drawing data</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.role === 'user' ? '#6366f1' : '#f5f5f5', color: msg.role === 'user' ? '#fff' : '#333', whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Enter R&D question..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
            disabled={streaming} />
          <Button type="primary" onClick={handleSend} loading={streaming} disabled={!input.trim()}>
            {streaming ? 'Analyzing...' : 'Send'}
          </Button>
        </div>
      </Card>
      <div>
        <Card title="Smart Insights" extra={<Button size="small" onClick={generateInsights}>Refresh</Button>}>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}><p>Click refresh for AI analysis</p></div>
          ) : insights.map((insight, idx) => (
            <div key={idx} style={{ padding: 12, marginBottom: 12, borderRadius: 8, border: '2px solid ' + (typeColors[insight.type] || '#999') + '20', background: (typeColors[insight.type] || '#999') + '08' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{insight.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{insight.content}</div>
            </div>
          ))}
        </Card>
        <Card title="Data Summary" style={{ marginTop: 16 }} size="small">
          {summaryData ? (
            <div style={{ fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>Products</span><strong>{summaryData.product?.total || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>BOMs</span><strong>{summaryData.bom?.total || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span>Tasks</span><strong>{summaryData.task?.total || 0}</strong>
              </div>
            </div>
          ) : <Spin size="small" />}
        </Card>
      </div>
    </div>
  );
}
