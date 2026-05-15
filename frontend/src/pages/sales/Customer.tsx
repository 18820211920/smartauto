import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Input, Space, Modal, Form, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { customerApi } from '../../api/sales'

const levelOptions = [
  { label: 'A级', value: 'A' },
  { label: 'AA级', value: 'AA' },
  { label: 'AAA级', value: 'AAA' },
  { label: 'B级', value: 'B' },
  { label: 'C级', value: 'C' },
]

const statusOptions = [
  { label: '合作中', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '冻结', value: 'blocked' },
]

const industryOptions = ['通信设备', '新能源汽车', '动力电池', '消费电池', '光伏', '储能', '其他']

export default function SalesCustomer() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await customerApi.list({ page: 1, pageSize: 20 })
      if (res.code === 0) {
        setData(res.data.list)
        setTotal(res.data.total)
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
      const res: any = await customerApi.delete(id)
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
        await customerApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await customerApi.create(values)
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
    { title: '客户名称', dataIndex: 'name', width: 200, render: (v: string) => <strong>{v}</strong> },
    { title: '简称', dataIndex: 'short_name', width: 100 },
    { title: '等级', dataIndex: 'level', width: 80, render: (v: string) => <Tag color={v === 'A' ? 'red' : v === 'B' ? 'orange' : 'default'}>{v}级</Tag> },
    { title: '行业', dataIndex: 'industry', width: 100 },
    { title: '联系人', dataIndex: 'contact_name', width: 100 },
    { title: '电话', dataIndex: 'contact_phone', width: 130 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '合作中' : v}</Tag> },
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
        title="客户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增客户</Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input placeholder="搜索客户名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{ total, pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="short_name" label="简称">
            <Input placeholder="请输入简称" />
          </Form.Item>
          <Space>
            <Form.Item name="level" label="等级" initialValue="B">
              <Select options={levelOptions} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="industry" label="行业">
              <Select options={industryOptions.map(v => ({ label: v, value: v }))} style={{ width: 150 }} placeholder="选择行业" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="active">
              <Select options={statusOptions} style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="contact_name" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="contact_phone" label="联系电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="province" label="省份" initialValue="">
            <Input placeholder="省份" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="city" label="城市" initialValue="">
            <Input placeholder="城市" style={{ width: 120 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

