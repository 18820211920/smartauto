/**
 * 采购模块AI智能分析助手 - Phase 5
 */
import { useState, useRef, useEffect } from 'react';
import { Card, Tag, Button, Spin, message } from 'antd';
import { sendMessageStream, type AIMessage } from '../../api/ai';

export default function PurchaseAIAssistant() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchase/stats');
      const data = await res.json();
      if (data.code === 0) setSummaryData(data.data);
    } catch (e: any) { message.error('Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
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
        (_content, full) => { setMessages(prev => { const u = [...prev]; if (u[u.length-1]?.role==='assistant') u[u.length-1].content=full; return u; }); },
        () => { generateInsights(); },
        (error) => { message.error('AI Error: ' + error.message); }
      );
    } finally { setStreaming(false); }
  };

  const generateInsights = () => {
    if (!summaryData) return;
    const newInsights: any[] = [];
    if (summaryData.order?.total > 0) {
      newInsights.push({ type: 'order', title: '[Purchase] Order Analysis', content: `Total ${summaryData.order.total} orders. Amount: ${summaryData.order.totalAmount?.toLocaleString() || 0} CNY.` });
    }
    if (summaryData.supplier?.total > 0) {
      newInsights.push({ type: 'supplier', title: '[Supplier] Supplier Health', content: `Total ${summaryData.supplier.total} suppliers. Active: ${summaryData.supplier.active || 0}.` });
    }
    setInsights(newInsights);
  };

  const quickQueries = [
    { label: 'Order Analysis', query: 'Analyze purchase orders and delivery status' },
    { label: 'Supplier Risk', query: 'Identify supplier risks and alternate sources' },
    { label: 'Cost Savings', query: 'Find cost optimization opportunities' },
  ];

  const typeColors: Record<string, string> = { order: '#1890ff', supplier: '#722ed1', warehouse: '#fa8c16', production: '#52c41a' };

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <Card title="Purchase AI Assistant" extra={<Button size="small" onClick={() => { setMessages([]); setInsights([]); }}>New</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickQueries.map(q => <Tag.CheckableTag key={q.label} checked={false} onChange={() => setInput(q.query)} style={{ cursor: 'pointer', padding: '4px 12px' }}>{q.label}</Tag.CheckableTag>)}
        </div>
        <div style={{ height: 400, overflow: 'auto', marginBottom: 16, padding: '8px 0' }}>
          {loading && <Spin tip="Loading data..." style={{ display: 'block', textAlign: 'center', margin: 20 }} />}
          {messages.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}><p>Welcome to Purchase AI Assistant</p><p style={{ fontSize: 12 }}>Analyze purchase orders and supplier data</p></div>}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.role === 'user' ? '#6366f1' : '#f5f5f5', color: msg.role === 'user' ? '#fff' : '#333', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Enter purchase question..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} disabled={streaming} />
          <Button type="primary" onClick={handleSend} loading={streaming} disabled={!input.trim()}>{streaming ? 'Analyzing...' : 'Send'}</Button>
        </div>
      </Card>
      <div>
        <Card title="Smart Insights" extra={<Button size="small" onClick={generateInsights}>Refresh</Button>}>
          {insights.length === 0 ? <div style={{ textAlign: 'center', color: '#999', padding: 40 }}><p>Click refresh for AI analysis</p></div>
          : insights.map((insight, idx) => (
            <div key={idx} style={{ padding: 12, marginBottom: 12, borderRadius: 8, border: '2px solid ' + (typeColors[insight.type] || '#999') + '20', background: (typeColors[insight.type] || '#999') + '08' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{insight.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{insight.content}</div>
            </div>
          ))}
        </Card>
        <Card title="Data Summary" style={{ marginTop: 16 }} size="small">
          {summaryData ? (
            <div style={{ fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}><span>Orders</span><strong>{summaryData.order?.total || 0}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}><span>Suppliers</span><strong>{summaryData.supplier?.total || 0}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Amount</span><strong>{summaryData.order?.totalAmount?.toLocaleString() || 0}</strong></div>
            </div>
          ) : <Spin size="small" />}
        </Card>
      </div>
    </div>
  );
}
