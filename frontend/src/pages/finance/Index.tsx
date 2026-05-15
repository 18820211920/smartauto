import { Card, Table, Tag, Button, Statistic, Progress } from 'antd';

const mockData = [
  { id: 1, name: '示例项目', status: '进行中', progress: 60, amount: '100万' },
];

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color="blue">{v}</Tag> },
  { title: '进度', dataIndex: 'progress', render: (v: number) => <Progress percent={v} size="small" /> },
  { title: '金额', dataIndex: 'amount' },
  { title: '操作', render: () => <Button size="small">查看</Button> },
];

export default function IndexPage() {
  return (
    <div>
      <div className="stats-grid">
        <Card className="stat-card">
          <Statistic title="项目数" value={12} valueStyle={{ color: '#1890ff' }} />
        </Card>
      </div>
      <Card title="📋 财务模块列表">
        <Table dataSource={mockData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
