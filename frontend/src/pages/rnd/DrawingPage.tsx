import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space } from 'antd'
import { drawingApi } from '../../api/rnd'

const { Option } = Select

interface Drawing {
  id: number
  drawing_code: string
  drawing_name: string
  drawing_type: string
  product_name: string
  version: string
  format: string
  paper_size: string
  scale: string
  status: string
}

const statusMap: Record<string, string> = { draft: '草稿', reviewing: '审核中', approved: '已批准', archived: '归档' }
const typeMap: Record<string, string> = { assembly: '装配图', part: '零件图', process: '工艺图', wiring: '布线图' }

const DrawingPage: React.FC = () => {
  const [data, setData] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await drawingApi.list({ page: 1, pageSize: 100 })
      if (res.code === 0) setData(res.data.list)
    } catch (e) { message.error('加载失败') }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res: any = await drawingApi.create(values)
      if (res.code === 201) { message.success('创建成功'); setModalVisible(false); form.resetFields(); loadData() }
    } catch (e) {}
  }

  const handleApprove = async (id: number) => {
    try {
      const res: any = await drawingApi.updateStatus(id, 'approved')
      if (res.code === 0) { message.success('审批通过'); loadData() }
    } catch (e) { message.error('操作失败') }
  }

  const columns = [
    { title: '图纸编号', dataIndex: 'drawing_code', width: 120 },
    { title: '图纸名称', dataIndex: 'drawing_name', width: 180 },
    { title: '类型', dataIndex: 'drawing_type', width: 80, render: (v: string) => typeMap[v] || v },
    { title: '关联产品', dataIndex: 'product_name', width: 120 },
    { title: '版本', dataIndex: 'version', width: 60 },
    { title: '格式', dataIndex: 'format', width: 80 },
    { title: '图幅', dataIndex: 'paper_size', width: 60 },
    { title: '比例', dataIndex: 'scale', width: 60 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={{ draft: 'default', reviewing: 'processing', approved: 'success', archived: 'default' }[v]}>{statusMap[v]}</Tag> },
    { title: '操作', width: 150, render: (_: any, record: Drawing) => (
      <Space>
        {record.status !== 'approved' && <Button size="small" type="link" onClick={() => handleApprove(record.id)}>批准</Button>}
      </Space>
    )}
  ]

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={() => { form.resetFields(); setModalVisible(true) }} style={{ marginBottom: 16 }}>新建图纸</Button>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal title="新建图纸" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="drawing_code" label="图纸编号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="drawing_name" label="图纸名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="drawing_type" label="图纸类型" initialValue="assembly"><Select><Option value="assembly">装配图</Option><Option value="part">零件图</Option><Option value="process">工艺图</Option><Option value="wiring">布线图</Option></Select></Form.Item>
          <Form.Item name="version" label="版本" initialValue="A"><Input /></Form.Item>
          <Form.Item name="format" label="文件格式" initialValue="PDF"><Select><Option value="PDF">PDF</Option><Option value="DWG">DWG</Option><Option value="STEP">STEP</Option><Option value="SOLIDWORKS">SOLIDWORKS</Option></Select></Form.Item>
          <Form.Item name="paper_size" label="图幅" initialValue="A3"><Select><Option value="A4">A4</Option><Option value="A3">A3</Option><Option value="A2">A2</Option><Option value="A1">A1</Option><Option value="A0">A0</Option></Select></Form.Item>
          <Form.Item name="scale" label="比例" initialValue="1:1"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DrawingPage
