import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { quoteApi } from '../../api/sales'

export default function SalesQuote() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await quoteApi.list({ page: 1, pageSize: 50 })
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
      await quoteApi.create(values)
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
    { title: '主题', dataIndex: 'subject', width: 200, render: (v: string) => <strong>{v}</strong> },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: string) => `¥${Number(v || 0).toLocaleString()}` },
    { title: '有效期', dataIndex: 'valid_days', width: 80, render: (v: number) => `${v}天` },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'draft' ? 'default' : v === 'sent' ? 'blue' : v === 'accepted' ? 'green' : 'red'}>{v}</Tag> },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="报价单" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true) }}>新建报价单</Button>}>
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
      <Modal title="新建报价单" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="subject" label="报价主题" rules={[{ required: true }]}><Input placeholder="主题" /></Form.Item>
          <Form.Item name="amount" label="金额" initialValue={0}><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

