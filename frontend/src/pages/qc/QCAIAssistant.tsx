/**
 * 品检+发货+售后AI智能助手 - Phase 6
 */
import { useState, useRef, useEffect } from 'react';
import { Card, Tag, Button, Spin, message } from 'antd';
import { sendMessageStream, type AIMessage } from '../../api/ai';

export default function QCAIAssistant() {
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
      const [qcRes, afterRes] = await Promise.allSettled([
        fetch('/api/qc/stats').then(r => r.json()),
        fetch('/api/aftersale/stats').then(r => r.json()),
      ]);
      if (qcRes.status === 'fulfilled') setSummaryData((prev: any) => ({ ...prev, qc: qcRes.value.data }));
      if (afterRes.status === 'fulfilled') setSummaryData((prev: any) => ({ ...prev, aftersale: afterRes.value.data }));
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
    if (summaryData.qc?.total > 0) {
      newInsights.push({ type: 'qc', title: '[QC] Quality Control', content: `Total ${summaryData.qc.total} records. Pass rate: ${summaryData.qc.passRate || 0}%.` });
    }
    if (summaryData.aftersale?.total > 0) {
      newInsights.push({ type: 'aftersale', title: '[Service] After-sales', content: `Total ${summaryData.aftersale.total} tickets. Resolved: ${summaryData.aftersale.resolved || 0}.` });
    }
    setInsights(newInsights);
  };

  const quickQueries = [
    { label: 'Pass Rate', query: 'Analyze QC pass rate and failure causes' },
    { label: 'Warranty', query: 'Analyze warranty claims and common issues' },
    { label: 'Logistics', query: 'Analyze delivery performance and delays' },
  ];

  const typeColors: Record<string, string> = { qc: '#1890ff', aftersale: '#722ed1', logistics: '#fa8c16' };

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <Card title="QC & Service AI Assistant" extra={<Button size="small" onClick={() => { setMessages([]); setInsights([]); }}>New</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickQueries.map(q => <Tag.CheckableTag key={q.label} checked={false} onChange={() => setInput(q.query)} style={{ cursor: 'pointer', padding: '4px 12px' }}>{q.label}</Tag.CheckableTag>)}
        </div>
        <div style={{ height: 400, overflow: 'auto', marginBottom: 16, padding: '8px 0' }}>
          {loading && <Spin tip="Loading data..." style={{ display: 'block', textAlign: 'center', margin: 20 }} />}
          {messages.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}><p>Welcome to QC & Service AI</p><p style={{ fontSize: 12 }}>Analyze quality and after-sales data</p></div>}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.role === 'user' ? '#6366f1' : '#f5f5f5', color: msg.role === 'user' ? '#fff' : '#333', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Enter question..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} disabled={streaming} />
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
      </div>
    </div>
  );
}
