import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Input, Space, Modal, Form, Select, message, Popconfirm, Tabs, Statistic, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { versionApi, commApi, confirmApi, devStatsApi } from '../../api/dev'

const statusMap: Record<string, { color: string; label: string }> = {
  planning: { color: 'default', label: '规划中' },
  in_progress: { color: 'blue', label: '进行中' },
  completed: { color: 'green', label: '已完成' },
  pending: { color: 'orange', label: '待确认' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已驳回' },
  open: { color: 'blue', label: '开放' },
  closed: { color: 'green', label: '已关闭' },
}

const typeOptions = [
  { label: '问题', value: 'question' },
  { label: '建议', value: 'suggestion' },
  { label: '缺陷', value: 'bug' },
  { label: '需求', value: 'requirement' },
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export default function DevIndex() {
  const [activeTab, setActiveTab] = useState('version')
  const [versionData, setVersionData] = useState<any[]>([])
  const [commData, setCommData] = useState<any[]>([])
  const [confirmData, setConfirmData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchStats = async () => {
    try {
      const res: any = await devStatsApi.get()
      if (res.code === 0) setStats(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const res: any = await versionApi.list({ page, pageSize })
      if (res.code === 0) {
        setVersionData(res.data?.list || [])
        setTotal(res.data?.total || 0)
      }
    } catch (e: any) { message.error(e.message) }
    finally { setLoading(false) }
  }

  const fetchComms = async () => {
    setLoading(true)
    try {
      const res: any = await commApi.list({ page, pageSize })
      if (res.code === 0) {
        setCommData(res.data?.list || [])
        setTotal(res.data?.total || 0)
      }
    } catch (e: any) { message.error(e.message) }
    finally { setLoading(false) }
  }

  const fetchConfirms = async () => {
    setLoading(true)
    try {
      const res: any = await confirmApi.list({ page, pageSize })
      if (res.code === 0) {
        setConfirmData(res.data?.list || [])
        setTotal(res.data?.total || 0)
      }
    } catch (e: any) { message.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    if (activeTab === 'version') fetchVersions()
    else if (activeTab === 'comm') fetchComms()
    else if (activeTab === 'confirm') fetchConfirms()
  }, [activeTab, page, pageSize])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      let res: any
      if (activeTab === 'version') res = await versionApi.delete(id)
      else if (activeTab === 'comm') res = await commApi.delete(id)
      else res = await confirmApi.delete(id)
      if (res.code === 0) {
        message.success('删除成功')
        if (activeTab === 'version') fetchVersions()
        else if (activeTab === 'comm') fetchComms()
        else fetchConfirms()
        fetchStats()
      }
    } catch (e: any) { message.error(e.message) }
  }

  const handleQuickConfirm = async (record: any) => {
    try {
      const res: any = await confirmApi.update(record.id, { status: 'approved' })
      if (res.code === 0) {
        message.success('已确认通过')
        fetchConfirms()
        fetchStats()
      }
    } catch (e: any) { message.error(e.message) }
  }

  const handleReject = async (record: any) => {
    try {
      const res: any = await confirmApi.update(record.id, { status: 'rejected' })
      if (res.code === 0) {
        message.success('已驳回')
        fetchConfirms()
        fetchStats()
      }
    } catch (e: any) { message.error(e.message) }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let res: any
      if (activeTab === 'version') {
        res = editingRecord ? await versionApi.update(editingRecord.id, values) : await versionApi.create(values)
      } else if (activeTab === 'comm') {
        res = editingRecord ? await commApi.update(editingRecord.id, values) : await commApi.create(values)
      } else {
        res = editingRecord ? await confirmApi.update(editingRecord.id, values) : await confirmApi.create(values)
      }
      if (res.code === 0) {
        message.success(editingRecord ? '更新成功' : '创建成功')
        setModalVisible(false)
        if (activeTab === 'version') fetchVersions()
        else if (activeTab === 'comm') fetchComms()
        else fetchConfirms()
        fetchStats()
      }
    } catch (e: any) { message.error(e.message) }
  }

  const versionColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title' },
    { title: '版本', dataIndex: 'version', width: 120 },
    { 
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      }
    },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    { title: '计划日期', dataIndex: 'plan_date', width: 120 },
    { title: '完成日期', dataIndex: 'completed_date', width: 120 },
    { 
      title: '操作', width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  const commColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title' },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { 
      title: '类型', dataIndex: 'type', width: 80,
      render: (v: string) => {
        const opt = typeOptions.find(o => o.value === v)
        return opt ? <Tag>{opt.label}</Tag> : <Tag>{v}</Tag>
      }
    },
    { 
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      }
    },
    { title: '创建人', dataIndex: 'real_name', width: 100 },
    { 
      title: '操作', width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  const confirmColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { 
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      }
    },
    { 
      title: '完成时间', dataIndex: 'completed_at', width: 160,
      render: (v: string) => v ? v.substring(0, 16) : '-'
    },
    { 
      title: '操作', width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleQuickConfirm(record)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>确认</Button>
              <Popconfirm title="确定驳回?" onConfirm={() => handleReject(record)}>
                <Button size="small" danger icon={<DeleteOutlined />}>驳回</Button>
              </Popconfirm>
            </>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div className="page">
      <h2 style={{ marginBottom: 16 }}>研发管理</h2>
      
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}><Card><Statistic title="版本总数" value={stats.versions?.total || 0} /></Card></Col>
          <Col span={6}><Card><Statistic title="已完成" value={stats.versions?.completed || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="沟通记录" value={stats.comms?.total || 0} /></Card></Col>
          <Col span={6}><Card><Statistic title="功能确认" value={stats.confirms?.total || 0} /></Card></Col>
        </Row>
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={key => { setActiveTab(key); setPage(1) }}
        items={[
          { key: 'version', label: '版本记录', children: (
            <>
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建版本</Button>
              </div>
              <Table 
                dataSource={versionData} columns={versionColumns} loading={loading} rowKey="id"
                pagination={{ current: page, pageSize, total, onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps) } }}
              />
            </>
          )},
          { key: 'comm', label: '沟通记录', children: (
            <>
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建沟通</Button>
              </div>
              <Table 
                dataSource={commData} columns={commColumns} loading={loading} rowKey="id"
                pagination={{ current: page, pageSize, total, onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps) } }}
              />
            </>
          )},
          { key: 'confirm', label: '功能确认', children: (
            <>
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建确认</Button>
              </div>
              <Table 
                dataSource={confirmData} columns={confirmColumns} loading={loading} rowKey="id"
                pagination={{ current: page, pageSize, total, onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps) } }}
              />
            </>
          )},
        ]}
      />

      <Modal
        title={editingRecord ? '编辑' : '新建'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          {activeTab === 'version' && (
            <>
              <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
                <Input placeholder="如 v1.0.0" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="status" label="状态" initialValue="planning">
                <Select options={[
                  { label: '规划中', value: 'planning' },
                  { label: '进行中', value: 'in_progress' },
                  { label: '已完成', value: 'completed' },
                ]} />
              </Form.Item>
              <Form.Item name="priority" label="优先级" initialValue="medium">
                <Select options={priorityOptions} />
              </Form.Item>
            </>
          )}
          {activeTab === 'comm' && (
            <>
              <Form.Item name="type" label="类型" initialValue="question">
                <Select options={typeOptions} />
              </Form.Item>
              <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="status" label="状态" initialValue="open">
                <Select options={[
                  { label: '开放', value: 'open' },
                  { label: '已关闭', value: 'closed' },
                ]} />
              </Form.Item>
            </>
          )}
          {activeTab === 'confirm' && (
            <>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="status" label="状态" initialValue="pending">
                <Select options={[
                  { label: '待确认', value: 'pending' },
                  { label: '已通过', value: 'approved' },
                  { label: '已驳回', value: 'rejected' },
                ]} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
