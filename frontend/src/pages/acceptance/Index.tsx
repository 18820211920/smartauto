import { useState, useEffect } from 'react';
import { acceptApi } from '../../api/acceptance';

interface Item { id?: number; item_seq: number; item_name: string; check_standard: string; check_method: string; result: string; result_value: string; is_critical: boolean; remark: string; }
interface Accept { id: number; accept_no: string; project_name: string; customer_name: string; delivery_no: string; accept_type: string; accept_date: string; total_items: number; passed_items: number; pass_rate: number; overall_result: string; inspector_name: string; items?: Item[]; }

const resultMap: Record<string, string> = { pending: '待验收', pass: '合格', fail: '不合格', partial: '部分合格' };
const typeMap: Record<string, string> = { delivery: '到货验收', install: '安装验收', final: '终验' };

export default function AcceptancePage() {
  const [accepts, setAccepts] = useState<Accept[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentAccept, setCurrentAccept] = useState<Accept | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editItems, setEditItems] = useState<Item[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await acceptApi.list({ pageSize: 100 });
      setAccepts(res.data?.data?.list || []);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (item?: any) => {
    if (item?.id) {
      const res = await acceptApi.get(item.id);
      const data = res.data?.data;
      if (data) {
        setEditItem(data);
        setEditItems(data.items || []);
        setModalVisible(true);
      }
    } else {
      setEditItem({ accept_type: 'delivery', overall_result: 'pending' });
      setEditItems([]);
      setModalVisible(true);
    }
  };

  const handleView = async (item: Accept) => {
    const res = await acceptApi.get(item.id);
    setCurrentAccept(res.data?.data);
    setDetailVisible(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...editItem, items: editItems };
      if (editItem.id) await acceptApi.update(editItem.id, data);
      else await acceptApi.create(data);
      setModalVisible(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => { await acceptApi.delete(id); fetchData(); };
  const addItem = () => { setEditItems([...editItems, { item_seq: editItems.length + 1, item_name: '', check_standard: '', check_method: '', result: 'pending', result_value: '', is_critical: false, remark: '' }]); };
  const updateItem = (idx: number, field: string, value: any) => { const newItems = [...editItems]; (newItems[idx] as any)[field] = value; setEditItems(newItems); };
  const removeItem = (idx: number) => { setEditItems(editItems.filter((_, i) => i !== idx)); };

  const th = { padding: '10px 6px', textAlign: 'left' as const, fontWeight: 'bold', background: '#f5f5f5', fontSize: 13 };
  const td = { padding: '8px 6px', borderBottom: '1px solid #eee', fontSize: 13 };
  const fs = { marginBottom: 10 };
  const inp = { width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const };
  const overlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 50, zIndex: 1000, overflowY: 'auto' as const };
  const modal = { background: 'white', padding: 20, borderRadius: 8, width: 680, minHeight: 400 };

  return (
    <div style={{ padding: 20 }}>
      <h2>验收管理</h2>
      <div style={{ marginBottom: 12 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ 新建验收单</button></div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>单号</th><th style={th}>类型</th><th style={th}>项目</th><th style={th}>客户</th><th style={th}>日期</th><th style={th}>合格/总计</th><th style={th}>结果</th><th style={th}>验收人</th><th style={th}>操作</th></tr></thead>
        <tbody>
          {accepts.map(item => (
            <tr key={item.id}><td style={td}>{item.accept_no}</td><td style={td}>{typeMap[item.accept_type]}</td><td style={td}>{item.project_name}</td><td style={td}>{item.customer_name}</td>
              <td style={td}>{item.accept_date}</td><td style={td}>{item.passed_items}/{item.total_items}</td>
              <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, background: item.overall_result === 'pass' ? '#f6ffed' : item.overall_result === 'fail' ? '#fff2f0' : '#fff7e6', fontSize: 12 }}>{resultMap[item.overall_result]}</span></td>
              <td style={td}>{item.inspector_name}</td>
              <td style={td}><button onClick={() => handleView(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>查看</button><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalVisible && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 12px' }}>{editItem?.id ? '编辑' : '新建'}验收单</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>验收单号 *</label><input style={inp} value={editItem.accept_no || ''} onChange={e => setEditItem({...editItem, accept_no: e.target.value})} placeholder="ACC202501001" /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>验收类型</label><select style={inp} value={editItem.accept_type || 'delivery'} onChange={e => setEditItem({...editItem, accept_type: e.target.value})}><option value="delivery">到货验收</option><option value="install">安装验收</option><option value="final">终验</option></select></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>客户名称</label><input style={inp} value={editItem.customer_name || ''} onChange={e => setEditItem({...editItem, customer_name: e.target.value})} /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>发货单号</label><input style={inp} value={editItem.delivery_no || ''} onChange={e => setEditItem({...editItem, delivery_no: e.target.value})} /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>验收日期</label><input style={inp} type="date" value={editItem.accept_date || ''} onChange={e => setEditItem({...editItem, accept_date: e.target.value})} /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>验收人</label><input style={inp} value={editItem.inspector_name || ''} onChange={e => setEditItem({...editItem, inspector_name: e.target.value})} /></div>
              <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>验收结果</label><select style={inp} value={editItem.overall_result || 'pending'} onChange={e => setEditItem({...editItem, overall_result: e.target.value})}><option value="pending">待验收</option><option value="pass">合格</option><option value="fail">不合格</option><option value="partial">部分合格</option></select></div>
            </div>
            <div style={{ ...fs, marginTop: 10 }}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>备注</label><textarea style={{...inp, height: 50}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
            
            <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>验收项</strong>
                <button onClick={addItem} style={{ padding: '3px 10px', background: '#52c41a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>+ 添加</button>
              </div>
              {editItems.map((item, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 6, borderRadius: 4, background: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input style={{...inp, width: 50}} type="number" value={item.item_seq} onChange={e => updateItem(idx, 'item_seq', parseInt(e.target.value))} />
                    <input style={{...inp, flex: 1}} value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} placeholder="验收项名称" />
                    <select style={{...inp, width: 80}} value={item.result} onChange={e => updateItem(idx, 'result', e.target.value)}><option value="pending">待检</option><option value="pass">合格</option><option value="fail">不合格</option><option value="na">不适用</option></select>
                    <button onClick={() => removeItem(idx)} style={{ padding: '3px 6px', color: 'red', background: 'none', border: '1px solid red', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>删除</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input style={{...inp, flex: 1}} value={item.check_standard} onChange={e => updateItem(idx, 'check_standard', e.target.value)} placeholder="检验标准" />
                    <input style={{...inp, flex: 1}} value={item.check_method} onChange={e => updateItem(idx, 'check_method', e.target.value)} placeholder="检验方法" />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' as const }}>
              <button onClick={() => setModalVisible(false)} style={{ padding: '6px 14px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} style={{ padding: '6px 14px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {detailVisible && currentAccept && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 12px' }}>验收详情 - {currentAccept.accept_no}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div><strong>项目:</strong> {currentAccept.project_name}</div>
              <div><strong>客户:</strong> {currentAccept.customer_name}</div>
              <div><strong>类型:</strong> {typeMap[currentAccept.accept_type]}</div>
              <div><strong>日期:</strong> {currentAccept.accept_date}</div>
              <div><strong>验收人:</strong> {currentAccept.inspector_name}</div>
              <div><strong>结果:</strong> {resultMap[currentAccept.overall_result]}</div>
            </div>
            {currentAccept.items && currentAccept.items.length > 0 && (
              <>
                <h4 style={{ marginTop: 14, marginBottom: 6 }}>验收项</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{...th, width: 40}}>#</th><th style={th}>验收项</th><th style={th}>标准</th><th style={th}>方法</th><th style={th}>结果</th></tr></thead>
                  <tbody>
                    {currentAccept.items.map((item, idx) => (
                      <tr key={idx}><td style={td}>{item.item_seq}</td><td style={td}>{item.item_name}</td><td style={td}>{item.check_standard}</td><td style={td}>{item.check_method}</td>
                        <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, background: item.result === 'pass' ? '#f6ffed' : item.result === 'fail' ? '#fff2f0' : '#f5f5f5', fontSize: 12 }}>{item.result === 'pass' ? '合格' : item.result === 'fail' ? '不合格' : item.result === 'na' ? 'N/A' : '待检'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' as const }}>
              <button onClick={() => setDetailVisible(false)} style={{ padding: '6px 14px', cursor: 'pointer' }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
