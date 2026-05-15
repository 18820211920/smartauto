import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Card, Row, Col, Statistic } from 'antd'
import { productApi } from '../../api/rnd'

const { Option } = Select

interface Product {
  id: number
  product_code: string
  product_name: string
  product_type: string
  category: string
  model: string
  specs: string
  unit: string
  weight: number
  lifecycle: string
  status: string
  description: string
}

const ProductPage: React.FC = () => {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await productApi.list({ page: 1, pageSize: 100 })
      if (res.code === 0) {
        setData(res.data.list)
      }
    } catch (e) {
      message.error('加载失败')
    }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const res: any = await productApi.stats()
      if (res.code === 0) {
        setStats(res.data)
      }
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Product) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const res: any = await productApi.delete(id)
      if (res.code === 0) {
        message.success('删除成功')
        loadData()
        loadStats()
      }
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        const res: any = await productApi.update(editingId, values)
        if (res.code === 0) {
          message.success('更新成功')
        }
      } else {
        const res: any = await productApi.create(values)
        if (res.code === 201) {
          message.success('创建成功')
        }
      }
      setModalVisible(false)
      loadData()
      loadStats()
    } catch (e) {}
  }

  const columns = [
    { title: '产品编号', dataIndex: 'product_code', width: 120 },
    { title: '产品名称', dataIndex: 'product_name', width: 200 },
    { title: '类型', dataIndex: 'product_type', width: 100, render: (v: string) => v === 'standard' ? '标准' : v === 'custom' ? '定制' : 'OEM' },
    { title: '分类', dataIndex: 'category', width: 120 },
    { title: '型号', dataIndex: 'model', width: 120 },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '重量(kg)', dataIndex: 'weight', width: 100 },
    { title: '生命周期', dataIndex: 'lifecycle', width: 100, render: (v: string) => ({ introduction: '导入', growth: '成长', mature: '成熟', decline: '衰退' }[v] || v) },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => v === 'active' ? '活跃' : v === 'eol' ? '停产' : '未上市' },
    { title: '操作', width: 150, render: (_: any, record: Product) => (
      <>
        <Button size="small" type="link" onClick={() => handleEdit(record)}>编辑</Button>
        <Button size="small" type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
      </>
    )}
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="产品总数" value={stats.total || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="标准产品" value={stats.byType?.find((t: any) => t.product_type === 'standard')?.count || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="定制产品" value={stats.byType?.find((t: any) => t.product_type === 'custom')?.count || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="活跃产品" value={stats.byStatus?.find((t: any) => t.status === 'active')?.count || 0} /></Card></Col>
      </Row>

      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>新建产品</Button>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingId ? '编辑产品' : '新建产品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="product_code" label="产品编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="product_name" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="product_type" label="产品类型" initialValue="standard">
            <Select>
              <Option value="standard">标准产品</Option>
              <Option value="custom">定制产品</Option>
              <Option value="oem">OEM</Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="产品分类">
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit" label="单位" initialValue="台">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="重量(kg)">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="lifecycle" label="生命周期" initialValue="growth">
            <Select>
              <Option value="introduction">导入期</Option>
              <Option value="growth">成长期</Option>
              <Option value="mature">成熟期</Option>
              <Option value="decline">衰退期</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">活跃</Option>
              <Option value="upcoming">未上市</Option>
              <Option value="discontinued">停产</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="产品描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductPage
