import { useState, useEffect } from 'react';
import { finApi } from '../../api/finance';

interface Invoice { id: number; invoice_no: string; invoice_type: string; billing_type: string; project_name: string; customer_name: string; supplier_name: string; contract_no: string; invoice_date: string; tax_rate: number; amount: number; tax_amount: number; net_amount: number; status: string; }
interface Payment { id: number; payment_no: string; payment_type: string; category: string; project_name: string; customer_name: string; supplier_name: string; payment_date: string; amount: number; payment_method: string; recipient_name: string; status: string; approver_name: string; }
interface Expense { id: number; expense_no: string; project_name: string; applicant_name: string; department: string; expense_type: string; expense_date: string; amount: number; status: string; approver_name: string; }

const invoiceStatusMap: Record<string, string> = { issued: '已开', pending: '待开', voided: '已作废', received: '已收' };
const invoiceTypeMap: Record<string, string> = { vat: '增值税专票', invoice: '普通发票', receipt: '收据' };
const billingTypeMap: Record<string, string> = { sales: '销售', expense: '费用' };
const paymentStatusMap: Record<string, string> = { pending: '待审批', approved: '已审批', paid: '已支付', rejected: '已驳回', cancelled: '已取消' };
const expenseStatusMap: Record<string, string> = { draft: '草稿', submitted: '已提交', approved: '已审批', rejected: '已驳回', paid: '已报销' };

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('invoice');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoice') {
        const res = await finApi.invoice.list({ pageSize: 100 });
        setInvoices(res.data?.data?.list || []);
      } else if (activeTab === 'payment') {
        const res = await finApi.payment.list({ pageSize: 100 });
        setPayments(res.data?.data?.list || []);
      } else {
        const res = await finApi.expense.list({ pageSize: 100 });
        setExpenses(res.data?.data?.list || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = (item?: any) => {
    setEditItem(item || (activeTab === 'invoice' ? { invoice_type: 'vat', billing_type: 'sales', status: 'issued' } : activeTab === 'payment' ? { payment_type: 'expense', payment_method: 'bank', status: 'pending' } : { status: 'draft' }));
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      if (editItem.id) {
        if (activeTab === 'invoice') await finApi.invoice.update(editItem.id, editItem);
        else if (activeTab === 'payment') await finApi.payment.update(editItem.id, editItem);
        else await finApi.expense.update(editItem.id, editItem);
      } else {
        if (activeTab === 'invoice') await finApi.invoice.create(editItem);
        else if (activeTab === 'payment') await finApi.payment.create(editItem);
        else await finApi.expense.create(editItem);
      }
      setModalVisible(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (activeTab === 'invoice') await finApi.invoice.delete(id);
    else if (activeTab === 'payment') await finApi.payment.delete(id);
    else await finApi.expense.delete(id);
    fetchData();
  };

  const th = { padding: '10px 6px', textAlign: 'left' as const, fontWeight: 'bold', background: '#f5f5f5', fontSize: 12 };
  const td = { padding: '8px 6px', borderBottom: '1px solid #eee', fontSize: 12 };
  const fs = { marginBottom: 10 };
  const inp = { width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const };
  const overlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 50, zIndex: 1000, overflowY: 'auto' as const };
  const modal = { background: 'white', padding: 20, borderRadius: 8, width: 560, minHeight: 400 };

  return (
    <div style={{ padding: 20 }}>
      <h2>财务管理</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setActiveTab('invoice')} style={{ padding: '6px 14px', background: activeTab === 'invoice' ? '#1890ff' : '#f0f0f0', color: activeTab === 'invoice' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8, fontSize: 13 }}>发票管理</button>
        <button onClick={() => setActiveTab('payment')} style={{ padding: '6px 14px', background: activeTab === 'payment' ? '#1890ff' : '#f0f0f0', color: activeTab === 'payment' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8, fontSize: 13 }}>收付款</button>
        <button onClick={() => setActiveTab('expense')} style={{ padding: '6px 14px', background: activeTab === 'expense' ? '#1890ff' : '#f0f0f0', color: activeTab === 'expense' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>费用报销</button>
      </div>
      {loading ? <div>加载中...</div> : activeTab === 'invoice' && (
        <div>
          <div style={{ marginBottom: 12 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ 新建发票</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>发票号</th><th style={th}>类型</th><th style={th}>开票类别</th><th style={th}>项目</th><th style={th}>客户/供应商</th><th style={th}>日期</th><th style={th}>金额</th><th style={th}>税额</th><th style={th}>状态</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {invoices.map(item => (
                <tr key={item.id}><td style={td}>{item.invoice_no}</td><td style={td}>{invoiceTypeMap[item.invoice_type]}</td><td style={td}>{billingTypeMap[item.billing_type]}</td>
                  <td style={td}>{item.project_name}</td><td style={td}>{item.customer_name || item.supplier_name}</td><td style={td}>{item.invoice_date}</td>
                  <td style={td}>{item.amount?.toLocaleString()}</td><td style={td}>{item.tax_amount?.toLocaleString()}</td>
                  <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, background: item.status === 'issued' ? '#f6ffed' : '#fff7e6', fontSize: 11 }}>{invoiceStatusMap[item.status]}</span></td>
                  <td style={td}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'payment' && (
        <div>
          <div style={{ marginBottom: 12 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ 新建收付款</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>单号</th><th style={th}>类型</th><th style={th}>类别</th><th style={th}>项目</th><th style={th}>客户/供应商</th><th style={th}>日期</th><th style={th}>金额</th><th style={th}>方式</th><th style={th}>状态</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {payments.map(item => (
                <tr key={item.id}><td style={td}>{item.payment_no}</td><td style={td}>{item.payment_type === 'income' ? '收入' : '支出'}</td><td style={td}>{item.category}</td>
                  <td style={td}>{item.project_name}</td><td style={td}>{item.customer_name || item.supplier_name}</td><td style={td}>{item.payment_date}</td>
                  <td style={td}>{item.amount?.toLocaleString()}</td><td style={td}>{item.payment_method === 'bank' ? '银行' : item.payment_method === 'cash' ? '现金' : item.payment_method === 'wechat' ? '微信' : '支付宝'}</td>
                  <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, background: item.status === 'paid' ? '#f6ffed' : item.status === 'pending' ? '#e6f7ff' : '#f5f5f5', fontSize: 11 }}>{paymentStatusMap[item.status]}</span></td>
                  <td style={td}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading ? <div>加载中...</div> : activeTab === 'expense' && (
        <div>
          <div style={{ marginBottom: 12 }}><button onClick={() => handleCreate()} style={{ background: '#1890ff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ 新建报销</button></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>单号</th><th style={th}>项目</th><th style={th}>申请人</th><th style={th}>部门</th><th style={th}>费用类型</th><th style={th}>日期</th><th style={th}>金额</th><th style={th}>审批人</th><th style={th}>状态</th><th style={th}>操作</th></tr></thead>
            <tbody>
              {expenses.map(item => (
                <tr key={item.id}><td style={td}>{item.expense_no}</td><td style={td}>{item.project_name}</td><td style={td}>{item.applicant_name}</td>
                  <td style={td}>{item.department}</td><td style={td}>{item.expense_type}</td><td style={td}>{item.expense_date}</td>
                  <td style={td}>{item.amount?.toLocaleString()}</td><td style={td}>{item.approver_name}</td>
                  <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, background: item.status === 'approved' ? '#f6ffed' : item.status === 'paid' ? '#d9f7be' : '#e6f7ff', fontSize: 11 }}>{expenseStatusMap[item.status]}</span></td>
                  <td style={td}><button onClick={() => handleCreate(item)} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>编辑</button><button onClick={() => handleDelete(item.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalVisible && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 12px' }}>{editItem?.id ? '编辑' : '新建'}{activeTab === 'invoice' ? '发票' : activeTab === 'payment' ? '收付款' : '报销单'}</h3>
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {activeTab === 'invoice' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>发票号 *</label><input style={inp} value={editItem.invoice_no || ''} onChange={e => setEditItem({...editItem, invoice_no: e.target.value})} placeholder="INV202501001" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>发票类型</label><select style={inp} value={editItem.invoice_type || 'vat'} onChange={e => setEditItem({...editItem, invoice_type: e.target.value})}><option value="vat">增值税专票</option><option value="invoice">普通发票</option><option value="receipt">收据</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>开票类别</label><select style={inp} value={editItem.billing_type || 'sales'} onChange={e => setEditItem({...editItem, billing_type: e.target.value})}><option value="sales">销售</option><option value="expense">费用</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>客户名称</label><input style={inp} value={editItem.customer_name || ''} onChange={e => setEditItem({...editItem, customer_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>供应商</label><input style={inp} value={editItem.supplier_name || ''} onChange={e => setEditItem({...editItem, supplier_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>合同号</label><input style={inp} value={editItem.contract_no || ''} onChange={e => setEditItem({...editItem, contract_no: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>开票日期</label><input style={inp} type="date" value={editItem.invoice_date || ''} onChange={e => setEditItem({...editItem, invoice_date: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>税率</label><input style={inp} type="number" step="0.0001" value={editItem.tax_rate || 0} onChange={e => setEditItem({...editItem, tax_rate: parseFloat(e.target.value)})} placeholder="0.13" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>价税合计</label><input style={inp} type="number" value={editItem.amount || 0} onChange={e => setEditItem({...editItem, amount: parseFloat(e.target.value)})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>税额</label><input style={inp} type="number" value={editItem.tax_amount || 0} onChange={e => setEditItem({...editItem, tax_amount: parseFloat(e.target.value)})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>不含税金额</label><input style={inp} type="number" value={editItem.net_amount || 0} onChange={e => setEditItem({...editItem, net_amount: parseFloat(e.target.value)})} /></div>
                  </div>
                  <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>状态</label><select style={inp} value={editItem.status || 'issued'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="pending">待开</option><option value="issued">已开</option><option value="voided">已作废</option><option value="received">已收</option></select></div>
                  <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>备注</label><textarea style={{...inp, height: 50}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
              {activeTab === 'payment' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>付款单号 *</label><input style={inp} value={editItem.payment_no || ''} onChange={e => setEditItem({...editItem, payment_no: e.target.value})} placeholder="PAY202501001" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>类型</label><select style={inp} value={editItem.payment_type || 'expense'} onChange={e => setEditItem({...editItem, payment_type: e.target.value})}><option value="income">收入</option><option value="expense">支出</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>类别</label><input style={inp} value={editItem.category || ''} onChange={e => setEditItem({...editItem, category: e.target.value})} placeholder="如: 原材料采购/销售回款" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>客户名称</label><input style={inp} value={editItem.customer_name || ''} onChange={e => setEditItem({...editItem, customer_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>供应商</label><input style={inp} value={editItem.supplier_name || ''} onChange={e => setEditItem({...editItem, supplier_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>付款日期</label><input style={inp} type="date" value={editItem.payment_date || ''} onChange={e => setEditItem({...editItem, payment_date: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>金额</label><input style={inp} type="number" value={editItem.amount || 0} onChange={e => setEditItem({...editItem, amount: parseFloat(e.target.value)})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>付款方式</label><select style={inp} value={editItem.payment_method || 'bank'} onChange={e => setEditItem({...editItem, payment_method: e.target.value})}><option value="bank">银行转账</option><option value="cash">现金</option><option value="wechat">微信</option><option value="alipay">支付宝</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>收款人</label><input style={inp} value={editItem.recipient_name || ''} onChange={e => setEditItem({...editItem, recipient_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>状态</label><select style={inp} value={editItem.status || 'pending'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="pending">待审批</option><option value="approved">已审批</option><option value="paid">已支付</option><option value="rejected">已驳回</option><option value="cancelled">已取消</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>审批人</label><input style={inp} value={editItem.approver_name || ''} onChange={e => setEditItem({...editItem, approver_name: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>备注</label><textarea style={{...inp, height: 50}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
              {activeTab === 'expense' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>报销单号 *</label><input style={inp} value={editItem.expense_no || ''} onChange={e => setEditItem({...editItem, expense_no: e.target.value})} placeholder="EXP202501001" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>项目名称</label><input style={inp} value={editItem.project_name || ''} onChange={e => setEditItem({...editItem, project_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>申请人</label><input style={inp} value={editItem.applicant_name || ''} onChange={e => setEditItem({...editItem, applicant_name: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>部门</label><input style={inp} value={editItem.department || ''} onChange={e => setEditItem({...editItem, department: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>费用类型</label><input style={inp} value={editItem.expense_type || ''} onChange={e => setEditItem({...editItem, expense_type: e.target.value})} placeholder="差旅费/交通费/招待费" /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>费用日期</label><input style={inp} type="date" value={editItem.expense_date || ''} onChange={e => setEditItem({...editItem, expense_date: e.target.value})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>金额</label><input style={inp} type="number" value={editItem.amount || 0} onChange={e => setEditItem({...editItem, amount: parseFloat(e.target.value)})} /></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>状态</label><select style={inp} value={editItem.status || 'draft'} onChange={e => setEditItem({...editItem, status: e.target.value})}><option value="draft">草稿</option><option value="submitted">已提交</option><option value="approved">已审批</option><option value="rejected">已驳回</option><option value="paid">已报销</option></select></div>
                    <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>审批人</label><input style={inp} value={editItem.approver_name || ''} onChange={e => setEditItem({...editItem, approver_name: e.target.value})} /></div>
                  </div>
                  <div style={fs}><label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>说明</label><textarea style={{...inp, height: 50}} value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                </>
              )}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' as const }}>
              <button onClick={() => setModalVisible(false)} style={{ padding: '6px 14px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} style={{ padding: '6px 14px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
