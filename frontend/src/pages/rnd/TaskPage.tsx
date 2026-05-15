import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Card, Row, Col, Statistic, Progress, Tag, Space } from 'antd'
import { taskApi } from '../../api/rnd'

const { Option } = Select

interface Task {
  id: number
  task_code: string
  task_name: string
  task_type: string
  priority: string
  stage: string
  product_name: string
  status: string
  progress: number
  estimated_hours: string
  actual_hours: string
  start_date: string
  end_date: string
}

const statusMap: Record<string, string> = { pending: '待启动', in_progress: '进行中', review: '审核中', approved: '已完成', blocked: '已阻塞' }
const priorityMap: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
const priorityColor: Record<string, string> = { critical: 'red', high: 'orange', medium: 'blue', low: 'green' }

const TaskPage: React.FC = () => {
  const [data, setData] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await taskApi.list({ page: 1, pageSize: 100 })
      if (res.code === 0) setData(res.data.list)
    } catch (e) { message.error('加载失败') }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const res: any = await taskApi.stats()
      if (res.code === 0) setStats(res.data)
    } catch (e) {}
  }

  useEffect(() => { loadData(); loadStats() }, [])

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalVisible(true) }
  const handleEdit = (record: Task) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true) }
  const handleDelete = async (id: number) => {
    try {
      const res: any = await taskApi.delete(id)
      if (res.code === 0) { message.success('删除成功'); loadData(); loadStats() }
    } catch (e) { message.error('删除失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        const res: any = await taskApi.update(editingId, values)
        if (res.code === 0) message.success('更新成功')
      } else {
        const res: any = await taskApi.create(values)
        if (res.code === 201) message.success('创建成功')
      }
      setModalVisible(false); loadData(); loadStats()
    } catch (e) {}
  }

  const columns = [
    { title: '任务编号', dataIndex: 'task_code', width: 100 },
    { title: '任务名称', dataIndex: 'task_name', width: 200 },
    { title: '类型', dataIndex: 'task_type', width: 80, render: (v: string) => ({ design: '设计', review: '评审', calculation: '计算', simulation: '仿真' }[v] || v) },
    { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priorityColor[v]}>{priorityMap[v] || v}</Tag> },
    { title: '关联产品', dataIndex: 'product_name', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag>{statusMap[v] || v}</Tag> },
    { title: '进度', dataIndex: 'progress', width: 120, render: (v: number) => <Progress percent={v} size="small" /> },
    { title: '工时(估/实)', width: 100, render: (_: any, r: Task) => `${r.estimated_hours}/${r.actual_hours}h` },
    { title: '操作', width: 150, render: (_: any, record: Task) => (
      <Space>
        <Button size="small" type="link" onClick={() => handleEdit(record)}>编辑</Button>
        <Button size="small" type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
      </Space>
    )}
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="任务总数" value={stats.total || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="进行中" value={stats.byStatus?.find((t: any) => t.status === 'in_progress')?.count || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="紧急任务" value={stats.byPriority?.find((t: any) => t.priority === 'critical')?.count || 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成" value={stats.byStatus?.find((t: any) => t.status === 'approved')?.count || 0} valueStyle={{ color: '#3f8600' }} /></Card></Col>
      </Row>

      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>新建任务</Button>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal title={editingId ? '编辑任务' : '新建任务'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="task_code" label="任务编号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="task_name" label="任务名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="task_type" label="任务类型" initialValue="design"><Select><Option value="design">设计</Option><Option value="review">评审</Option><Option value="calculation">计算</Option><Option value="simulation">仿真</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="priority" label="优先级" initialValue="medium"><Select><Option value="critical">紧急</Option><Option value="high">高</Option><Option value="medium">中</Option><Option value="low">低</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="stage" label="阶段"><Input placeholder="concept/preliminary/detailed" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="estimated_hours" label="预估工时"><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="progress" label="完成进度(%)" initialValue={0}><Input type="number" min={0} max={100} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="任务描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="requirements" label="设计要求"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TaskPage
