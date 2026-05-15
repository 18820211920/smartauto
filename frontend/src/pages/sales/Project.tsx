import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Input, Space, Modal, Form, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import http from '../../api/http';

const statusMap: Record<string, { label: string; color: string }> = {
  'active': { label: '进行中', color: 'green' },
  'suspended': { label: '已暂停', color: 'orange' },
  'completed': { label: '已完成', color: 'blue' },
  'archived': { label: '已归档', color: 'default' },
};

export default function Project() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await http.get('/api/sales/project/list', { params: { page: 1, pageSize: 20 } });
      if (res.code === 0) {
        setData(res.data?.list || []);
        setTotal(res.data?.total || 0);
      }
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res: any = await http.delete(`/api/sales/project/${id}`);
      if (res.code === 0) { message.success('删除成功'); fetchData(); }
      else { message.error(res.message); }
    } catch (e: any) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res: any = editingRecord
        ? await http.put(`/api/sales/project/${editingRecord.id}`, values)
        : await http.post('/api/sales/project', values);
      if (res.code === 0 || res.code === 201) {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchData();
      } else {
        message.error(res.message);
      }
    } catch (e: any) { message.error(e.message); }
  };

  const columns = [
    { title: '编码', dataIndex: 'project_code', width: 120 },
    { title: '项目名称', dataIndex: 'project_name', render: (v: string) => <strong>{v}</strong> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => {
      const s = statusMap[v] || { label: v, color: 'default' };
      return <Tag color={s.color}>{s.label}</Tag>;
    }},
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card title="📋 项目管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建项目</Button>}>
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ total, pageSize: 20 }} />
      </Card>
      <Modal
        title={editingRecord ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="项目名称" name="project_name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" maxLength={200} />
          </Form.Item>
          <Form.Item label="项目编码" name="project_code" tooltip="不填则自动生成">
            <Input placeholder="PRJ开头，如PRJ2025001" />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="active">
            <Select options={Object.entries(statusMap).map(([v, s]) => ({ value: v, label: s.label }))} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="项目描述" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
