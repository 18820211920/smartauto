import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { businessApi } from '../../api/sales'

const stageOptions = [
  { label: '需求确认', value: 'prospecting' },
  { label: '方案设计', value: 'proposal' },
  { label: '报价阶段', value: 'quotation' },
  { label: '合同谈判', value: 'negotiation' },
  { label: '已签约', value: 'contract' },
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

const stageColorMap: Record<string, string> = {
  prospecting: 'blue',
  proposal: 'cyan',
  quotation: 'orange',
  negotiation: 'purple',
  contract: 'green',
}

const stageLabelMap: Record<string, string> = {
  prospecting: '需求确认',
  proposal: '方案设计',
  quotation: '报价阶段',
  negotiation: '合同谈判',
  contract: '已签约',
}

export default function SalesOpportunity() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await businessApi.list({ page: 1, pageSize: 50 })
      if (res.code === 0) {
        setData(res.data.list)
      }
    } catch (e: any) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      const res: any = await businessApi.delete(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (e: any) {
      message.error(e.message)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await businessApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await businessApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (e: any) {
      message.error(e.message)
    }
  }

  const columns = [
    { title: '编码', dataIndex: 'code', width: 100 },
    { title: '商机名称', dataIndex: 'name', width: 200, render: (v: string) => <strong>{v}</strong> },
    { title: '客户', dataIndex: 'customer_name', width: 150 },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: string) => `¥${Number(v || 0).toLocaleString()}` },
    { title: '阶段', dataIndex: 'stage', width: 100, render: (v: string) => <Tag color={stageColorMap[v] || 'default'}>{stageLabelMap[v] || v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'default'}>{v === 'high' ? '高' : v === 'medium' ? '中' : '低'}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="商机管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增商机</Button>}
      >
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title={editingRecord ? '编辑商机' : '新增商机'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商机名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商机名称" />
          </Form.Item>
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}>
            <Input type="number" placeholder="客户ID" />
          </Form.Item>
          <Space>
            <Form.Item name="amount" label="预计金额" initialValue={0}>
              <Input type="number" placeholder="金额" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="stage" label="阶段" initialValue="prospecting">
              <Select options={stageOptions} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="priority" label="优先级" initialValue="medium">
              <Select options={priorityOptions} style={{ width: 80 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="商机描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

