import { useState, useEffect } from 'react';
import { logisticsApi } from '../../api/logistics';

interface Delivery { id: number; delivery_no: string; project_name: string; customer_name: string; delivery_type: string; receiver_name: string; receiver_phone: string; express_company: string; express_no: string; delivery_date: string; status: string; }
interface Installation { id: number; install_no: string; delivery_no: string; project_name: string; customer_name: string; install_address: string; contact_person: string; contact_phone: string; scheduled_date: string; scheduled_time: string; install_type: string; difficulty_level: number; estimated_hours: number; technician_name: string; status: string; }

const deliveryStatusMap: Record<string, string> = { draft: '草稿', confirmed: '已确认', shipped: '已发货', in_transit: '运输中', delivered: '已签收' };
const installStatusMap: Record<string, string> = { scheduled: '已预约', confirmed: '已确认', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('delivery');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'delivery') {
        const res = await logisticsApi.delivery.list({ pageSize: 100 });
        setDeliveries(res.data?.data?.list || []);
      } else {
        const res = await logisticsApi.installation.list({ pageSize: 100 });
        setInstallations(res.data?.data?.list || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = (item?: any) => {
    setEditItem(item || getDefaultItem());
    setModalVisible(true);
  };

  const getDefaultItem = () => {
    if (activeTab === 'delivery') return { delivery_type: 'self', status: 'draft' };
    return { install_type: 'standard', difficulty_level: 1, status: 'scheduled' };
  };

  const handleSave = async () => {
    try {
      if (editItem.id) {
        if (activeTab === 'delivery') await logisticsApi.delivery.update(editItem.id, editItem);
        else await logisticsApi.installation.update(editItem.id, editItem);
      } else {
        if (activeTab === 'delivery') await logisticsApi.delivery.create(editItem);
        else await logisticsApi.installation.create(editItem);
      }
      setModalVisible(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (activeTab === 'delivery') await logisticsApi.delivery.delete(id);
    else await logisticsApi.installation.delete(id);
    fetchData();
  };

  const th = { padding: '12px 8px', textAlign: 'left' as const, fontWeight: 'bold', background: '#f5f5f5' };
  const td = { padding: '10px 8px', borderBottom: '1px solid #eee' };
  const fs = { marginBottom: 12 };
  const inp = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const };
  const overlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modal = { background: 'white', padding: 24, borderRadius: 8, width: 500, maxHeight: '80vh', overflowY: 'auto' as const };

  return (
    <div style={{ padding: 24 }}>
      <h2>物流管理</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setActiveTab('delivery')} style={{ padding: '8px 16px', background: activeTab === 'delivery' ? '#1890ff' : '#f0f0f0', color: activeTab === 'delivery' ? 'white' : '#333', border: 'none', borderRadius: 4, marginRight: 8, cursor: 'pointer' }}>发货管理</button>
        <button onClick={() => setActiveTab('installation')} style={{ padding: '8px 16px', background: activeTab === 'installation' ? '#1890ff' : '#f0f0f0', color: activeTab === 'installation' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer' }}>安装服务</button>
      </div>
      {loading ? <div>加载中...</div> : activeTab === 'delivery' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建发货单</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>发货单号</th><th style={th}>项目</th><th style={th}>客户</th><th style={th}>方式</th><th style={th}>收货人</th><th style={th}>快递公司</th><th style={th}>快递单号</th><th style={th}>日期</th><th style={th}>状态</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {deliveries.map(item => (
                <tr key={item.id}><td style={td}>{item.delivery_no}</td><td style={td}>{item.project_name}</td><td style={td}>{item.customer_name}</td>
                  <td style={td}>{item.delivery_type === 'self' ? '自提' : item.delivery_type === 'express' ? '快递' : '物流'}</td>
                  <td style={td}>{item.receiver_name}</td><td style={td}>{item.express_company}</td><td style={td}>{item.express_no}</td><td style={td}>{item.delivery_date}</td>
                  <td style={td}><span style={{ padding: '2px 8px', borderRadius: 4, background: '#e6f7ff' }}>{deliveryStatusMap[item.status] || item.status}</span></td>
                  <td style={td}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'installation' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建安装单</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>安装单号</th><th style={th}>关联发货</th><th style={th}>项目</th><th style={th}>客户</th><th style={th}>地址</th><th style={th}>联系人</th><th style={th}>预约日期</th><th style={th}>技术员</th><th style={th}>状态</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {installations.map(item => (
                <tr key={item.id}><td style={td}>{item.install_no}</td><td style={td}>{item.delivery_no}</td><td style={td}>{item.project_name}</td><td style={td}>{item.customer_name}</td>
                  <td style={td}>{item.install_address}</td><td style={td}>{item.contact_person}</td><td style={td}>{item.scheduled_date}</td><td style={td}>{item.technician_name}</td>
                  <td style={td}><span style={{ padding: '2px 8px', borderRadius: 4, background: '#e6f7ff' }}>{installStatusMap[item.status] || item.status}</span></td>
                  <td style={td}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalVisible && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editItem?.id ? '编辑' : '新建'}{activeTab === 'delivery' ? '发货单' : '安装单'}</h3>
            <div style={{ marginTop: 16 }}>
              {activeTab === 'delivery' && (
                <>
                  <div style={fs}><label>发货单号 *</label><input style={inp} value={editItem.delivery_no || ''} onChange={e => setEditItem({...editItem, delivery_no: e.target.value})} placeholder="如: DEL202501001" /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>客户名称</label><input style={inp} value={editItem.customer_name || ''} onChange={e => setEditItem({...editItem, customer_name: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>发货方式</label><select style={inp} value={editItem.delivery_type || 'self'} onChange={e => setEditItem({...editItem, delivery_type: e.target.value})}><option value="self">自提</option><option value="express">快递</option><option value="logistics">物流</option></select></div>
                    <div style={{ ...fs, flex: 1 }}><label>发货日期</label><input style={inp} type="date" value={editItem.delivery_date || ''} onChange={e => setEditItem({...editItem, delivery_date: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>收货人</label><input style={inp} value={editItem.receiver_name || ''} onChange={e => setEditItem({...editItem, receiver_name: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>联系电话</label><input style={inp} value={editItem.receiver_phone || ''} onChange={e => setEditItem({...editItem, receiver_phone: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label>收货地址</label><input style={inp} value={editItem.receiver_address || ''} onChange={e => setEditItem({...editItem, receiver_address: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>快递公司</label><input style={inp} value={editItem.express_company || ''} onChange={e => setEditItem({...editItem, express_company: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>快递单号</label><input style={inp} value={editItem.express_no || ''} onChange={e => setEditItem({...editItem, express_no: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label>状态</label><select style={inp} value={editItem.status || 'draft'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="draft">草稿</option><option value="confirmed">已确认</option><option value="shipped">已发货</option><option value="in_transit">运输中</option><option value="delivered">已签收</option></select></div>
                  <div style={fs}><label>备注</label><textarea style={{...inp, height: 60}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
              {activeTab === 'installation' && (
                <>
                  <div style={fs}><label>安装单号 *</label><input style={inp} value={editItem.install_no || ''} onChange={e => setEditItem({...editItem, install_no: e.target.value})} placeholder="如: INS202501001" /></div>
                  <div style={fs}><label>关联发货单</label><input style={inp} value={editItem.delivery_no || ''} onChange={e => setEditItem({...editItem, delivery_no: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>客户名称</label><input style={inp} value={editItem.customer_name || ''} onChange={e => setEditItem({...editItem, customer_name: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label>安装地址</label><input style={inp} value={editItem.install_address || ''} onChange={e => setEditItem({...editItem, install_address: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>联系人</label><input style={inp} value={editItem.contact_person || ''} onChange={e => setEditItem({...editItem, contact_person: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>联系电话</label><input style={inp} value={editItem.contact_phone || ''} onChange={e => setEditItem({...editItem, contact_phone: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>预约日期</label><input style={inp} type="date" value={editItem.scheduled_date || ''} onChange={e => setEditItem({...editItem, scheduled_date: e.target.value})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>预约时段</label><input style={inp} value={editItem.scheduled_time || ''} onChange={e => setEditItem({...editItem, scheduled_time: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>安装类型</label><select style={inp} value={editItem.install_type || 'standard'} onChange={e => setEditItem({...editItem, install_type: e.target.value})}><option value="standard">标准安装</option><option value="complex">复杂安装</option></select></div>
                    <div style={{ ...fs, flex: 1 }}><label>难度等级</label><select style={inp} value={editItem.difficulty_level || 1} onChange={e => setEditItem({...editItem, difficulty_level: parseInt(e.target.value)})}><option value={1}>简单</option><option value={2}>一般</option><option value={3}>复杂</option></select></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...fs, flex: 1 }}><label>预计工时(h)</label><input style={inp} type="number" value={editItem.estimated_hours || 0} onChange={e => setEditItem({...editItem, estimated_hours: parseFloat(e.target.value)})} /></div>
                    <div style={{ ...fs, flex: 1 }}><label>技术员</label><input style={inp} value={editItem.technician_name || ''} onChange={e => setEditItem({...editItem, technician_name: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label>状态</label><select style={inp} value={editItem.status || 'scheduled'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="scheduled">已预约</option><option value="confirmed">已确认</option><option value="in_progress">进行中</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></div>
                  <div style={fs}><label>备注</label><textarea style={{...inp, height: 60}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
            </div>
            <div style={{ marginTop: 24, textAlign: 'right' as const }}>
              <button onClick={() => setModalVisible(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} style={{ padding: '8px 16px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
