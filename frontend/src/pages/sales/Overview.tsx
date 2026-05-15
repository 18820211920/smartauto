import { useState } from 'react';
import { Table, Card, Tag, Button, Statistic, Progress, Tabs } from 'antd';
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';

// 模拟数据
const customerData = [
  { id: 1, name: '华为技术有限公司', level: 'A级', status: '合作中', contact: '李工', phone: '13800138000', follow: '今天 09:00', amount: '580万' },
  { id: 2, name: '比亚迪股份有限公司', level: 'A级', status: '报价中', contact: '王经理', phone: '13800138001', follow: '昨天 14:30', amount: '320万' },
  { id: 3, name: '宁德时代新能源', level: 'A级', status: '合作中', contact: '陈总', phone: '13800138002', follow: '今天 09:30', amount: '420万' },
  { id: 4, name: '欣旺达电子', level: 'B级', status: '意向', contact: '张工', phone: '13800138003', follow: '前天 10:00', amount: '180万' },
  { id: 5, name: '亿纬锂能', level: 'B级', status: '跟进中', contact: '刘工', phone: '13800138004', follow: '3天前', amount: '95万' },
  { id: 6, name: '中创新航', level: 'A级', status: '合作中', contact: '赵总', phone: '13800138005', follow: '今天 10:00', amount: '680万' },
];

const opportunityData = [
  { id: 1, name: '华为装配线升级项目', stage: '需求确认', amount: '500万', probability: 30, customer: '华为技术', deadline: '2026-05-20' },
  { id: 2, name: '比亚迪动力电池PACK线', stage: '方案设计', amount: '800万', probability: 50, customer: '比亚迪', deadline: '2026-06-15' },
  { id: 3, name: '宁德时代化成分容设备', stage: '报价阶段', amount: '1200万', probability: 70, customer: '宁德时代', deadline: '2026-05-25' },
  { id: 4, name: '欣旺达电芯测试线', stage: '合同谈判', amount: '350万', probability: 85, customer: '欣旺达', deadline: '2026-05-18' },
  { id: 5, name: '亿纬锂能注液机改造', stage: '已签约', amount: '180万', probability: 100, customer: '亿纬锂能', deadline: '2026-05-10' },
];

const stageConfig: Record<string, { color: string; width: number }> = {
  '需求确认': { color: '#1890ff', width: 100 },
  '方案设计': { color: '#1890ff', width: 80 },
  '报价阶段': { color: '#1890ff', width: 60 },
  '合同谈判': { color: '#1890ff', width: 40 },
  '已签约': { color: '#52c41a', width: 25 },
};

const customerColumns = [
  { title: '客户名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
  { title: '等级', dataIndex: 'level', render: (v: string) => <Tag color="blue">{v}</Tag> },
  { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '合作中' ? 'green' : v === '报价中' ? 'orange' : 'default'}>{v}</Tag> },
  { title: '联系人', dataIndex: 'contact' },
  { title: '手机', dataIndex: 'phone' },
  { title: '累计合同额', dataIndex: 'amount', render: (v: string) => <span style={{ color: '#52c41a' }}>{v}</span> },
  { title: '最近跟进', dataIndex: 'follow' },
  { title: '操作', render: () => <Button size="small" icon={<EyeOutlined />}>查看</Button> },
];

const opportunityColumns = [
  { title: '商机名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
  { title: '客户', dataIndex: 'customer' },
  { title: '金额', dataIndex: 'amount', render: (v: string) => <span style={{ color: '#fa8c16' }}>{v}</span> },
  { title: '阶段', dataIndex: 'stage', render: (v: string) => {
    const config = stageConfig[v] || { color: '#999', width: 20 };
    return <Tag color={config.color}>{v}</Tag>;
  }},
  { title: '赢单概率', dataIndex: 'probability', render: (v: number) => <Progress percent={v} size="small" /> },
  { title: '截止日期', dataIndex: 'deadline' },
  { title: '操作', render: () => <Button size="small">跟进</Button> },
];

export default function SalesOverview() {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div>
      {/* 统计卡片 */}
      <div className="stats-grid">
        <Card className="stat-card">
          <Statistic title="本月新增客户" value={8} valueStyle={{ color: '#1890ff' }} suffix="个" />
          <div className="stat-change up">↑ 33% vs 上月</div>
        </Card>
        <Card className="stat-card">
          <Statistic title="进行中商机" value={12} valueStyle={{ color: '#722ed1' }} suffix="个" />
          <div className="stat-change up">↑ 2个新商机</div>
        </Card>
        <Card className="stat-card">
          <Statistic title="本月合同额" value={320} valueStyle={{ color: '#52c41a' }} prefix="¥" suffix="万" />
          <div className="stat-change up">↑ 15% vs 目标</div>
        </Card>
        <Card className="stat-card">
          <Statistic title="待跟进事项" value={8} valueStyle={{ color: '#fa8c16' }} suffix="项" />
          <div className="stat-change down">3项已逾期</div>
        </Card>
      </div>

      {/* 商机漏斗 */}
      <Card title="🎯 商机漏斗" className="content-card">
        <div className="funnel-chart">
          {Object.entries(stageConfig).map(([stage, config]) => (
            <div key={stage} className="funnel-item">
              <div className="funnel-label">{stage}</div>
              <div className="funnel-bar" style={{ background: config.color, width: `${config.width}%` }}>
                {stage === '需求确认' && '12个 · ¥1200万'}
                {stage === '方案设计' && '9个 · ¥900万'}
                {stage === '报价阶段' && '6个 · ¥600万'}
                {stage === '合同谈判' && '3个 · ¥350万'}
                {stage === '已签约' && '2个 · ¥200万'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 数据表格 */}
      <Card 
        title={activeTab === 'customers' ? '🏢 客户列表' : '🎯 商机列表'}
        className="content-card"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<PlusOutlined />}>新建{activeTab === 'customers' ? '客户' : '商机'}</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </div>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            { key: 'customers', label: '客户', children: (
              <Table 
                dataSource={customerData} 
                columns={customerColumns} 
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            )},
            { key: 'opportunities', label: '商机', children: (
              <Table 
                dataSource={opportunityData} 
                columns={opportunityColumns} 
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            )},
          ]}
        />
      </Card>
    </div>
  );
}
