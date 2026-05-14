---
name: smartauto-dev-skill
description: SmartAuto 非标自动化ERP开发管理系统 - 从需求到上线的完整开发流程Skill，涵盖Phase卡片设计、测试验证、开发日志、开发进度可视化
triggers:
  - smartauto开发
  - 项目管理系统
  - 开发进度看板
  - Phase卡片
  - 测试验证
  - 开发日志
  - 飞书机器人
---

# SmartAuto 开发管理系统 Skill

## 一、项目概述

SmartAuto（全称：非标自动化设备公司全流程ERP管理系统）是鹿和智造核心产品，覆盖以下全链路业务模块：

### 13个业务模块
销售 → 项目管理 → 研发设计 → 采购 → 生产装配 → 品检 → 仓库物料 → 发货安装 → 售后维保 → 验收闭环 → 人事 → 财务

### 9个开发阶段
| Phase | 名称 | 时间 | 核心交付 |
|-------|------|------|---------|
| Phase 1 | 基础框架 | W1-W2 | SaaS架构/租户系统/权限RBAC |
| Phase 2 | AI能力基础 | W3-W4 | AI对话/知识库/流式输出 |
| Phase 3 | 销售+项目管理 | W5-W7 | 客户/报价/合同/项目任务 |
| Phase 4 | 研发设计 | W7-W9 | 图纸/BOM/版本/变更 |
| Phase 5 | 采购+仓库+生产 | W9-W11 | 工单/排程/库位/库存 |
| Phase 6 | 品检+发货+售后+AI视觉 | W13-W15 | IQC/PQC/FQC/OQC/物流/维修 |
| Phase 7 | AI能力集成 | W15-W17 | AI Hub/知识库RAG/智能客服 |
| Phase 8 | 交付层 | W17-W19 | 财务/人事/仪表盘 |
| Phase 9 | 集成测试与上线 | W19-W20 | 联调/安全测试/生产部署 |

---

## 二、技术栈

- **前端框架**: React + TypeScript + Vite
- **样式**: 原生CSS变量（深色主题支持）
- **数据存储**: localStorage（任务状态/里程碑/测试日志）
- **构建**: npm run build
- **代码管理**: Git（Gitee主仓 + GitHub镜像）
- **部署**: Cron定时拉取（备案期间）/ Webhook自动部署（备案后）
- **服务器**: ubuntu@123.207.15.108
- **访问地址**: https://123.207.15.108/system-dev/

---

## 三、目录结构

```
/workspace/smartauto/
├── docs/system-dev/           # 前端源码（开发目录）
│   ├── src/
│   │   ├── App.tsx           # 主应用（所有业务逻辑）
│   │   └── main.tsx          # 入口
│   ├── index.html
│   └── package.json
└── SKILL-cicd-smartauto.md   # CI/CD部署流程规范
```

**关键文件说明**：
- `App.tsx` 包含：Header导航、总览视图、时间线视图、看板视图、AI能力视图、里程碑、指挥官日志、Phase卡片（含测试验证和开发日志）
- Phase卡片是核心UI组件，每个Phase可展开显示任务列表

---

## 四、Phase卡片设计规范

### 数据结构
```typescript
interface Phase {
  id: string           // 'p1'~'p9'
  name: string         // 'Phase 1: 基础框架'
  weeks: string        // 'W1-W2'
  status: PhaseStatus  // 'pending'|'in_progress'|'completed'|'blocked'
  progress: number     // 0-100
  color: string       // 主题色
  description: string  // 简短描述
  milestones: Milestone[]
  tasks: Task[]        // 业务任务
  aiTasks: Task[]      // AI能力任务
}

interface Task {
  id: string
  title: string
  phaseId: string
  status: TaskStatus   // 'backlog'|'in_progress'|'done'|'blocked'
  priority: string    // 'P0'|'P1'|'P2'|'P3'
  assignee: string
  dueWeek: string
  tags: string[]       // ['业务']|['AI']
  notes: string
  createdAt: string
  updatedAt: string
}
```

### Phase卡片功能
每个Phase卡片包含：
1. **基本信息**：周次标签/状态徽章/名称/描述/进度
2. **进度条**：显示当前进度百分比
3. **里程碑标签**：已完成的显示绿色勾，未完成的显示圆圈
4. **统计信息**：进行中任务数/待处理任务数/AI任务数
5. **测试验证按钮**：点击展开测试弹窗
6. **开发日志按钮**：显示记录条数Badge，点击展开日志弹窗

### 测试验证功能
- **6类测试项**（每个Phase对应不同测试项）：
  - 程序合规（目录结构/SaaS规范/租户字段）
  - 代码完整（后端骨架/前端骨架/认证系统）
  - 功能正常（租户CRUD/权限RBAC/订阅配额）
  - 构建测试（npm run build 无报错）
  - 沙箱验证（多租户隔离/数据不串扰）
  - 合规测试（权限/配额/到期冻结）
  - AI能力验证（Token统计/多模型路由）——Phase 2起
  - 部署测试（生产环境验证）——Phase 9
- **测试弹窗**：
  - 标题栏显示Phase名 + 通过数 + 失败数 + 总项数
  - 一键执行全部测试按钮（批量顺序执行）
  - 单项测试按钮（单项执行）
  - 重置按钮
- **状态**：⬜未测 → ⏳检测中 → ✅通过 / ❌失败

### 开发日志功能
- 每次测试完成后自动记录
- 记录内容：时间（YYYY-MM-DD HH:mm:ss格式） + 测试项名 + 结果 + Phase名
- 持久化存储于 localStorage（每个Phase独立key）
- 最多保存50条记录，超出自动截断
- 按时间倒序排列
- 支持清空操作

---

## 五、关键组件说明

### TimelinePhase（时间线视图）
- 展示所有Phase的时间线
- 每个Phase包含任务列表、状态圆点、里程碑
- AI任务有紫色标签

### PhaseCard（Phase卡片）
- 详情见第四章
- 点击卡片主体展开/收起任务列表
- 测试按钮和日志按钮独立于可点击区域，不触发展开

### Header（顶部导航）
- 项目名称 + 模块路径
- 视图切换：总览/看板/时间线/AI能力/指挥官日志
- 总体进度条

### KanbanColumn（看板列）
- 四列：待办/进行中/完成/阻塞
- 支持任务过滤（按Phase/状态）

---

## 六、常用开发命令

```bash
# 本地开发
cd /workspace/smartauto/docs/system-dev
npm run dev

# 构建生产版本
npm run build

# 提交代码
git add -A
git commit -m "feat/fix: 描述"
git push gitee master
git push github master

# 服务器部署（备案期间Cron链路）
ssh ubuntu@123.207.15.108
cd /var/www/lugong/system-dev-src/docs/system-dev
git pull && npm install && npm run build && cp -r dist/* /var/www/lugong/system-dev/
```

---

## 七、开发流程规范

### 新增功能步骤
1. 在 `App.tsx` 中找到对应组件
2. 添加状态和逻辑
3. 更新渲染UI
4. `npm run build` 验证编译
5. 提交到Gitee/GitHub
6. 服务器自动拉取部署（5分钟内生效）

### Phase卡片扩展
如果要修改测试项，编辑 `testItems` 对象：
```typescript
const testItems: Record<string, { name: string; desc: string }[]> = {
  p1: [
    { name: '程序合规', desc: '目录结构/SaaS规范/租户字段' },
    // ...
  ],
}
```

### 添加新Phase
1. 在 `PHASES` 数组中添加新Phase对象
2. 确保 id 为 'pN' 格式
3. 在 `testItems` 中添加对应的测试项数组

---

## 八、Git Push 自动部署配置

### 链路A（生产链路 - 备案后）
```
本地 push → Gitee → Webhook → 服务器自动构建 → 部署
```
- Gitee Webhook: `https://lg-auto.com/webhook/deploy`

### 链路B（临时链路 - 备案期间）
```
本地 push → Gitee → Cron每5分钟拉取 → 构建 → 部署
```
- Cron: `*/5 * * * * /var/www/lugong/deploy-smartauto.sh`

---

## 九、相关Skill

- `smartauto-cicd-deploy` — CI/CD部署流程规范
- `zhqt-git-deploy` — 智企通代码同步与上线流程