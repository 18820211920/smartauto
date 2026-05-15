import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Row, Col, Statistic, Divider, Space } from 'antd'
import { bomApi } from '../../api/rnd'

const { Option } = Select

interface BomItem {
  id: number
  line_no: number
  item_type: string
  material_name: string
  specification: string
  unit: string
  quantity: number
  unit_price: number
  line_amount: number
  source_type: string
}

interface Bom {
  id: number
  bom_code: string
  bom_name: string
  product_name: string
  version: string
  status: string
  total_cost: string
  items: BomItem[]
}

const BomPage: React.FC = () => {
  const [data, setData] = useState<Bom[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currentBom, setCurrentBom] = useState<Bom | null>(null)
  const [form] = Form.useForm()
  const [itemForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res: any = await bomApi.list({ page: 1, pageSize: 100 })
      if (res.code === 0) setData(res.data.list)
    } catch (e) { message.error('加载失败') }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalVisible(true) }
  const handleEdit = (record: Bom) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true) }

  const handleView = async (record: Bom) => {
    try {
      const res: any = await bomApi.getById(record.id)
      if (res.code === 0) { setCurrentBom(res.data); setDetailVisible(true) }
    } catch (e) { message.error('加载详情失败') }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        const res: any = await bomApi.update(editingId, values)
        if (res.code === 0) message.success('更新成功')
      } else {
        const res: any = await bomApi.create(values)
        if (res.code === 201) message.success('创建成功')
      }
      setModalVisible(false); loadData()
    } catch (e) {}
  }

  const handleAddItem = async () => {
    if (!currentBom) return
    try {
      const values = await itemForm.validateFields()
      const res: any = await bomApi.addItem(currentBom.id, values)
      if (res.code === 201) { message.success('添加成功'); itemForm.resetFields(); handleView(currentBom) }
    } catch (e) {}
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!currentBom) return
    try {
      const res: any = await bomApi.deleteItem(currentBom.id, itemId)
      if (res.code === 0) { message.success('删除成功'); handleView(currentBom) }
    } catch (e) { message.error('删除失败') }
  }

  const columns = [
    { title: 'BOM编码', dataIndex: 'bom_code', width: 120 },
    { title: 'BOM名称', dataIndex: 'bom_name', width: 180 },
    { title: '关联产品', dataIndex: 'product_name', width: 150 },
    { title: '版本', dataIndex: 'version', width: 80 },
    { title: '总成本', dataIndex: 'total_cost', width: 120, render: (v: string) => `¥${Number(v || 0).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => ({ draft: '草稿', active: '生效', archived: '归档' }[v] || v) },
    { title: '操作', width: 180, render: (_: any, record: Bom) => (
      <>
        <Button size="small" type="link" onClick={() => handleView(record)}>查看明细</Button>
        <Button size="small" type="link" onClick={() => handleEdit(record)}>编辑</Button>
      </>
    )}
  ]

  const itemColumns = [
    { title: '行号', dataIndex: 'line_no', width: 60 },
    { title: '类型', dataIndex: 'item_type', width: 80, render: (v: string) => ({ material: '物料', part: '部件', sub_assembly: '子组件' }[v] || v) },
    { title: '物料名称', dataIndex: 'material_name', width: 150 },
    { title: '规格型号', dataIndex: 'specification', width: 150 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '用量', dataIndex: 'quantity', width: 80 },
    { title: '单价', dataIndex: 'unit_price', width: 100, render: (v: number) => `¥${v}` },
    { title: '金额', dataIndex: 'line_amount', width: 120, render: (v: number) => `¥${v}` },
    { title: '来源', dataIndex: 'source_type', width: 80, render: (v: string) => ({ purchase: '采购', make: '自制', subcontract: '外协' }[v] || v) },
    { title: '操作', width: 80, render: (_: any, record: BomItem) => (
      <Button size="small" type="link" danger onClick={() => handleDeleteItem(record.id)}>删除</Button>
    )}
  ]

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>新建BOM</Button>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />

      <Modal title={editingId ? '编辑BOM' : '新建BOM'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="bom_code" label="BOM编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="bom_name" label="BOM名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="product_name" label="关联产品"><Input /></Form.Item>
          <Form.Item name="version" label="版本" initialValue="V1.0"><Input /></Form.Item>
          <Form.Item name="description" label="说明"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="BOM明细" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={1000}>
        {currentBom && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Statistic title="BOM编码" value={currentBom.bom_code} /></Col>
              <Col span={6}><Statistic title="版本" value={currentBom.version} /></Col>
              <Col span={6}><Statistic title="总成本" value={Number(currentBom.total_cost || 0)} prefix="¥" /></Col>
              <Col span={6}><Statistic title="状态" value={{ draft: '草稿', active: '生效', archived: '归档' }[currentBom.status] || currentBom.status} /></Col>
            </Row>
            <Divider>添加物料</Divider>
            <Space wrap>
              <Form form={itemForm} layout="inline">
                <Form.Item name="material_name" rules={[{ required: true }]}><Input placeholder="物料名称" style={{ width: 150 }} /></Form.Item>
                <Form.Item name="specification"><Input placeholder="规格" style={{ width: 120 }} /></Form.Item>
                <Form.Item name="unit" initialValue="PCS"><Input placeholder="单位" style={{ width: 80 }} /></Form.Item>
                <Form.Item name="quantity" initialValue={1}><Input type="number" placeholder="用量" style={{ width: 80 }} /></Form.Item>
                <Form.Item name="unit_price" initialValue={0}><Input type="number" placeholder="单价" style={{ width: 100 }} /></Form.Item>
                <Form.Item name="source_type" initialValue="purchase">
                  <Select style={{ width: 100 }}>
                    <Option value="purchase">采购</Option>
                    <Option value="make">自制</Option>
                    <Option value="subcontract">外协</Option>
                  </Select>
                </Form.Item>
                <Button type="primary" onClick={handleAddItem}>添加</Button>
              </Form>
            </Space>
            <Table columns={itemColumns} dataSource={currentBom.items || []} rowKey="id" style={{ marginTop: 16 }} pagination={false} />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BomPage
