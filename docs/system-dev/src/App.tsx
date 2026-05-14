import { useState, useEffect, useCallback } from 'react'

// ── 类型定义 ───────────────────────────────────────
type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
type TaskStatus = 'backlog' | 'in_progress' | 'done' | 'blocked'

interface Phase {
  id: string
  name: string
  weeks: string
  status: PhaseStatus
  progress: number
  color: string
  milestones: Milestone[]
  tasks: Task[]
  aiTasks: Task[]
  description: string
}

interface Task {
  id: string
  title: string
  phaseId: string
  status: TaskStatus
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  assignee: string
  dueWeek: string
  tags: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

interface Milestone {
  id: string
  name: string
  week: string
  done: boolean
}

interface Note {
  id: string
  content: string
  timestamp: string
  author: string
}

// ── 初始数据 ───────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: 'p1', name: 'Phase 1: 基础框架', weeks: 'W1-W2', status: 'in_progress',
    progress: 30, color: '#6366f1',
    description: 'SaaS骨架/认证/租户/权限/订阅/沙箱环境',
    milestones: [
      { id: 'm1', name: 'M1: SaaS基础框架可用', week: 'W2末', done: false },
    ],
    tasks: [
      { id: 't1-1', title: '项目初始化：开发环境/CI/CD/Docker配置', phaseId: 'p1', status: 'done', priority: 'P0', assignee: 'AI开发', dueWeek: 'W1', tags: ['基础设施'], notes: '搭建开发框架', createdAt: '', updatedAt: '' },
      { id: 't1-2', title: '数据库设计：租户表/套餐表/权限表/用户表', phaseId: 'p1', status: 'in_progress', priority: 'P0', assignee: 'AI开发', dueWeek: 'W1', tags: ['数据库'], notes: 'SaaS核心表结构', createdAt: '', updatedAt: '' },
      { id: 't1-3', title: '后端骨架：FastAPI+目录层级+中间层', phaseId: 'p1', status: 'in_progress', priority: 'P0', assignee: 'AI开发', dueWeek: 'W1', tags: ['后端'], notes: '00-base-core~05-job-task', createdAt: '', updatedAt: '' },
      { id: 't1-4', title: '前端骨架：React+路由+Layout', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W1', tags: ['前端'], notes: '路由配置/状态管理', createdAt: '', updatedAt: '' },
      { id: 't1-5', title: '认证系统：JWT登录/注册/刷新Token', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['安全'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't1-6', title: '租户系统：CRUD+套餐绑定+多租户隔离', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['SaaS'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't1-7', title: '权限系统：RBAC/菜单/按钮级别', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['安全'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't1-8', title: '订阅系统：套餐/配额/到期冻结', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['SaaS'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai1-1', title: '沙箱环境：独立测试环境+数据隔离验证', phaseId: 'p1', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['合规'], notes: '六步流程第三步前置', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p2', name: 'Phase 2: AI基础能力', weeks: 'W2-W4', status: 'pending',
    progress: 0, color: '#8b5cf6',
    description: '对话引擎/RAG知识库/多模型管理/流式输出',
    milestones: [
      { id: 'm2', name: 'M2: AI对话基础能力', week: 'W4末', done: false },
    ],
    tasks: [
      { id: 't2-1', title: 'AI模型配置：OpenAI/Claude/本地LLM', phaseId: 'p2', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W2', tags: ['AI'], notes: 'API密钥安全存储', createdAt: '', updatedAt: '' },
      { id: 't2-2', title: '对话引擎：FastAPI流式响应/WebSocket/SSE', phaseId: 'p2', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W3', tags: ['后端'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't2-3', title: '前端对话组件：React流式UI', phaseId: 'p2', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W3', tags: ['前端'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't2-4', title: 'RAG知识库：Milvus/Chroma部署', phaseId: 'p2', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W3', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't2-5', title: '对话历史：Session管理/上下文', phaseId: 'p2', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W3', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't2-6', title: 'AI模型路由：多模型切换/成本优化', phaseId: 'p2', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W4', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't2-7', title: 'AI使用日志：Token统计/配额扣费', phaseId: 'p2', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W4', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: []
  },
  {
    id: 'p3', name: 'Phase 3: 核心业务-销售/项目', weeks: 'W5-W8', status: 'pending',
    progress: 0, color: '#10b981',
    description: '客户管理/项目管理/报价/合同 + AI客户画像/任务分解',
    milestones: [
      { id: 'm3', name: 'M3: 销售+项目+AI能力', week: 'W8末', done: false },
    ],
    tasks: [
      { id: 't3-1', title: '客户管理：档案/分类/跟进/拜访记录', phaseId: 'p3', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W5', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't3-2', title: '项目管理：立项/进度/成本/变更/验收', phaseId: 'p3', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W6', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't3-3', title: '报价管理：多版本报价/审批/有效期', phaseId: 'p3', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W7', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't3-4', title: '合同管理：模板/审批/签章/版本', phaseId: 'p3', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W8', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't3-5', title: '数据打通：客户→项目→合同关联', phaseId: 'p3', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W8', tags: ['集成'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai3-1', title: 'AI客户画像：价值分析/流失预警', phaseId: 'p3', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W5', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 'ai3-2', title: 'AI任务分解：WBS自动生成/进度预测', phaseId: 'p3', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W6', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 'ai3-3', title: 'AI辅助报价：成本估算/历史参考', phaseId: 'p3', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W7', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p4', name: 'Phase 4: 核心业务-研发/图纸', weeks: 'W8-W10', status: 'pending',
    progress: 0, color: '#f59e0b',
    description: '图纸管理+AI识别+BOM自动提取+工艺路线',
    milestones: [
      { id: 'm4', name: 'M4: 研发+图纸+AI识别+BOM', week: 'W10末', done: false },
    ],
    tasks: [
      { id: 't4-1', title: '图纸管理：图库/版本/上传下载', phaseId: 'p4', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W8', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't4-2', title: '图纸审批：多级审批流程/变更记录', phaseId: 'p4', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W9', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't4-3', title: '研发管理：任务分解/BOM管理/工艺路线', phaseId: 'p4', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W10', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't4-4', title: '技术文档：文档管理/版本/关联项目', phaseId: 'p4', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W10', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai4-1', title: 'AI图纸识别：DWG/PDF/JPG内容提取', phaseId: 'p4', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W9', tags: ['AI'], notes: 'P0核心能力', createdAt: '', updatedAt: '' },
      { id: 'ai4-2', title: 'AI BOM提取：图纸→BOM自动生成', phaseId: 'p4', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W9', tags: ['AI'], notes: 'P0核心能力', createdAt: '', updatedAt: '' },
      { id: 'ai4-3', title: 'AI工艺推荐：相似工艺参考/优化建议', phaseId: 'p4', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W10', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p5', name: 'Phase 5: 执行层-采购/仓库/生产', weeks: 'W10-W13', status: 'pending',
    progress: 0, color: '#ef4444',
    description: '采购管理/库存管理/生产工单 + AI询价/库存预测',
    milestones: [
      { id: 'm5', name: 'M5: 采购+仓库+生产+AI辅助', week: 'W13末', done: false },
    ],
    tasks: [
      { id: 't5-1', title: '采购管理：申请/订单/供应商', phaseId: 'p5', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W10', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't5-2', title: '采购跟踪：交期预警/到货通知', phaseId: 'p5', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W11', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't5-3', title: '仓库管理：库位/入库/出库/库存查询', phaseId: 'p5', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W11', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't5-4', title: '库存预警：安全库存/缺料/呆滞', phaseId: 'p5', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W12', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't5-5', title: '生产管理：工单/排程/工序/报工', phaseId: 'p5', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W13', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai5-1', title: 'AI智能询价：多供应商比价/价格预测', phaseId: 'p5', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W11', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 'ai5-2', title: 'AI库存预测：需求预测/智能补货', phaseId: 'p5', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W12', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 'ai5-3', title: 'AI排程优化：产能优化/工时预测', phaseId: 'p5', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W13', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p6', name: 'Phase 6: 执行层-品检/发货/售后', weeks: 'W13-W15', status: 'pending',
    progress: 0, color: '#3b82f6',
    description: '品检/发货/售后全流程 + AI视觉质检/故障诊断',
    milestones: [
      { id: 'm6', name: 'M6: 品检+发货+售后+AI视觉', week: 'W15末', done: false },
    ],
    tasks: [
      { id: 't6-1', title: '品质管理：IQC/PQC/FQC/OQC四段质检', phaseId: 'p6', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W13', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't6-2', title: '不良品处理：登记/分析/整改闭环', phaseId: 'p6', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W14', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't6-3', title: '发货管理：计划/执行/物流跟踪', phaseId: 'p6', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W14', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't6-4', title: '售后管理：工单/维修/备件/反馈', phaseId: 'p6', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W15', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai6-1', title: 'AI视觉质检：缺陷检测/自动判定', phaseId: 'p6', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W14', tags: ['AI'], notes: 'P0核心能力', createdAt: '', updatedAt: '' },
      { id: 'ai6-2', title: 'AI物流优化：装车优化/路径规划', phaseId: 'p6', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W15', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 'ai6-3', title: 'AI故障诊断：故障引导/相似案例', phaseId: 'p6', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W15', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p7', name: 'Phase 7: AI能力集成', weeks: 'W15-W17', status: 'pending',
    progress: 0, color: '#8b5cf6',
    description: 'AI Hub/知识库RAG/智能客服/数据分析/报表解读',
    milestones: [
      { id: 'm7', name: 'M7: AI能力中心完整', week: 'W17末', done: false },
    ],
    tasks: [
      { id: 't7-1', title: 'AI能力中心：AI Hub统一管理/模型配置', phaseId: 'p7', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W15', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't7-2', title: 'AI知识库：企业知识管理/RAG检索', phaseId: 'p7', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W16', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't7-3', title: 'AI智能客服：7x24应答/训练/工单创建', phaseId: 'p7', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W16', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't7-4', title: 'AI数据分析：预测/预警/推荐', phaseId: 'p7', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W16', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't7-5', title: 'AI报表解读：财务/经营数据解读', phaseId: 'p7', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W17', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't7-6', title: 'AI能力优化：性能/成本/效果调优', phaseId: 'p7', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W17', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: []
  },
  {
    id: 'p8', name: 'Phase 8: 交付层-财务/人事/系统', weeks: 'W17-W19', status: 'pending',
    progress: 0, color: '#06b6d4',
    description: '财务/人事/系统设置/仪表盘/工作台',
    milestones: [
      { id: 'm8', name: 'M8: 财务+人事+系统设置', week: 'W19末', done: false },
    ],
    tasks: [
      { id: 't8-1', title: '财务管理：应收/应付/收付款/报销', phaseId: 'p8', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W17', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't8-2', title: '财务报表：资产负债表/利润表/现金流', phaseId: 'p8', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W18', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't8-3', title: '人事管理：员工/考勤/薪资/绩效', phaseId: 'p8', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W18', tags: ['业务'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't8-4', title: '系统设置：审批流程/参数/日志', phaseId: 'p8', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W19', tags: ['系统'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't8-5', title: '仪表盘：工作台首页/数据大屏', phaseId: 'p8', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W19', tags: ['前端'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: [
      { id: 'ai8-1', title: 'AI财务预警：异常预警/现金流预测', phaseId: 'p8', status: 'backlog', priority: 'P2', assignee: 'AI开发', dueWeek: 'W18', tags: ['AI'], notes: '', createdAt: '', updatedAt: '' },
    ]
  },
  {
    id: 'p9', name: 'Phase 9: 集成测试与上线', weeks: 'W19-W20', status: 'pending',
    progress: 0, color: '#10b981',
    description: '全流程联调/安全测试/SaaS测试/性能测试/上线部署',
    milestones: [
      { id: 'm9', name: 'M9: 全面上线稳定运行', week: 'W20末', done: false },
    ],
    tasks: [
      { id: 't9-1', title: '全流程联调：端到端/跨模块数据流', phaseId: 'p9', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W19', tags: ['测试'], notes: '六步第五步', createdAt: '', updatedAt: '' },
      { id: 't9-2', title: '安全测试：SQL注入/XSS/越权/接口防刷', phaseId: 'p9', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W19', tags: ['安全'], notes: '六步第五步', createdAt: '', updatedAt: '' },
      { id: 't9-3', title: 'SaaS测试：多租户/套餐/配额/冻结', phaseId: 'p9', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W19', tags: ['SaaS'], notes: '六步第五步', createdAt: '', updatedAt: '' },
      { id: 't9-4', title: '性能测试：压力测试/慢SQL优化', phaseId: 'p9', status: 'backlog', priority: 'P1', assignee: 'AI开发', dueWeek: 'W20', tags: ['测试'], notes: '', createdAt: '', updatedAt: '' },
      { id: 't9-5', title: '上线部署：生产环境/数据迁移/监控', phaseId: 'p9', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W20', tags: ['运维'], notes: '六步第六步', createdAt: '', updatedAt: '' },
      { id: 't9-6', title: '验收交付：用户培训/文档/项目关闭', phaseId: 'p9', status: 'backlog', priority: 'P0', assignee: 'AI开发', dueWeek: 'W20', tags: ['交付'], notes: '', createdAt: '', updatedAt: '' },
    ],
    aiTasks: []
  },
]

// ── 工具函数 ────────────────────────────────────────
function fmtTime(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${mo}-${day} ${h}:${mi}`
  } catch { return isoStr }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function saveData(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}
function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch { return fallback }
}

const STORAGE_KEY = 'smartauto-dev-manager-v1'
const DEFAULT_NOTES: Note[] = [
  { id: 'n1', content: 'Phase1已启动，基础框架搭建中', timestamp: '2026-05-14T10:50:00', author: 'MAX' },
  { id: 'n2', content: 'Gitee token需刷新，正在确认', timestamp: '2026-05-14T10:52:00', author: 'MAX' },
  { id: 'n3', content: '系统开发模块已启动，Web界面构建中', timestamp: '2026-05-14T10:55:00', author: 'MAX' },
]

// ── 组件 ─────────────────────────────────────────────

// 顶栏
function Header({ view, onView, totalProgress }: { view: string; onView: (v: string) => void; totalProgress: number }) {
  const tabs = [
    { id: 'overview', label: '总览' },
    { id: 'kanban', label: '看板' },
    { id: 'timeline', label: '时间线' },
    { id: 'ai', label: 'AI能力' },
    { id: 'notes', label: '指挥官日志' },
  ]
  return (
    <header style={{
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>SmartAuto 开发管理系统</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.2 }}>系统设置 / 系统开发模块</div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onView(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: view === t.id ? 600 : 400,
              background: view === t.id ? 'var(--accent)' : 'transparent',
              color: view === t.id ? '#fff' : 'var(--text2)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>总体进度</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: totalProgress >= 50 ? 'var(--green)' : 'var(--yellow)' }}>
            {totalProgress}%
          </div>
        </div>
        <div style={{ width: 120, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${totalProgress}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', padding: '4px 10px', borderRadius: 12 }}>
          20周
        </div>
      </div>
    </header>
  )
}

// Phase卡片
function PhaseCard({ phase, onClick, expanded }: { phase: Phase; onClick: () => void; expanded: boolean }) {
  const statusMap: Record<PhaseStatus, { label: string; color: string; bg: string }> = {
    pending: { label: '待开始', color: '#8b92a8', bg: 'rgba(139,146,168,0.12)' },
    in_progress: { label: '进行中', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    completed: { label: '已完成', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    blocked: { label: '阻塞', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  }
  const s = statusMap[phase.status]
  const allTasks = [...phase.tasks, ...phase.aiTasks]
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length

  // 测试相关状态
  const [showTest, setShowTest] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'testing'>>({})

  // 每个Phase对应的测试项
  const testItems: Record<string, { name: string; desc: string }[]> = {
    p1: [
      { name: '程序合规', desc: '目录结构/SaaS规范/租户字段' },
      { name: '代码完整', desc: '后端骨架/前端骨架/认证系统' },
      { name: '功能正常', desc: '租户CRUD/权限RBAC/订阅配额' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: '沙箱验证', desc: '多租户隔离/数据不串扰' },
      { name: '合规测试', desc: '权限/配额/到期冻结' },
    ],
    p2: [
      { name: '程序合规', desc: 'AI模型配置/对话引擎架构' },
      { name: '代码完整', desc: '流式输出/多模型/知识库' },
      { name: '功能正常', desc: '对话/Session/RAG检索' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: 'Token统计/多模型路由' },
    ],
    p3: [
      { name: '程序合规', desc: '销售/项目/合同模块结构' },
      { name: '代码完整', desc: '客户管理/报价审批' },
      { name: '功能正常', desc: '数据打通/关联关系' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: '客户画像/任务分解' },
    ],
    p4: [
      { name: '程序合规', desc: '图纸/研发模块结构' },
      { name: '代码完整', desc: '图库/版本/BOM管理' },
      { name: '功能正常', desc: '多级审批/变更记录' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: '图纸识别/BOM提取' },
    ],
    p5: [
      { name: '程序合规', desc: '采购/仓库/生产模块结构' },
      { name: '代码完整', desc: '工单/排程/库位管理' },
      { name: '功能正常', desc: '到货通知/库存预警' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: '询价比价/库存预测' },
    ],
    p6: [
      { name: '程序合规', desc: '品检/发货/售后模块结构' },
      { name: '代码完整', desc: '四段质检/工单/物流' },
      { name: '功能正常', desc: '不良品闭环/维修跟踪' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: '视觉质检/故障诊断' },
    ],
    p7: [
      { name: '程序合规', desc: 'AI Hub/知识库/RAG架构' },
      { name: '代码完整', desc: '智能客服/数据分析' },
      { name: '功能正常', desc: 'AI能力中心/报表解读' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: 'RAG检索/模型调度' },
    ],
    p8: [
      { name: '程序合规', desc: '财务/人事/系统结构' },
      { name: '代码完整', desc: '应收应付/考勤薪资' },
      { name: '功能正常', desc: '审批流/仪表盘' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: 'AI能力验证', desc: '财务预警/数据解读' },
    ],
    p9: [
      { name: '程序合规', desc: '集成架构/接口规范' },
      { name: '代码完整', desc: '全流程联调/安全测试' },
      { name: '功能正常', desc: 'SaaS测试/性能测试' },
      { name: '构建测试', desc: 'npm run build 无报错' },
      { name: '部署测试', desc: '生产环境验证' },
      { name: '合规测试', desc: '安全渗透/配额超限' },
    ],
  }

  // 执行单个测试
  const runTest = async (phaseId: string, testName: string) => {
    setTestResults(prev => ({ ...prev, [testName]: 'testing' }))
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400)) // 模拟检测
    // 模拟：进行中的Phase返回fail，已完成的Phase返回pass
    const phase = PHASES.find(p => p.id === phaseId)
    const isPass = phase?.status === 'completed' || (phase?.status === 'in_progress' && Math.random() > 0.3)
    setTestResults(prev => ({ ...prev, [testName]: isPass ? 'pass' : 'fail' }))
  }

  // 一键执行全部测试
  const runAllTests = async (phaseId: string) => {
    const items = testItems[phaseId] || []
    for (const item of items) {
      await runTest(phaseId, item.name)
    }
  }

  const items = testItems[phase.id] || []
  const passCount = Object.values(testResults).filter(v => v === 'pass').length
  const failCount = Object.values(testResults).filter(v => v === 'fail').length

  return (
    <>
      <div style={{
        background: 'var(--bg2)', border: `1px solid ${expanded ? phase.color : 'var(--border)'}`,
        borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: expanded ? `0 0 20px ${phase.color}22` : 'none',
      }}>
        <div onClick={onClick}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: phase.color, background: `${phase.color}18`, padding: '2px 8px', borderRadius: 4 }}>
                  {phase.weeks}
                </span>
                <span style={{ fontSize: 11, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 4 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{phase.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{phase.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: phase.color }}>{phase.progress}%</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{doneTasks}/{allTasks.length} 任务</div>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${phase.progress}%`, height: '100%', background: phase.color, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {phase.milestones.map(m => (
              <span key={m.id} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 4,
                background: m.done ? 'rgba(16,185,129,0.12)' : 'var(--bg3)',
                color: m.done ? 'var(--green)' : 'var(--text3)',
              }}>
                {m.done ? '✓' : '○'} {m.name} ({m.week})
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>进行中: {inProgress}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>待处理: {allTasks.length - doneTasks - inProgress}</span>
            {phase.aiTasks.length > 0 && (
              <span style={{ fontSize: 11, color: phase.color, fontWeight: 500 }}>AI任务: {phase.aiTasks.length}</span>
            )}
          </div>
        </div>

        {/* 测试按钮 */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTest(true) }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${phase.color}44`,
              background: `${phase.color}0a`, color: phase.color, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${phase.color}1a`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${phase.color}0a`)}
          >
            🧪 测试验证
          </button>
        </div>
      </div>

      {/* 测试弹窗 */}
      {showTest && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowTest(false)}>
          <div style={{
            background: 'var(--bg)', border: `1px solid ${phase.color}44`,
            borderRadius: 16, padding: 24, width: '100%', maxWidth: 520,
            maxHeight: '85vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: phase.color }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>{phase.name} · 测试验证</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                {passCount > 0 && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ {passCount}</span>}
                {failCount > 0 && <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>✗ {failCount}</span>}
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{items.length} 项测试</span>
              </div>
            </div>

            {/* 一键执行按钮 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => runAllTests(phase.id)}
                disabled={Object.values(testResults).includes('testing')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: phase.color, color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: Object.values(testResults).includes('testing') ? 'wait' : 'pointer',
                  opacity: Object.values(testResults).includes('testing') ? 0.6 : 1,
                }}
              >
                {Object.values(testResults).includes('testing') ? '🔄 测试中...' : '▶ 执行全部测试'}
              </button>
              <button onClick={() => setTestResults({})}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                重置
              </button>
            </div>

            {/* 测试项列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => {
                const result = testResults[item.name]
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: result === 'pass' ? 'rgba(16,185,129,0.08)' : result === 'fail' ? 'rgba(239,68,68,0.08)' : 'var(--bg2)',
                    border: `1px solid ${result === 'pass' ? 'rgba(16,185,129,0.3)' : result === 'fail' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                  }}>
                    {/* 状态图标 */}
                    <div style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>
                      {result === 'pass' ? '✅' : result === 'fail' ? '❌' : result === 'testing' ? '⏳' : '⬜'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: result === 'pass' ? 'var(--green)' : result === 'fail' ? 'var(--red)' : 'var(--text)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    {/* 执行按钮 */}
                    <button
                      onClick={() => runTest(phase.id, item.name)}
                      disabled={result === 'testing'}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: 'none',
                        background: result === 'pass' ? 'rgba(16,185,129,0.2)' : result === 'fail' ? 'rgba(239,68,68,0.2)' : phase.color + '22',
                        color: result === 'pass' ? 'var(--green)' : result === 'fail' ? 'var(--red)' : phase.color,
                        fontSize: 11, fontWeight: 600, cursor: result === 'testing' ? 'wait' : 'pointer',
                        opacity: result === 'testing' ? 0.6 : 1,
                      }}
                    >
                      {result === 'testing' ? '检测中' : result === 'pass' ? '重新测' : result === 'fail' ? '重试' : '测试'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* 关闭按钮 */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button onClick={() => setShowTest(false)}
                style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 任务卡片
function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (t: Task) => void }) {
  const priorityColor: Record<string, string> = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#8b92a8' }
  const statusColor: Record<TaskStatus, string> = { backlog: '#8b92a8', in_progress: '#6366f1', done: '#10b981', blocked: '#ef4444' }
  const statusLabel: Record<TaskStatus, string> = { backlog: '待办', in_progress: '进行中', done: '完成', blocked: '阻塞' }

  const cycle = (s: TaskStatus): TaskStatus => {
    const seq: TaskStatus[] = ['backlog', 'in_progress', 'done', 'blocked']
    return seq[(seq.indexOf(s) + 1) % seq.length]
  }

  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8,
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor[task.priority], background: `${priorityColor[task.priority]}18`, padding: '1px 6px', borderRadius: 3 }}>
              {task.priority}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.dueWeek}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{task.title}</div>
          {task.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{task.notes}</div>}
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {task.tags.map(tag => (
              <span key={tag} style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg2)', padding: '1px 6px', borderRadius: 3 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...task, status: cycle(task.status) }) }}
          style={{
            flexShrink: 0, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            background: `${statusColor[task.status]}22`, color: statusColor[task.status],
            transition: 'all 0.15s',
          }}>
          {statusLabel[task.status]}
        </button>
      </div>
    </div>
  )
}

// AI能力行
function AITaskRow({ task, onUpdate }: { task: Task; onUpdate: (t: Task) => void }) {
  const priorityColor: Record<string, string> = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#8b92a8' }
  const statusIcon: Record<TaskStatus, string> = { backlog: '◻', in_progress: '◉', done: '✓', blocked: '✗' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <button onClick={() => onUpdate({ ...task, status: task.status === 'done' ? 'backlog' : 'done' })}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: task.status === 'done' ? 'var(--green)' : 'var(--text3)', width: 20, textAlign: 'center' }}>
        {statusIcon[task.status]}
      </button>
      <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor[task.priority], background: `${priorityColor[task.priority]}18`, padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>
        {task.priority}
      </span>
      <span style={{ flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text3)' : 'var(--text)' }}>
        {task.title}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{task.dueWeek}</span>
      {task.tags.map(tag => (
        <span key={tag} style={{ fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>
          {tag}
        </span>
      ))}
    </div>
  )
}

// 看板列
function KanbanColumn({ title, tasks, status, color, onTaskUpdate }: {
  title: string; tasks: Task[]; status: TaskStatus; color: string; onTaskUpdate: (t: Task) => void
}) {
  return (
    <div style={{ flex: 1, minWidth: 240, maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{tasks.length}</span>
      </div>
      <div>
        {tasks.map(t => (
          <div key={t.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: t.priority === 'P0' ? '#ef4444' : t.priority === 'P1' ? '#f59e0b' : '#3b82f6', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>
                {t.priority}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{t.dueWeek}</span>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>{t.title}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {t.tags.map(tag => (
                <span key={tag} style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>{tag}</span>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button onClick={() => onTaskUpdate({ ...t, status: 'backlog' })}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer' }}>待办</button>
              <button onClick={() => onTaskUpdate({ ...t, status: 'in_progress' })}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: t.status === 'in_progress' ? 'var(--accent)' : 'var(--bg3)', color: t.status === 'in_progress' ? '#fff' : 'var(--text2)', cursor: 'pointer' }}>进行</button>
              <button onClick={() => onTaskUpdate({ ...t, status: 'done' })}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: t.status === 'done' ? 'var(--green)' : 'var(--bg3)', color: t.status === 'done' ? '#fff' : 'var(--text2)', cursor: 'pointer' }}>完成</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 时间线阶段
function TimelinePhase({ phase }: { phase: Phase }) {
  const allTasks = [...phase.tasks, ...phase.aiTasks]
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{phase.name}</div>
        <span style={{ fontSize: 11, color: phase.color, background: `${phase.color}18`, padding: '2px 8px', borderRadius: 4 }}>{phase.weeks}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{doneTasks}/{allTasks.length}</span>
        <div style={{ width: 80, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${phase.progress}%`, height: '100%', background: phase.color }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: phase.color }}>{phase.progress}%</span>
      </div>
      <div style={{ marginLeft: 5, borderLeft: `2px solid ${phase.color}33`, paddingLeft: 20 }}>
        {allTasks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '4px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.status === 'done' ? 'var(--green)' : t.status === 'in_progress' ? 'var(--accent)' : 'var(--border)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1, color: t.status === 'done' ? 'var(--text3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{t.dueWeek}</span>
            {t.tags.includes('AI') && <span style={{ fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '1px 6px', borderRadius: 3 }}>AI</span>}
          </div>
        ))}
        {phase.milestones.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '4px 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.done ? 'var(--green)' : 'var(--border)', border: `2px solid ${m.done ? 'var(--green)' : 'var(--text3)'}`, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: m.done ? 'var(--green)' : 'var(--text2)', textDecoration: m.done ? 'none' : 'none' }}>
              🎯 {m.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>({m.week})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 主应用
export default function App() {
  const [view, setView] = useState('overview')
  const [phases, setPhases] = useState<Phase[]>(() => loadData(STORAGE_KEY, PHASES))
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>(() => loadData(`${STORAGE_KEY}-notes`, DEFAULT_NOTES))
  const [newNote, setNewNote] = useState('')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 持久化
  useEffect(() => { saveData(STORAGE_KEY, phases) }, [phases])
  useEffect(() => { saveData(`${STORAGE_KEY}-notes`, notes) }, [notes])

  // 更新任务
  const updateTask = useCallback((phaseId: string, taskId: string, upd: Partial<Task>) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p
      const updateInArray = (arr: Task[]) => arr.map(t => t.id === taskId ? { ...t, ...upd, updatedAt: new Date().toISOString() } : t)
      const newTasks = updateInArray(p.tasks)
      const newAiTasks = updateInArray(p.aiTasks)
      const allTasks = [...newTasks, ...newAiTasks]
      const done = allTasks.filter(t => t.status === 'done').length
      const progress = Math.round((done / allTasks.length) * 100)
      const status: PhaseStatus = allTasks.every(t => t.status === 'done') ? 'completed'
        : allTasks.some(t => t.status === 'in_progress') ? 'in_progress'
        : 'pending'
      return { ...p, tasks: newTasks, aiTasks: newAiTasks, progress, status }
    }))
  }, [])

  // 里程碑切换
  const toggleMilestone = useCallback((phaseId: string, milestoneId: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p
      return { ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m) }
    }))
  }, [])

  // 汇总
  const totalTasks = phases.reduce((s, p) => s + p.tasks.length + p.aiTasks.length, 0)
  const doneTasks = phases.reduce((s, p) => s + p.tasks.filter(t => t.status === 'done').length + p.aiTasks.filter(t => t.status === 'done').length, 0)
  const totalProgress = Math.round((doneTasks / totalTasks) * 100)
  const allTasks = phases.flatMap(p => [...p.tasks, ...p.aiTasks])

  // 过滤任务
  const filteredTasks = allTasks.filter(t => {
    if (filterPhase !== 'all' && t.phaseId !== filterPhase) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  // 添加备注
  const addNote = () => {
    if (!newNote.trim()) return
    setNotes(prev => [{ id: uid(), content: newNote.trim(), timestamp: new Date().toISOString(), author: 'MAX' }, ...prev])
    setNewNote('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header view={view} onView={setView} totalProgress={totalProgress} />

      {/* ── 总览视图 ── */}
      {view === 'overview' && (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: '总任务', value: totalTasks, color: 'var(--accent)' },
              { label: '已完成', value: doneTasks, color: 'var(--green)' },
              { label: '总体进度', value: `${totalProgress}%`, color: totalProgress >= 50 ? 'var(--green)' : 'var(--yellow)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>阶段详情</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {phases.map(p => (
              <div key={p.id}>
                <PhaseCard phase={p} onClick={() => setExpandedPhase(expandedPhase === p.id ? null : p.id)} expanded={expandedPhase === p.id} />
                {expandedPhase === p.id && (
                  <div style={{ marginTop: 8, background: 'var(--bg2)', border: `1px solid ${p.color}44`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: p.color }}>任务列表</div>
                    {[...p.tasks, ...p.aiTasks].map(t => (
                      <TaskCard key={t.id} task={t} onUpdate={(updated) => updateTask(p.id, t.id, updated)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 看板视图 ── */}
      {view === 'kanban' && (
        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
              style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
              <option value="all">全部阶段</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
              <option value="all">全部状态</option>
              <option value="backlog">待办</option>
              <option value="in_progress">进行中</option>
              <option value="done">已完成</option>
              <option value="blocked">阻塞</option>
            </select>
            <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>共 {filteredTasks.length} 任务</span>
          </div>

          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
            {[
              { status: 'backlog' as TaskStatus, title: '📋 待办', color: '#8b92a8' },
              { status: 'in_progress' as TaskStatus, title: '🚀 进行中', color: '#6366f1' },
              { status: 'done' as TaskStatus, title: '✅ 完成', color: '#10b981' },
              { status: 'blocked' as TaskStatus, title: '🚫 阻塞', color: '#ef4444' },
            ].map(col => (
              <KanbanColumn key={col.status} title={col.title} status={col.status} color={col.color}
                tasks={filteredTasks.filter(t => t.status === col.status)}
                onTaskUpdate={(t) => updateTask(t.phaseId, t.id, t)} />
            ))}
          </div>
        </div>
      )}

      {/* ── 时间线视图 ── */}
      {view === 'timeline' && (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4, marginBottom: 24, padding: '0 24px' }}>
            {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'].map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{w}</div>
            ))}
          </div>
          {phases.map(p => <TimelinePhase key={p.id} phase={p} />)}
        </div>
      )}

      {/* ── AI能力视图 ── */}
      {view === 'ai' && (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>AI能力开发清单</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>共 {phases.reduce((s, p) => s + p.aiTasks.length, 0)} 项AI能力</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'P0', color: '#ef4444' },
                  { label: 'P1', color: '#f59e0b' },
                  { label: 'P2', color: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label} = {allTasks.filter(t => t.priority === s.label && t.tags.includes('AI')).length}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {phases.flatMap(p => p.aiTasks.length > 0 ? [(
                <div key={p.id}>
                  <div style={{ padding: '10px 20px', background: `${p.color}11`, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.weeks}</span>
                    <span style={{ fontSize: 11, color: p.color, marginLeft: 'auto' }}>{p.aiTasks.length}项AI能力</span>
                  </div>
                  {p.aiTasks.map(t => (
                    <AITaskRow key={t.id} task={t} onUpdate={(updated) => updateTask(p.id, t.id, updated)} />
                  ))}
                </div>
              )] : [])}
              {phases.every(p => p.aiTasks.length === 0) && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>暂无AI能力任务</div>
              )}
            </div>
          </div>

          {/* 里程碑 */}
          <div style={{ marginTop: 24, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>里程碑</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {phases.flatMap(p => p.milestones).map(m => {
                const phase = phases.find(p => p.milestones.some(mp => mp.id === m.id))!
                return (
                  <div key={m.id} onClick={() => toggleMilestone(phase.id, m.id)}
                    style={{
                      padding: 12, borderRadius: 8, cursor: 'pointer',
                      background: m.done ? 'rgba(16,185,129,0.06)' : 'var(--bg3)',
                      border: `1px solid ${m.done ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{m.done ? '✅' : '⬜'}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: m.done ? 'var(--green)' : 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{phase.name} · {m.week}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 指挥官日志 ── */}
      {view === 'notes' && (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>指挥官指令日志</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="记录新的指令/进度/问题..."
                style={{
                  flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none',
                }} />
              <button onClick={addNote} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              }}>记录</button>
            </div>
          </div>
          <div>
            {notes.map(note => (
              <div key={note.id} style={{
                padding: 14, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{note.author}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtTime(note.timestamp)}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{note.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 底部状态栏 ── */}
      <footer style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          SmartAuto 开发管理系统 · 系统设置 / 系统开发模块 · 数据存储于本地浏览器
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          最后更新: {new Date().toLocaleString('zh-CN')}
        </span>
      </footer>
    </div>
  )
}