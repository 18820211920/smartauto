import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { contractApi } from '../../api/sales'

export default function SalesContract() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await contractApi.list({ page: 1, pageSize: 50 })
      if (res.code === 0) setData(res.data.list)
    } catch (e: any) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await contractApi.create(values)
      message.success('创建成功')
      setModalVisible(false)
      fetchData()
    } catch (e: any) {
      message.error(e.message)
    }
  }

  const columns = [
    { title: '编码', dataIndex: 'code', width: 100 },
    { title: '客户', dataIndex: 'customer_name', width: 150 },
    { title: '合同名称', dataIndex: 'subject', width: 200, render: (v: string) => <strong>{v}</strong> },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: string) => `¥${Number(v || 0).toLocaleString()}` },
    { title: '签订日期', dataIndex: 'sign_date', width: 120, render: (v: string) => v?.split('T')[0] || '-' },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="合同管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true) }}>新建合同</Button>}>
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
      <Modal title="新建合同" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="subject" label="合同名称" rules={[{ required: true }]}><Input placeholder="合同名称" /></Form.Item>
          <Form.Item name="amount" label="金额" initialValue={0}><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

