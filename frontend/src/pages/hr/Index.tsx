import { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';

interface Employee { id: number; employee_no: string; name: string; gender: string; phone: string; email: string; department: string; position: string; role: string; entry_date: string; contract_start: string; contract_end: string; salary: number; education: string; status: string; }
interface Attendance { id: number; employee_id: number; employee_name: string; department: string; attendance_date: string; check_in_time: string; check_out_time: string; work_hours: number; late_minutes: number; early_minutes: number; overtime_hours: number; attendance_status: string; leave_type: string; leave_hours: number; }
interface Salary { id: number; salary_month: string; employee_id: number; employee_name: string; department: string; position: string; base_salary: number; post_salary: number; performance_salary: number; overtime_salary: number; bonus: number; deduction: number; social_security: number; housing_fund: number; personal_tax: number; net_salary: number; attendance_days: number; actual_days: number; payment_status: string; }

const statusMap: Record<string, string> = { active: '在职', on_job: '在岗', leave: '离职', trial: '试用期', dimission: '离职', normal: '正常', absent: '缺勤', late: '迟到', early: '早退', overtime: '加班', pending: '待发放', paid: '已发放' };

export default function HrPage() {
  const [activeTab, setActiveTab] = useState('employee');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => { fetchData(); }, [activeTab, salaryMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'employee') {
        const res = await hrApi.employee.list({ pageSize: 100 });
        setEmployees(res.data?.data?.list || []);
      } else if (activeTab === 'attendance') {
        const res = await hrApi.attendance.list({ pageSize: 100 });
        setAttendances(res.data?.data?.list || []);
      } else if (activeTab === 'salary') {
        const res = await hrApi.salary.list({ salary_month: salaryMonth, pageSize: 100 });
        setSalaries(res.data?.data?.list || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusColor = (s: string) => {
    if (['active', 'on_job', 'normal', 'paid'].includes(s)) return '#16a34a';
    if (['pending', 'trial'].includes(s)) return '#d97706';
    return '#dc2626';
  };

  const employeeColumns = [
    { key: 'name', label: '姓名' },
    { key: 'department', label: '部门' },
    { key: 'position', label: '职位' },
    { key: 'entry_date', label: '入职日期' },
    { key: 'salary', label: '薪资' },
    { key: 'status', label: '状态', render: (v: string) => <span style={{ color: getStatusColor(v), fontWeight: 500 }}>{statusMap[v] || v}</span> },
  ];

  const attendanceColumns = [
    { key: 'employee_name', label: '员工姓名' },
    { key: 'department', label: '部门' },
    { key: 'attendance_date', label: '考勤日期' },
    { key: 'check_in_time', label: '上班打卡' },
    { key: 'check_out_time', label: '下班打卡' },
    { key: 'work_hours', label: '工时' },
    { key: 'late_minutes', label: '迟到(分钟)' },
    { key: 'early_minutes', label: '早退(分钟)' },
    { key: 'attendance_status', label: '状态', render: (v: string) => <span style={{ color: getStatusColor(v), fontWeight: 500 }}>{statusMap[v] || v}</span> },
  ];

  const salaryColumns = [
    { key: 'employee_name', label: '员工姓名' },
    { key: 'department', label: '部门' },
    { key: 'position', label: '职位' },
    { key: 'base_salary', label: '基本工资' },
    { key: 'post_salary', label: '岗位工资' },
    { key: 'performance_salary', label: '绩效工资' },
    { key: 'net_salary', label: '实发工资', render: (v: number) => <strong style={{ color: '#2563eb' }}>{v?.toLocaleString()}</strong> },
    { key: 'payment_status', label: '发放状态', render: (v: string) => <span style={{ color: getStatusColor(v), fontWeight: 500 }}>{statusMap[v] || v}</span> },
  ];

  const renderTable = (data: any[], cols: any[]) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ background: '#f1f5f9' }}>
          {cols.map(c => <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>暂无数据</td></tr>
        ) : data.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
            {cols.map(c => <td key={c.key} style={{ padding: '10px 12px' }}>{c.render ? c.render(row[c.key]) : row[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>人事管理</h2>
        {activeTab === 'salary' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <button onClick={fetchData} style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>查询</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {[['employee', '员工管理'], ['attendance', '考勤记录'], ['salary', '工资管理']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === tab ? '#2563eb' : '#64748b', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer' }}>
            {label}{loading && <span style={{ fontSize: 10 }}>(刷新中...)</span>}
          </button>
        ))}
      </div>
      {activeTab === 'employee' && renderTable(employees, employeeColumns)}
      {activeTab === 'attendance' && renderTable(attendances, attendanceColumns)}
      {activeTab === 'salary' && renderTable(salaries, salaryColumns)}
    </div>
  );
}
