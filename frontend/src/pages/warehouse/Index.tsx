import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Statistic, Row, Col, Tabs } from 'antd';
import { warehouseApi } from '../../api/warehouse';


const { Option } = Select;
const { TabPane } = Tabs;

// 仓库管理组件
function WarehouseManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    warehouseApi.warehouse.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => { setEditingItem(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingItem(record); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = (id: number) => {
    Modal.confirm({ title: '确认删除', onOk: () => warehouseApi.warehouse.delete(id).then(() => { message.success('删除成功'); loadData(); })});
  };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const promise = editingItem ? warehouseApi.warehouse.update(editingItem.id, values) : warehouseApi.warehouse.create(values);
      promise.then(() => { message.success(editingItem ? '更新成功' : '创建成功'); setModalVisible(false); loadData(); });
    });
  };

  const typeMap: Record<string, string> = { raw_material: '原材料仓', finished_goods: '成品仓', consumable: '辅料仓', temporary: '暂存仓' };

  const columns = [
    { title: '编号', dataIndex: 'warehouse_code', width: 100 },
    { title: '名称', dataIndex: 'warehouse_name' },
    { title: '类型', dataIndex: 'warehouse_type', width: 100, render: (v: string) => <Tag color="blue">{typeMap[v] || v}</Tag> },
    { title: '地址', dataIndex: 'address' },
    { title: '容量', dataIndex: 'capacity', width: 100 },
    { title: '已用', dataIndex: 'used_capacity', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
    { title: '操作', width: 160, render: (_: any, record: any) => (
      <Space>
        <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
        <Button size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增仓库</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={editingItem ? "编辑仓库" : "新增仓库"} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="warehouse_code" label="仓库编号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="warehouse_name" label="仓库名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="warehouse_type" label="仓库类型"><Select><Option value="raw_material">原材料仓</Option><Option value="finished_goods">成品仓</Option><Option value="consumable">辅料仓</Option><Option value="temporary">暂存仓</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="capacity" label="容量"><Input type="number" /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 物料管理组件
function MaterialManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    warehouseApi.material.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => { setEditingItem(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingItem(record); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = (id: number) => {
    Modal.confirm({ title: '确认删除', onOk: () => warehouseApi.material.delete(id).then(() => { message.success('删除成功'); loadData(); })});
  };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const promise = editingItem ? warehouseApi.material.update(editingItem.id, values) : warehouseApi.material.create(values);
      promise.then(() => { message.success(editingItem ? '更新成功' : '创建成功'); setModalVisible(false); loadData(); });
    });
  };

  const columns = [
    { title: '编号', dataIndex: 'material_code', width: 100 },
    { title: '名称', dataIndex: 'material_name' },
    { title: '规格', dataIndex: 'specs', width: 120 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '当前库存', dataIndex: 'current_stock', width: 80 },
    { title: '标准成本', dataIndex: 'standard_cost', width: 80 },
    { title: '操作', width: 160, render: (_: any, record: any) => (
      <Space>
        <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
        <Button size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增物料</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={editingItem ? "编辑物料" : "新增物料"} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={700}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}><Form.Item name="material_code" label="物料编号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="material_name" label="物料名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="material_type" label="物料类型"><Select><Option value="standard">标准件</Option><Option value="custom">定制件</Option><Option value="consumable">消耗品</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="specs" label="规格"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit" label="单位"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="category" label="分类"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="safety_stock" label="安全库存"><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="min_stock" label="最小库存"><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="max_stock" label="最大库存"><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="standard_cost" label="标准成本"><Input type="number" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

// 库存管理组件
function StockManager() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      warehouseApi.stock.list({ page: 1, pageSize: 100 }),
      warehouseApi.stock.stats(),
    ]).then(([listRes, statsRes]) => {
      setData(listRes.data?.list || []);
      setStats(statsRes.data || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const columns = [
    { title: '物料', dataIndex: 'material_name' },
    { title: '仓库', dataIndex: 'warehouse_name', width: 100 },
    { title: '批次', dataIndex: 'batch_no', width: 120 },
    { title: '数量', dataIndex: 'stock_quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', width: 60 },
    { title: '单价', dataIndex: 'unit_price', width: 80 },
    { title: '库位', dataIndex: 'location', width: 80 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'available' ? 'green' : 'orange'}>{v}</Tag> },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="库存记录数" value={stats.total || 0} loading={loading} /></Card></Col>
        <Col span={6}><Card><Statistic title="总数量" value={stats.totalQty || 0} loading={loading} /></Card></Col>
      </Row>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
}

// 出库管理组件
function OutManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    warehouseApi.out.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    warehouseApi.warehouse.list({ page: 1, pageSize: 100 }).then((res: any) => setWarehouses(res.data?.list || []));
  }, []);

  const handleAdd = () => { form.resetFields(); setModalVisible(true); };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const warehouse = warehouses.find(w => w.id === values.warehouse_id) || {};
      warehouseApi.out.create({ ...values, out_no: 'OUT' + Date.now(), warehouse_name: warehouse.warehouse_name || '' }).then(() => {
        message.success('创建成功'); setModalVisible(false); loadData();
      });
    });
  };

  const columns = [
    { title: '出库单号', dataIndex: 'out_no', width: 140 },
    { title: '仓库', dataIndex: 'warehouse_name', width: 100 },
    { title: '去向', dataIndex: 'target_name' },
    { title: '金额', dataIndex: 'total_amount', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'pending' ? 'orange' : v === 'completed' ? 'green' : 'blue'}>{v}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => v?.split('T')[0] || '-' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增出库</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title="新增出库单" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}><Select>{warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.warehouse_name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="target_type" label="去向类型"><Select><Option value="production">生产领料</Option><Option value="sales">销售出库</Option><Option value="return">退货</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="target_name" label="去向名称"><Input /></Form.Item>
          <Form.Item name="total_amount" label="金额"><Input type="number" /></Form.Item>
          <Form.Item name="description" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 主组件
export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState('warehouse');

  return (
    <div>
      <Card title="仓库物料管理">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="仓库管理" key="warehouse"><WarehouseManager /></TabPane>
          <TabPane tab="物料管理" key="material"><MaterialManager /></TabPane>
          <TabPane tab="库存查询" key="stock"><StockManager /></TabPane>
          <TabPane tab="出库管理" key="out"><OutManager /></TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
