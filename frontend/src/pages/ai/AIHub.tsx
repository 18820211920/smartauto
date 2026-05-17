/**
 * AI Hub - Unified AI Entry - Phase 7
 */
import { useState, useEffect } from 'react';
import { Card, Tabs, Tag, Button, Statistic, Row, Col } from 'antd';
import { sendMessageStream, type AIMessage } from '../../api/ai';

export default function AIHub() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/ai/model/list').then(r => r.json());
      if (res.code === 0) setStats({ models: res.data?.length || 0, sessions: 0, knowledge: 0 });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadStats(); }, []);

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
        () => { setStreaming(false); },
        (error) => { console.error(error); setStreaming(false); }
      );
    } catch (e) { setStreaming(false); }
  };

  const scenarios = [
    { label: 'Sales Analysis', query: 'Analyze current sales data', module: 'sales' },
    { label: 'R&D BOM', query: 'Review BOM structure', module: 'rnd' },
    { label: 'QC Analysis', query: 'Analyze quality issues', module: 'qc' },
  ];

  const tools = [
    { name: 'get_customer_list', desc: 'Get customer data' },
    { name: 'get_product_bom', desc: 'Get product BOM' },
    { name: 'create_purchase_order', desc: 'Create PO' },
    { name: 'submit_qc_report', desc: 'Submit QC report' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Models" value={stats?.models || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Sessions" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Knowledge" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Status" value="Active" valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'chat', label: 'AI Chat',
          children: (
            <Card>
              <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                {scenarios.map(s => <Tag.CheckableTag key={s.label} checked={false} onChange={() => setInput(s.query)} style={{ cursor: 'pointer' }}>[{s.module}] {s.label}</Tag.CheckableTag>)}
              </div>
              <div style={{ height: 350, overflow: 'auto', marginBottom: 16 }}>
                {messages.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 60 }}><p>AI Hub - Your unified AI assistant</p></div>}
                {messages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.role === 'user' ? '#6366f1' : '#f5f5f5', color: msg.role === 'user' ? '#fff' : '#333', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd' }} disabled={streaming} />
                <Button type="primary" onClick={handleSend} loading={streaming} disabled={!input.trim()}>{streaming ? 'Thinking...' : 'Send'}</Button>
              </div>
            </Card>
          ),
        },
        {
          key: 'tools', label: 'Tools',
          children: (
            <Card title="Available Tools">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {tools.map(tool => <Card key={tool.name} size="small" hoverable><div style={{ fontWeight: 600 }}>{tool.name}</div><div style={{ fontSize: 12, color: '#666' }}>{tool.desc}</div></Card>)}
              </div>
            </Card>
          ),
        },
        {
          key: 'models', label: 'Models',
          children: <Card title="AI Models"><p>mock-gpt, openai-gpt-4, claude-3</p></Card>,
        },
      ]} />
    </div>
  );
}
