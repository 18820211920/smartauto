import { useState, useEffect } from 'react';
import { productionApi } from '../../api/production';

interface WorkOrder { id: number; workorder_no: string; workorder_name: string; product_name: string; quantity: number; completed_quantity: number; status: string; planned_start_date: string; planned_end_date: string; }
interface Process { id: number; workorder_id: number; process_seq: number; process_name: string; workstation_name: string; standard_hours: number; status: string; }
interface Report { id: number; report_no: string; workorder_no: string; process_name: string; reporter_name: string; quantity: number; qualified_quantity: number; working_hours: number; status: string; }
interface Schedule { id: number; schedule_no: string; schedule_date: string; workstation_name: string; shift: string; planned_hours: number; status: string; }

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  pending: { text: '待审核', color: 'orange' },
  planned: { text: '已排产', color: 'blue' },
  processing: { text: '生产中', color: 'processing' },
  approved: { text: '已审核', color: 'green' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
  confirmed: { text: '已确认', color: 'blue' },
  in_progress: { text: '进行中', color: 'processing' },
  rejected: { text: '已驳回', color: 'error' },
};

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('workorder');
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'workorder') {
        const res = await productionApi.workorder.list({ pageSize: 100 });
        setWorkorders(res.data?.data?.list || []);
      } else if (activeTab === 'process') {
        const res = await productionApi.process.list({ pageSize: 100 });
        setProcesses(res.data?.data?.list || []);
      } else if (activeTab === 'report') {
        const res = await productionApi.report.list({ pageSize: 100 });
        setReports(res.data?.data?.list || []);
      } else if (activeTab === 'schedule') {
        const res = await productionApi.schedule.list({ pageSize: 100 });
        setSchedules(res.data?.data?.list || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = (item?: any) => {
    setEditItem(item || getDefaultItem());
    setModalVisible(true);
  };

  const getDefaultItem = () => {
    if (activeTab === 'workorder') return { quantity: 1, unit: '台', priority: 2, status: 'draft' };
    if (activeTab === 'process') return { process_seq: 1, standard_hours: 1, quality_check: 1 };
    if (activeTab === 'report') return { quantity: 1, qualified_quantity: 1, report_type: 'normal' };
    if (activeTab === 'schedule') return { shift: 'day', planned_hours: 8, status: 'draft' };
    return {};
  };

  const handleSave = async () => {
    try {
      if (editItem.id) {
        if (activeTab === 'workorder') await productionApi.workorder.update(editItem.id, editItem);
        if (activeTab === 'process') await productionApi.process.update(editItem.id, editItem);
        if (activeTab === 'schedule') await productionApi.schedule.update(editItem.id, editItem);
      } else {
        if (activeTab === 'workorder') await productionApi.workorder.create(editItem);
        if (activeTab === 'process') await productionApi.process.create(editItem);
        if (activeTab === 'report') await productionApi.report.create(editItem);
        if (activeTab === 'schedule') await productionApi.schedule.create(editItem);
      }
      setModalVisible(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (activeTab === 'workorder') await productionApi.workorder.delete(id);
    fetchData();
  };

  const handleApprove = async (id: number) => {
    await productionApi.report.approve(id, {});
    fetchData();
  };

  const thStyle = { padding: '12px 8px', textAlign: 'left' as const, fontWeight: 'bold' };
  const tdStyle = { padding: '10px 8px' };
  const formGroup = { marginBottom: 12 };
  const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const };
  const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalContent = { background: 'white', padding: 24, borderRadius: 8, width: 500, maxHeight: '80vh', overflowY: 'auto' as const };

  return (
    <div style={{ padding: 24 }}>
      <h2>生产管理</h2>
      <div style={{ marginBottom: 16 }}>
        <button className={activeTab === 'workorder' ? 'tab active' : 'tab'} onClick={() => setActiveTab('workorder')} style={{ background: activeTab === 'workorder' ? '#1890ff' : '#f0f0f0', color: activeTab === 'workorder' ? 'white' : '#333', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>工单管理</button>
        <button className={activeTab === 'process' ? 'tab active' : 'tab'} onClick={() => setActiveTab('process')} style={{ background: activeTab === 'process' ? '#1890ff' : '#f0f0f0', color: activeTab === 'process' ? 'white' : '#333', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>工序管理</button>
        <button className={activeTab === 'report' ? 'tab active' : 'tab'} onClick={() => setActiveTab('report')} style={{ background: activeTab === 'report' ? '#1890ff' : '#f0f0f0', color: activeTab === 'report' ? 'white' : '#333', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>报工管理</button>
        <button className={activeTab === 'schedule' ? 'tab active' : 'tab'} onClick={() => setActiveTab('schedule')} style={{ background: activeTab === 'schedule' ? '#1890ff' : '#f0f0f0', color: activeTab === 'schedule' ? 'white' : '#333', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>排产管理</button>
      </div>
      {loading ? <div>加载中...</div> : activeTab === 'workorder' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建工单</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f5f5f5' }}><th style={thStyle}>工单编号</th><th style={thStyle}>工单名称</th><th style={thStyle}>产品</th><th style={thStyle}>数量</th><th style={thStyle}>状态</th><th style={thStyle}>计划日期</th><th style={thStyle}>操作</th></tr></thead>
            <tbody>
              {workorders.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{item.workorder_no}</td>
                  <td style={tdStyle}>{item.workorder_name}</td>
                  <td style={tdStyle}>{item.product_name}</td>
                  <td style={tdStyle}>{item.quantity}/{item.completed_quantity}</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, background: item.status === 'completed' ? '#f6ffed' : '#e6f7ff', color: '#333' }}>{statusMap[item.status]?.text || item.status}</span></td>
                  <td style={tdStyle}>{item.planned_start_date} ~ {item.planned_end_date}</td>
                  <td style={tdStyle}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'process' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建工序</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f5f5f5' }}><th style={thStyle}>序号</th><th style={thStyle}>工序名称</th><th style={thStyle}>工作站</th><th style={thStyle}>标准工时</th><th style={thStyle}>状态</th><th style={thStyle}>操作</th></tr></thead>
            <tbody>
              {processes.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{item.process_seq}</td>
                  <td style={tdStyle}>{item.process_name}</td>
                  <td style={tdStyle}>{item.workstation_name}</td>
                  <td style={tdStyle}>{item.standard_hours}h</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, background: item.status === 'completed' ? '#f6ffed' : '#e6f7ff', color: '#333' }}>{item.status === 'completed' ? '已完成' : item.status === 'running' ? '进行中' : '待生产'}</span></td>
                  <td style={tdStyle}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'report' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建报工</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f5f5f5' }}><th style={thStyle}>报工单号</th><th style={thStyle}>工单编号</th><th style={thStyle}>工序</th><th style={thStyle}>报工人</th><th style={thStyle}>合格数量</th><th style={thStyle}>工时</th><th style={thStyle}>状态</th><th style={thStyle}>操作</th></tr></thead>
            <tbody>
              {reports.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{item.report_no}</td>
                  <td style={tdStyle}>{item.workorder_no}</td>
                  <td style={tdStyle}>{item.process_name}</td>
                  <td style={tdStyle}>{item.reporter_name}</td>
                  <td style={tdStyle}>{item.qualified_quantity}/{item.quantity}</td>
                  <td style={tdStyle}>{item.working_hours}h</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, background: item.status === 'approved' ? '#f6ffed' : '#fff7e6', color: '#333' }}>{statusMap[item.status]?.text || item.status}</span></td>
                  <td style={tdStyle}>{item.status === 'pending' && <button onClick={() => handleApprove(item.id)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>审核</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'schedule' && (
        <div>
          <div style={{ marginBottom: 16 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 新建排产</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f5f5f5' }}><th style={thStyle}>排产单号</th><th style={thStyle}>排产日期</th><th style={thStyle}>工作站</th><th style={thStyle}>班次</th><th style={thStyle}>计划工时</th><th style={thStyle}>状态</th><th style={thStyle}>操作</th></tr></thead>
            <tbody>
              {schedules.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{item.schedule_no}</td>
                  <td style={tdStyle}>{item.schedule_date}</td>
                  <td style={tdStyle}>{item.workstation_name}</td>
                  <td style={tdStyle}>{item.shift === 'day' ? '白班' : '夜班'}</td>
                  <td style={tdStyle}>{item.planned_hours}h</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, background: '#e6f7ff', color: '#333' }}>{statusMap[item.status]?.text || item.status}</span></td>
                  <td style={tdStyle}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>编辑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalVisible && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editItem?.id ? '编辑' : '新建'}{activeTab === 'workorder' ? '工单' : activeTab === 'process' ? '工序' : activeTab === 'report' ? '报工' : '排产'}</h3>
            <div style={{ marginTop: 16 }}>
              {activeTab === 'workorder' && (
                <>
                  <div style={formGroup}><label>工单编号 *</label><input style={inputStyle} value={editItem.workorder_no || ''} onChange={e => setEditItem({...editItem, workorder_no: e.target.value})} placeholder="如: WO202501001" /></div>
                  <div style={formGroup}><label>工单名称 *</label><input style={inputStyle} value={editItem.workorder_name || ''} onChange={e => setEditItem({...editItem, workorder_name: e.target.value})} /></div>
                  <div style={formGroup}><label>产品名称</label><input style={inputStyle} value={editItem.product_name || ''} onChange={e => setEditItem({...editItem, product_name: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>数量</label><input style={inputStyle} type="number" value={editItem.quantity || 0} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} /></div>
                    <div style={formGroup}><label>单位</label><input style={inputStyle} value={editItem.unit || '台'} onChange={e => setEditItem({...editItem, unit: e.target.value})} /></div>
                    <div style={formGroup}><label>优先级</label><select style={inputStyle} value={editItem.priority || 2} onChange={e => setEditItem({...editItem, priority: parseInt(e.target.value)})}><option value={1}>紧急</option><option value={2}>普通</option><option value={3}>低</option></select></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>计划开始</label><input style={inputStyle} type="date" value={editItem.planned_start_date || ''} onChange={e => setEditItem({...editItem, planned_start_date: e.target.value})} /></div>
                    <div style={formGroup}><label>计划结束</label><input style={inputStyle} type="date" value={editItem.planned_end_date || ''} onChange={e => setEditItem({...editItem, planned_end_date: e.target.value})} /></div>
                  </div>
                  <div style={formGroup}><label>状态</label><select style={inputStyle} value={editItem.status || 'draft'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="draft">草稿</option><option value="planned">已排产</option><option value="processing">生产中</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></div>
                  <div style={formGroup}><label>备注</label><textarea style={{...inputStyle, height: 60}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
              {activeTab === 'process' && (
                <>
                  <div style={formGroup}><label>工序名称 *</label><input style={inputStyle} value={editItem.process_name || ''} onChange={e => setEditItem({...editItem, process_name: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>序号</label><input style={inputStyle} type="number" value={editItem.process_seq || 1} onChange={e => setEditItem({...editItem, process_seq: parseInt(e.target.value)})} /></div>
                    <div style={formGroup}><label>工作站</label><input style={inputStyle} value={editItem.workstation_name || ''} onChange={e => setEditItem({...editItem, workstation_name: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>标准工时(h)</label><input style={inputStyle} type="number" value={editItem.standard_hours || 0} onChange={e => setEditItem({...editItem, standard_hours: parseFloat(e.target.value)})} /></div>
                    <div style={formGroup}><label>状态</label><select style={inputStyle} value={editItem.status || 'pending'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="pending">待生产</option><option value="running">进行中</option><option value="completed">已完成</option></select></div>
                  </div>
                </>
              )}
              {activeTab === 'report' && (
                <>
                  <div style={formGroup}><label>报工单号 *</label><input style={inputStyle} value={editItem.report_no || ''} onChange={e => setEditItem({...editItem, report_no: e.target.value})} placeholder="如: REP202501001" /></div>
                  <div style={formGroup}><label>工单编号 *</label><input style={inputStyle} value={editItem.workorder_no || ''} onChange={e => setEditItem({...editItem, workorder_no: e.target.value})} /></div>
                  <div style={formGroup}><label>工序名称</label><input style={inputStyle} value={editItem.process_name || ''} onChange={e => setEditItem({...editItem, process_name: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>报工数量</label><input style={inputStyle} type="number" value={editItem.quantity || 0} onChange={e => setEditItem({...editItem, quantity: parseInt(e.target.value)})} /></div>
                    <div style={formGroup}><label>合格数量</label><input style={inputStyle} type="number" value={editItem.qualified_quantity || 0} onChange={e => setEditItem({...editItem, qualified_quantity: parseInt(e.target.value)})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>工时(h)</label><input style={inputStyle} type="number" value={editItem.working_hours || 0} onChange={e => setEditItem({...editItem, working_hours: parseFloat(e.target.value)})} /></div>
                    <div style={formGroup}><label>报工类型</label><select style={inputStyle} value={editItem.report_type || 'normal'} onChange={e => setEditItem({...editItem, report_type: e.target.value})}><option value="normal">正常</option><option value="rework">返工</option><option value="maintenance">保养</option></select></div>
                  </div>
                </>
              )}
              {activeTab === 'schedule' && (
                <>
                  <div style={formGroup}><label>排产单号 *</label><input style={inputStyle} value={editItem.schedule_no || ''} onChange={e => setEditItem({...editItem, schedule_no: e.target.value})} placeholder="如: SCH202501001" /></div>
                  <div style={formGroup}><label>排产日期 *</label><input style={inputStyle} type="date" value={editItem.schedule_date || ''} onChange={e => setEditItem({...editItem, schedule_date: e.target.value})} /></div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>工作站</label><input style={inputStyle} value={editItem.workstation_name || ''} onChange={e => setEditItem({...editItem, workstation_name: e.target.value})} /></div>
                    <div style={formGroup}><label>班次</label><select style={inputStyle} value={editItem.shift || 'day'} onChange={e => setEditItem({...editItem, shift: e.target.value})}><option value="day">白班</option><option value="night">夜班</option></select></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={formGroup}><label>计划工时(h)</label><input style={inputStyle} type="number" value={editItem.planned_hours || 0} onChange={e => setEditItem({...editItem, planned_hours: parseFloat(e.target.value)})} /></div>
                    <div style={formGroup}><label>状态</label><select style={inputStyle} value={editItem.status || 'draft'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="draft">草稿</option><option value="confirmed">已确认</option><option value="in_progress">进行中</option><option value="completed">已完成</option></select></div>
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: 24, textAlign: 'right' as const }}>
              <button onClick={() => setModalVisible(false)} style={{ padding: '8px 16px', marginRight: 8, cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} style={{ padding: '8px 16px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
