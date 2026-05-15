# Phase 2: AI基础能力 - 需求校验文档

## 1. 场景分析

### 1.1 核心场景
- **场景1**：用户在AI对话框输入问题，系统流式返回AI响应（打字机效果）
- **场景2**：用户切换不同AI模型（OpenAI/Claude/本地LLM），系统自动路由
- **场景3**：用户在知识库中上传文档，AI基于文档内容回答（RAG）
- **场景4**：系统自动统计Token消耗，关联租户配额

### 1.2 技术场景
- 前端：React + SSE流式接收
- 后端：FastAPI + SSE流式响应 + 多模型适配器
- 向量库：Chroma（轻量，支持本地部署）
- 存储：SQLite（开发环境）/ PostgreSQL（生产）

---

## 2. 参数清单

### 2.1 AI模型配置参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| model_code | string | - | 模型编码（gpt-4/claude-3-opus/local） |
| provider | enum | - | openai/claude/local |
| api_endpoint | string | - | API地址 |
| api_key | string | - | 密钥（加密存储） |
| max_tokens | int | 4096 | 最大输出Token |
| temperature | float | 0.7 | 温度参数 |
| cost_per_input | decimal | 0.00 | 输入单价 |
| cost_per_output | decimal | 0.00 | 输出单价 |

### 2.2 对话会话参数
| 参数 | 类型 | 说明 |
|------|------|------|
| session_id | UUID | 会话ID |
| messages | array | 消息历史[{role, content}] |
| model_id | int | 模型ID |
| stream | bool | 是否流式（默认true） |
| temperature | float | 温度参数 |
| max_tokens | int | 最大Token |

### 2.3 知识库参数
| 参数 | 类型 | 说明 |
|------|------|------|
| kb_name | string | 知识库名称 |
| kb_code | string | 知识库编码 |
| doc_file | file | 上传的文档（pdf/txt/md） |

---

## 3. 租户隔离要求

- AI模型配置：tenant_id 隔离，每租户独立配置
- 对话会话：tenant_id + user_id 隔离
- 知识库文档：tenant_id 隔离，租户间完全隔离
- Token统计：按 tenant_id 汇总

---

## 4. 权限控制

- 普通用户：发起对话、查看自己的会话历史
- 管理员：配置AI模型、管理知识库、查看Token统计
- 权限通过 sys_menu 表的 ai_* 菜单项控制

---

## 5. 安全策略

- API Key 加密存储（AES）
- 对话内容不记录到日志
- 知识库文档存储于独立目录，按 tenant_id 隔离
- 频率限制：单租户每分钟最多60次调用

---

## 6. 配额规则

- AI对话配额按套餐等级：
  - 基础版：1000次/月
  - 标准版：10000次/月
  - 旗舰版：无限制
- Token配额：按输入/输出分别统计
- 超配额时返回友好提示，引导升级套餐

---

## 7. 待确认项 [待确认]

- [ ] RAG向量库选型：Chroma（轻量）vs Milvus（生产级）？
- [ ] 知识库文档大小限制：默认50MB？
- [ ] 对话历史保留天数：默认30天？
- [ ] 是否需要支持图片理解（Vision）？
- [ ] 是否需要支持语音转文字（ASR）？

---

## 需求校验结论

✅ 需求完整度：85%（7个待确认项需与MAX确认）
⏸️ 建议：先开发核心对话功能（不含RAG），RAG作为Phase 7任务
