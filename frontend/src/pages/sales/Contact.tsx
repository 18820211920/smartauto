import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Pagination, AutoComplete } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { contactApi, customerApi } from '../../api/sales';

const genderMap: Record<string, string> = { male: '男', female: '女', unknown: '未知' };
const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
];

export default function ContactPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [, setCustomerId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);

  const loadCustomers = () => {
    customerApi.list({ page: 1, pageSize: 500 }).then((res: any) => {
      const list = res.data?.list || [];
      setCustomerList(list);
      setCustomerOptions(list.map((c: any) => ({ value: c.id, label: c.customer_name })));
    });
  };

  const loadData = (p = page, ps = pageSize, kw = keyword) => {
    setLoading(true);
    const params: any = { page: p, pageSize: ps };
    if (kw) params.keyword = kw;
    contactApi.list(params).then((res: any) => {
      if (res.code === 0) {
        setData(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); loadCustomers(); }, []);

  const handleSearch = () => loadData(1, pageSize, keyword);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      customer_id: record.customer_id,
      contact_name: record.contact_name,
      gender: record.gender,
      position: record.position,
      phone: record.phone,
      tel: record.tel,
      email: record.email,
      is_primary: record.is_primary === 1,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({ title: '确认删除该联系人?', onOk: () => {
      contactApi.delete(id).then(() => { message.success('删除成功'); loadData(); }).catch(() => message.error('删除失败'));
    }});
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const payload = { ...values, is_primary: values.is_primary ? 1 : 0 };
      const promise = editingRecord ? contactApi.update(editingRecord.id, payload) : contactApi.create(payload);
      promise.then(() => {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadData();
      }).catch((e: any) => message.error(e?.message || '操作失败'));
    });
  };

  const columns = [
    { title: '联系人姓名', dataIndex: 'contact_name', render: (v: string) => <strong>{v}</strong> },
    { title: '性别', dataIndex: 'gender', width: 70, render: (v: string) => <Tag>{genderMap[v] || v}</Tag> },
    { title: '职位', dataIndex: 'position', width: 100 },
    { title: '手机', dataIndex: 'phone', width: 130 },
    { title: '电话', dataIndex: 'tel', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 160 },
    { title: '默认', dataIndex: 'is_primary', width: 80, render: (v: number) => <Tag color={v === 1 ? 'green' : 'default'}>{v === 1 ? '是' : '否'}</Tag> },
    { title: '操作', width: 140, render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="联系人管理">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input placeholder="搜索姓名/手机" style={{ width: 180 }} value={keyword} onChange={e => setKeyword(e.target.value)} onPressEnter={handleSearch} prefix={<SearchOutlined />} />
          <AutoComplete style={{ width: 200 }} options={customerOptions} placeholder="筛选客户" onSearch={txt => setCustomerOptions(txt ? customerList.filter(c => c.customer_name.includes(txt)).map(c => ({ value: c.id, label: c.customer_name })) : customerList.map(c => ({ value: c.id, label: c.customer_name })))} onSelect={v => { setCustomerId(Number(v)); loadData(1, pageSize, keyword); }} onClear={() => setCustomerId(null)} allowClear />
          <Button onClick={handleSearch}>搜索</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增联系人</Button>
        </div>
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} size="small" scroll={{ x: 900 }} />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger showQuickJumper showTotal={t => '共 ' + t + ' 条'} onChange={(p, ps) => { setPage(p); setPageSize(ps || 20); loadData(p, ps || 20); }} />
        </div>
      </Card>
      <Modal title={editingRecord ? '编辑联系人' : '新增联系人'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="客户名称" rules={[{ required: true, message: '请选择客户' }]}>
            <AutoComplete options={customerOptions} placeholder="输入选择客户" onSearch={txt => setCustomerOptions(txt ? customerList.filter(c => c.customer_name.includes(txt)).map(c => ({ value: c.id, label: c.customer_name })) : customerList.map(c => ({ value: c.id, label: c.customer_name })))} />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人姓名" rules={[{ required: true, message: '请输入联系人姓名' }]}>
            <Input placeholder="请输入联系人姓名" maxLength={50} />
          </Form.Item>
          <Form.Item name="gender" label="性别" initialValue="unknown">
            <Select options={genderOptions} />
          </Form.Item>
          <Form.Item name="position" label="职位"><Input placeholder="职位" maxLength={50} /></Form.Item>
          <Form.Item name="phone" label="手机"><Input placeholder="手机" maxLength={20} /></Form.Item>
          <Form.Item name="tel" label="电话"><Input placeholder="电话" maxLength={20} /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input placeholder="邮箱" maxLength={100} /></Form.Item>
          <Form.Item name="is_primary" label="默认联系人" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
