import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Progress, Button } from 'antd'
import { Link } from 'react-router-dom'
import { productApi, taskApi } from '../../api/rnd'

interface Stats {
  product: { total?: number; byType?: any[]; byStatus?: any[] }
  task: { total?: number; byStatus?: any[] }
}

const menuCards = [
  { key: 'product', title: '产品管理', icon: '📦', desc: '产品档案、BOM、技术参数', color: '#1890ff', link: '/rnd/product' },
  { key: 'bom', title: 'BOM管理', icon: '🧾', desc: '物料清单、版本管理、成本核算', color: '#52c41a', link: '/rnd/bom' },
  { key: 'drawing', title: '图纸管理', icon: '📐', desc: '设计图纸、审核流程', color: '#faad14', link: '/rnd/drawing' },
  { key: 'task', title: '设计任务', icon: '📋', desc: '设计任务、进度跟踪', color: '#f5222d', link: '/rnd/task' },
]

export default function RndIndexPage() {
  const [stats, setStats] = useState<Stats>({ product: {}, task: {} })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        productApi.stats() as any,
        taskApi.stats() as any
      ])
      setStats({
        product: pRes?.code === 0 ? pRes.data : {},
        task: tRes?.code === 0 ? tRes.data : {}
      })
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>📐 研发设计管理</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="产品总数" value={stats.product.total || 0} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="BOM总数" value="-" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="设计任务" value={stats.task.total || 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="进行中" value={stats.task.byStatus?.find((t: any) => t.status === 'in_progress')?.count || 0} valueStyle={{ color: '#f5222d' }} /></Card></Col>
      </Row>

      <Row gutter={16}>
        {menuCards.map(card => (
          <Col span={6} key={card.key}>
            <Link to={card.link}>
              <Card hoverable style={{ borderLeft: `4px solid ${card.color}`, marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{card.icon}</div>
                <h3 style={{ margin: '8px 0', color: card.color }}>{card.title}</h3>
                <p style={{ color: '#666', fontSize: 12 }}>{card.desc}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Card title="🔔 最新设计任务" style={{ marginTop: 24 }}>
        <RecentTasks />
      </Card>
    </div>
  )
}

function RecentTasks() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    (taskApi.list({ page: 1, pageSize: 5 }) as any).then((res: any) => {
      if (res?.code === 0) setData(res.data.list)
    }).catch(console.error)
  }, [])

  const columns = [
    { title: '任务编号', dataIndex: 'task_code', width: 100 },
    { title: '任务名称', dataIndex: 'task_name', width: 200 },
    { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => (
      <Tag color={{ critical: 'red', high: 'orange', medium: 'blue', low: 'green' }[v]}>
        {{ critical: '紧急', high: '高', medium: '中', low: '低' }[v]}
      </Tag>
    )},
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => (
      <Tag>{{ pending: '待启动', in_progress: '进行中', review: '审核中', approved: '已完成', blocked: '阻塞' }[v]}</Tag>
    )},
    { title: '进度', dataIndex: 'progress', width: 150, render: (v: number) => <Progress percent={v} size="small" /> },
    { title: '操作', width: 80, render: () => <Link to="/rnd/task"><Button size="small">详情</Button></Link> },
  ]

  return <Table columns={columns} dataSource={data} rowKey="id" pagination={false} size="small" />
}
