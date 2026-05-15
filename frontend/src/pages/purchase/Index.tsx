import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Statistic, Row, Col } from 'antd';
import { purchaseApi } from '../../api/purchase';
import { warehouseApi } from '../../api/warehouse';

const { Option } = Select;

// 供应商管理组件
function SupplierManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    purchaseApi.supplier.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => { setEditingItem(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingItem(record); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = (id: number) => {
    Modal.confirm({ title: '确认删除', onOk: () => purchaseApi.supplier.delete(id).then(() => { message.success('删除成功'); loadData(); })});
  };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const promise = editingItem ? purchaseApi.supplier.update(editingItem.id, values) : purchaseApi.supplier.create(values);
      promise.then(() => { message.success(editingItem ? '更新成功' : '创建成功'); setModalVisible(false); loadData(); });
    });
  };

  const columns = [
    { title: '编号', dataIndex: 'supplier_code', width: 100 },
    { title: '名称', dataIndex: 'supplier_name' },
    { title: '联系人', dataIndex: 'contact_person' },
    { title: '电话', dataIndex: 'contact_phone', width: 130 },
    { title: '信用等级', dataIndex: 'credit_level', width: 90, render: (v: string) => <Tag color={v === 'A' ? 'green' : v === 'B' ? 'orange' : 'red'}>{v}</Tag> },
    { title: '账期(天)', dataIndex: 'payment_days', width: 80 },
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
        <Button type="primary" onClick={handleAdd}>新增供应商</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={editingItem ? "编辑供应商" : "新增供应商"} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="supplier_code" label="供应商编号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="supplier_name" label="供应商名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contact_person" label="联系人"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="contact_phone" label="联系电话"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="credit_level" label="信用等级"><Select><Option value="A">A-优</Option><Option value="B">B-良</Option><Option value="C">C-一般</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="payment_days" label="账期(天)"><Input type="number" /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 采购申请组件
function PurchaseRequest() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    purchaseApi.request.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    purchaseApi.supplier.list({ page: 1, pageSize: 100 }).then((res: any) => setSuppliers(res.data?.list || []));
  }, []);

  const handleAdd = () => { form.resetFields(); setModalVisible(true); };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      purchaseApi.request.create({ ...values, request_no: 'PR' + Date.now() }).then(() => {
        message.success('创建成功'); setModalVisible(false); loadData();
      });
    });
  };

  const columns = [
    { title: '申请编号', dataIndex: 'request_no', width: 140 },
    { title: '标题', dataIndex: 'title' },
    { title: '供应商', dataIndex: 'supplier_name', width: 150 },
    { title: '金额', dataIndex: 'total_amount', width: 100 },
    { title: '类型', dataIndex: 'request_type', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'draft' ? 'default' : v === 'approved' ? 'green' : 'orange'}>{v}</Tag> },
    { title: '申请时间', dataIndex: 'created_at', width: 160, render: (v: string) => v?.split('T')[0] || '-' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增采购申请</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title="新增采购申请" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="申请标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="request_type" label="申请类型"><Select><Option value="standard">标准采购</Option><Option value="urgent">紧急采购</Option><Option value="project">项目采购</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="supplier_id" label="供应商"><Select><Select.Option value="">-- 选择供应商 --</Select.Option>{suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.supplier_name}</Select.Option>)}</Select></Form.Item></Col>
          </Row>
          <Form.Item name="total_amount" label="预估金额"><Input type="number" /></Form.Item>
          <Form.Item name="description" label="说明"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 采购订单组件
function PurchaseOrder() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    purchaseApi.order.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    purchaseApi.supplier.list({ page: 1, pageSize: 100 }).then((res: any) => setSuppliers(res.data?.list || []));
  }, []);

  const handleAdd = () => { form.resetFields(); setModalVisible(true); };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const supplier = suppliers.find(s => s.id === values.supplier_id) || {};
      purchaseApi.order.create({ ...values, order_no: 'PO' + Date.now(), supplier_name: supplier.supplier_name }).then(() => {
        message.success('创建成功'); setModalVisible(false); loadData();
      });
    });
  };

  const columns = [
    { title: '订单编号', dataIndex: 'order_no', width: 140 },
    { title: '供应商', dataIndex: 'supplier_name' },
    { title: '订单金额', dataIndex: 'total_amount', width: 100 },
    { title: '预期到货', dataIndex: 'expected_date', width: 120, render: (v: string) => v?.split('T')[0] || '-' },
    { title: '付款条件', dataIndex: 'payment_terms', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={{ pending: 'orange', confirmed: 'blue', shipped: 'cyan', received: 'green' }[v] || 'default'}>{v}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => v?.split('T')[0] || '-' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增采购订单</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title="新增采购订单" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="supplier_id" label="供应商" rules={[{ required: true }]}><Select>{suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.supplier_name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="total_amount" label="订单金额"><Input type="number" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="expected_date" label="预期到货日期"><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="payment_terms" label="付款条件"><Select><Option value="预付30%">预付30%</Option><Option value="货到付款">货到付款</Option><Option value="月结30天">月结30天</Option><Option value="月结60天">月结60天</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 采购入库组件
function PurchaseReceive() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [orders, setOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    purchaseApi.receive.list({ page: 1, pageSize: 100 }).then((res: any) => {
      setData(res.data?.list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    purchaseApi.order.list({ page: 1, pageSize: 100 }).then((res: any) => setOrders(res.data?.list || []));
    warehouseApi.warehouse.list({ page: 1, pageSize: 100 }).then((res: any) => setWarehouses(res.data?.list || []));
  }, []);

  const handleAdd = () => { form.resetFields(); setModalVisible(true); };
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const order = orders.find(o => o.id === values.order_id) || {};
      const warehouse = warehouses.find(w => w.id === values.warehouse_id) || {};
      purchaseApi.receive.create({ ...values, receive_no: 'IN' + Date.now(), supplier_name: order.supplier_name || '', warehouse_name: warehouse.warehouse_name || '' }).then(() => {
        message.success('创建成功'); setModalVisible(false); loadData();
      });
    });
  };

  const columns = [
    { title: '入库单号', dataIndex: 'receive_no', width: 140 },
    { title: '订单号', dataIndex: 'order_no', width: 140 },
    { title: '供应商', dataIndex: 'supplier_name' },
    { title: '仓库', dataIndex: 'warehouse_name', width: 100 },
    { title: '金额', dataIndex: 'total_amount', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'pending' ? 'orange' : 'green'}>{v}</Tag> },
    { title: '入库时间', dataIndex: 'created_at', width: 160, render: (v: string) => v?.split('T')[0] || '-' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增入库</Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title="新增采购入库" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="order_id" label="采购订单"><Select><Select.Option value="">-- 选择订单 --</Select.Option>{orders.map(o => <Select.Option key={o.id} value={o.id}>{o.order_no}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="warehouse_id" label="入库仓库"><Select>{warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.warehouse_name}</Select.Option>)}</Select></Form.Item></Col>
          </Row>
          <Form.Item name="total_amount" label="入库金额"><Input type="number" /></Form.Item>
          <Form.Item name="description" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 统计组件
function PurchaseStats() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      purchaseApi.supplier.list({ page: 1, pageSize: 1 }),
      purchaseApi.request.list({ page: 1, pageSize: 1 }),
      purchaseApi.order.list({ page: 1, pageSize: 1 }),
      purchaseApi.receive.list({ page: 1, pageSize: 1 }),
    ]).then(([s, r, o, i]) => {
      setStats({
        suppliers: s.data?.total || 0,
        requests: r.data?.total || 0,
        orders: o.data?.total || 0,
        receives: i.data?.total || 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Row gutter={16}>
      <Col span={6}><Card><Statistic title="供应商数" value={stats.suppliers} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="采购申请数" value={stats.requests} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="采购订单数" value={stats.orders} loading={loading} /></Card></Col>
      <Col span={6}><Card><Statistic title="入库单数" value={stats.receives} loading={loading} /></Card></Col>
    </Row>
  );
}

// 主组件
export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState('supplier');

  const tabs = [
    { key: 'supplier', label: '供应商管理' },
    { key: 'request', label: '采购申请' },
    { key: 'order', label: '采购订单' },
    { key: 'receive', label: '采购入库' },
  ];

  return (
    <div>
      <Card title="采购管理" extra={<Button onClick={() => setActiveTab('supplier')}>刷新</Button>}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {tabs.map(t => <Button key={t.key} type={activeTab === t.key ? 'primary' : 'default'} onClick={() => setActiveTab(t.key)}>{t.label}</Button>)}
        </div>
        <PurchaseStats />
      </Card>
      <Card style={{ marginTop: 16 }}>
        {activeTab === 'supplier' && <SupplierManager />}
        {activeTab === 'request' && <PurchaseRequest />}
        {activeTab === 'order' && <PurchaseOrder />}
        {activeTab === 'receive' && <PurchaseReceive />}
      </Card>
    </div>
  );
}
