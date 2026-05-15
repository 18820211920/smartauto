import { useState, useEffect } from 'react';
import { Table, Card, Tag, Statistic, Tabs, message } from 'antd';
import { customerApi, businessApi } from '../../api/sales';

const stageColorMap: Record<string, string> = {
  'prospecting': '#1890ff',
  'qualification': '#1890ff',
  'proposal': '#722ed1',
  'negotiation': '#fa8c16',
  'closed_won': '#52c41a',
  'closed_lost': '#f5222d',
};
const stageLabelMap: Record<string, string> = {
  'prospecting': '需求确认',
  'qualification': '方案设计',
  'proposal': '报价阶段',
  'negotiation': '合同谈判',
  'closed_won': '已签约',
  'closed_lost': '已流失',
};

export default function SalesOverview() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [businessList, setBusinessList] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, customerRes, businessRes] = await Promise.allSettled([
        fetch('/api/sales/overview/stats').then(r => r.json()),
        customerApi.list({ page: 1, pageSize: 100 }),
        businessApi.list({ page: 1, pageSize: 100 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value as any;
        if (data.code === 0) setStats(data.data);
      }

      if (customerRes.status === 'fulfilled') {
        const res = customerRes.value as any;
        if (res.code === 0) setCustomerList(res.data?.list || []);
      }

      if (businessRes.status === 'fulfilled') {
        const res = businessRes.value as any;
        if (res.code === 0) setBusinessList(res.data?.list || []);
      }
    } catch (e: any) {
      message.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const customerColumns = [
    { title: '编码', dataIndex: 'code', width: 90 },
    { title: '客户名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: '等级', dataIndex: 'level', width: 70, render: (v: string) => <Tag color={v === 'A' ? 'red' : v === 'B' ? 'orange' : 'default'}>{v}级</Tag> },
    { title: '行业', dataIndex: 'industry', width: 90 },
    { title: '联系人', dataIndex: 'contact_name', width: 80 },
    { title: '电话', dataIndex: 'contact_phone', width: 130 },
    { title: '状态', dataIndex: 'status', width: 70, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '合作中' : v}</Tag> },
  ];

  const businessColumns = [
    { title: '编码', dataIndex: 'code', width: 90 },
    { title: '商机名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: '客户', dataIndex: 'customer_name', width: 100 },
    { title: '金额', dataIndex: 'amount', width: 110, render: (v: string | number) => <span style={{ color: '#fa8c16' }}>{Number(v || 0).toLocaleString()}元</span> },
    { title: '阶段', dataIndex: 'stage', width: 90, render: (v: string) => <Tag color={stageColorMap[v] || 'default'}>{stageLabelMap[v] || v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 70, render: (v: string) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'default'}>{v === 'high' ? '高' : v === 'medium' ? '中' : '低'}</Tag> },
    { title: '预计关闭', dataIndex: 'close_date', width: 100 },
  ];

  return (
    <div style={{ padding: 16 }}>
      {stats && (
        <Card style={{ marginBottom: 16 }} loading={loading}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <Statistic title="客户总数" value={stats.customer?.total || 0} />
            <Statistic title="商机总数" value={stats.business?.total || 0} suffix="个" />
            <Statistic title="商机总金额" value={Number(stats.business?.totalAmount || 0).toLocaleString()} suffix="元" />
            <Statistic title="报价单总额" value={Number(stats.quote?.totalAmount || 0).toLocaleString()} suffix="元" />
            <Statistic title="合同总额" value={Number(stats.contract?.totalAmount || 0).toLocaleString()} suffix="元" />
          </div>
        </Card>
      )}
      <Card loading={loading}>
        <Tabs defaultActiveKey="customers" items={[
          { key: 'customers', label: `客户 (${customerList.length})`, children: <Table dataSource={customerList} columns={customerColumns} rowKey="id" pagination={{ pageSize: 5 }} size="small" /> },
          { key: 'opportunities', label: `商机 (${businessList.length})`, children: <Table dataSource={businessList} columns={businessColumns} rowKey="id" pagination={{ pageSize: 5 }} size="small" /> },
        ]} />
      </Card>
    </div>
  );
}
