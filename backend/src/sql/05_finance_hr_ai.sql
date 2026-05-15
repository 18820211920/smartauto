-- ===============================================
-- SmartAuto ERP 业务表结构 - Phase 8 财务/人事 + AI能力
-- 创建时间: 2024-05-15
-- 模块: 财务管理、人事管理、AI能力
-- ===============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 账户表 fin_account
-- ----------------------------
DROP TABLE IF EXISTS `fin_account`;
CREATE TABLE `fin_account` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '账户ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `account_code` varchar(50) NOT NULL COMMENT '账户编码',
  `account_name` varchar(100) NOT NULL COMMENT '账户名称',
  `account_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-现金 1-银行 2-微信 3-支付宝 4-其他',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '开户银行',
  `bank_account` varchar(50) DEFAULT NULL COMMENT '银行账号',
  `opening_balance` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '期初余额',
  `current_balance` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '当前余额',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account_code` (`account_code`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账户表';

-- ----------------------------
-- 2. 收入记录表 fin_income
-- ----------------------------
DROP TABLE IF EXISTS `fin_income`;
CREATE TABLE `fin_income` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `income_no` varchar(50) NOT NULL COMMENT '收入单号',
  `income_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-合同收款 1-预收款 2-退款 3-其他',
  `contract_id` int DEFAULT NULL COMMENT '合同ID',
  `customer_id` int DEFAULT NULL COMMENT '客户ID',
  `account_id` int NOT NULL COMMENT '账户ID',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '金额',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '付款方式',
  `payment_date` date DEFAULT NULL COMMENT '付款日期',
  `invoice_no` varchar(50) DEFAULT NULL COMMENT '发票号',
  `attach_urls` varchar(500) DEFAULT NULL COMMENT '附件(JSON)',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_income_no` (`income_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入记录表';

-- ----------------------------
-- 3. 支出记录表 fin_expense
-- ----------------------------
DROP TABLE IF EXISTS `fin_expense`;
CREATE TABLE `fin_expense` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `expense_no` varchar(50) NOT NULL COMMENT '支出单号',
  `expense_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-采购付款 2-工资 3-费用 4-退款 5-其他',
  `supplier_id` int DEFAULT NULL COMMENT '供应商ID(采购用)',
  `account_id` int NOT NULL COMMENT '账户ID',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '金额',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '付款方式',
  `payment_date` date DEFAULT NULL COMMENT '付款日期',
  `invoice_no` varchar(50) DEFAULT NULL COMMENT '发票号',
  `attach_urls` varchar(500) DEFAULT NULL COMMENT '附件(JSON)',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_expense_no` (`expense_no`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支出记录表';

-- ----------------------------
-- 4. 发票表 fin_invoice
-- ----------------------------
DROP TABLE IF EXISTS `fin_invoice`;
CREATE TABLE `fin_invoice` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '发票ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `invoice_no` varchar(50) NOT NULL COMMENT '发票号',
  `invoice_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-增值税专用 1-增值税普通 2-电子发票 3-收据',
  `invoice_kind` tinyint NOT NULL DEFAULT '0' COMMENT '种类: 0-销售发票 1-采购发票',
  `customer_id` int DEFAULT NULL COMMENT '客户ID(销售)',
  `supplier_id` int DEFAULT NULL COMMENT '供应商ID(采购)',
  `contract_id` int DEFAULT NULL COMMENT '合同ID',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '价税合计',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '税额',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT '税率%',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待开 1-已开 2-已作废 3-已红冲',
  `open_date` date DEFAULT NULL COMMENT '开票日期',
  `open_by` int DEFAULT NULL COMMENT '开票人',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoice_no` (`invoice_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票表';

-- ----------------------------
-- 5. 员工表 hr_employee
-- ----------------------------
DROP TABLE IF EXISTS `hr_employee`;
CREATE TABLE `hr_employee` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '员工ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `dept_id` int DEFAULT NULL COMMENT '部门ID',
  `employee_no` varchar(50) NOT NULL COMMENT '工号',
  `employee_name` varchar(50) NOT NULL COMMENT '姓名',
  `gender` tinyint DEFAULT NULL COMMENT '性别: 0-女 1-男',
  `id_card` varchar(20) DEFAULT NULL COMMENT '身份证号',
  `birth_date` date DEFAULT NULL COMMENT '出生日期',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `nation` varchar(20) DEFAULT NULL COMMENT '民族',
  `political` varchar(20) DEFAULT NULL COMMENT '政治面貌',
  `hukou_type` tinyint DEFAULT NULL COMMENT '户籍: 0-城镇 1-农村',
  `address` varchar(255) DEFAULT NULL COMMENT '住址',
  `emergency_contact` varchar(50) DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT '紧急联系电话',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '开户银行',
  `bank_account` varchar(50) DEFAULT NULL COMMENT '银行卡号',
  `hire_date` date DEFAULT NULL COMMENT '入职日期',
  `contract_start` date DEFAULT NULL COMMENT '合同开始',
  `contract_end` date DEFAULT NULL COMMENT '合同结束',
  `position` varchar(50) DEFAULT NULL COMMENT '岗位',
  `employee_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-正式 1-临时 2-实习 3-外包',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-在职 1-离职 2-退休 3-停薪留职',
  `leave_date` date DEFAULT NULL COMMENT '离职日期',
  `leave_reason` varchar(255) DEFAULT NULL COMMENT '离职原因',
  `avatar` varchar(500) DEFAULT NULL COMMENT '照片URL',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_no` (`employee_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工表';

-- ----------------------------
-- 6. 工资表 hr_salary
-- ----------------------------
DROP TABLE IF EXISTS `hr_salary`;
CREATE TABLE `hr_salary` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `salary_month` varchar(7) NOT NULL COMMENT '工资月份(YYYY-MM)',
  `basic_salary` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '基本工资',
  `position_salary` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '岗位工资',
  `performance_salary` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '绩效工资',
  `allowance` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '补贴',
  `overtime_pay` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '加班费',
  `bonus` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '奖金',
  `total_salary` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '应发合计',
  `social_deduct` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '社保扣款',
  `housing_fund` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '公积金扣款',
  `income_tax` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '个税',
  `other_deduct` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '其他扣款',
  `net_salary` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实发工资',
  `pay_date` date DEFAULT NULL COMMENT '发放日期',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待发放 1-已发放 2-已取消',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_month` (`employee_id`, `salary_month`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工资表';

-- ----------------------------
-- 7. 考勤表 hr_attendance
-- ----------------------------
DROP TABLE IF EXISTS `hr_attendance`;
CREATE TABLE `hr_attendance` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `work_date` date NOT NULL COMMENT '考勤日期',
  `check_in` datetime DEFAULT NULL COMMENT '上班打卡',
  `check_out` datetime DEFAULT NULL COMMENT '下班打卡',
  `work_hours` decimal(5,2) DEFAULT NULL COMMENT '工时',
  `overtime_hours` decimal(5,2) DEFAULT NULL COMMENT '加班时长',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-正常 1-迟到 2-早退 3-缺勤 4-请假 5-出差 6-旷工',
  `leave_type` tinyint DEFAULT NULL COMMENT '请假类型: 0-事假 1-病假 2-年假 3-婚假 4-产假 5-丧假',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_date` (`employee_id`, `work_date`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考勤表';

-- ----------------------------
-- 8. AI模型配置表 ai_model_config
-- ----------------------------
DROP TABLE IF EXISTS `ai_model_config`;
CREATE TABLE `ai_model_config` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `model_name` varchar(100) NOT NULL COMMENT '模型名称',
  `model_code` varchar(50) NOT NULL COMMENT '模型编码',
  `provider` varchar(50) NOT NULL COMMENT '供应商: openai/claude/local',
  `api_endpoint` varchar(255) DEFAULT NULL COMMENT 'API地址',
  `api_key` varchar(500) DEFAULT NULL COMMENT 'API密钥(加密)',
  `model_version` varchar(50) DEFAULT NULL COMMENT '模型版本',
  `max_tokens` int DEFAULT '4096' COMMENT '最大Token',
  `temperature` decimal(3,2) DEFAULT '0.7' COMMENT '温度参数',
  `cost_per_input` decimal(10,6) DEFAULT '0.00' COMMENT '输入单价(元/千Token)',
  `cost_per_output` decimal(10,6) DEFAULT '0.00' COMMENT '输出单价(元/千Token)',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `is_default` tinyint NOT NULL DEFAULT '0' COMMENT '默认模型: 0-否 1-是',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型配置表';

-- ----------------------------
-- 9. AI对话会话表 ai_conversation
-- ----------------------------
DROP TABLE IF EXISTS `ai_conversation`;
CREATE TABLE `ai_conversation` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `session_id` varchar(64) NOT NULL COMMENT '会话ID(UUID)',
  `title` varchar(200) DEFAULT NULL COMMENT '会话标题',
  `model_id` int DEFAULT NULL COMMENT '使用模型ID',
  `message_count` int NOT NULL DEFAULT '0' COMMENT '消息数',
  `input_tokens` int NOT NULL DEFAULT '0' COMMENT '输入Token',
  `output_tokens` int NOT NULL DEFAULT '0' COMMENT '输出Token',
  `total_cost` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '总费用',
  `last_message` text COMMENT '最后一条消息',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-正常 1-已归档',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话会话表';

-- ----------------------------
-- 10. AI消息记录表 ai_message
-- ----------------------------
DROP TABLE IF EXISTS `ai_message`;
CREATE TABLE `ai_message` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `conversation_id` int NOT NULL COMMENT '会话ID',
  `role` tinyint NOT NULL DEFAULT '0' COMMENT '角色: 0-user 1-assistant 2-system',
  `content` text NOT NULL COMMENT '消息内容',
  `model_id` int DEFAULT NULL COMMENT '使用的模型',
  `input_tokens` int NOT NULL DEFAULT '0' COMMENT '输入Token',
  `output_tokens` int NOT NULL DEFAULT '0' COMMENT '输出Token',
  `latency_ms` int DEFAULT NULL COMMENT '响应延迟(ms)',
  `error_msg` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI消息记录表';

-- ----------------------------
-- 11. AI知识库表 ai_knowledge_base
-- ----------------------------
DROP TABLE IF EXISTS `ai_knowledge_base`;
CREATE TABLE `ai_knowledge_base` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '知识库ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `kb_name` varchar(100) NOT NULL COMMENT '知识库名称',
  `kb_code` varchar(50) NOT NULL COMMENT '知识库编码',
  `description` text COMMENT '描述',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `doc_count` int NOT NULL DEFAULT '0' COMMENT '文档数',
  `chunk_count` int NOT NULL DEFAULT '0' COMMENT '切片数',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kb_code` (`kb_code`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI知识库表';

-- ----------------------------
-- 12. AI知识文档表 ai_document
-- ----------------------------
DROP TABLE IF EXISTS `ai_document`;
CREATE TABLE `ai_document` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '文档ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `kb_id` int NOT NULL COMMENT '知识库ID',
  `doc_name` varchar(200) NOT NULL COMMENT '文档名称',
  `doc_type` varchar(20) DEFAULT NULL COMMENT '文档类型',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小(bytes)',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件URL',
  `file_hash` varchar(64) DEFAULT NULL COMMENT '文件Hash',
  `chunk_count` int NOT NULL DEFAULT '0' COMMENT '切片数',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待处理 1-处理中 2-已完成 3-失败',
  `error_msg` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_kb_id` (`kb_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI知识文档表';

-- ----------------------------
-- 13. AI向量切片表 ai_chunk
-- ----------------------------
DROP TABLE IF EXISTS `ai_chunk`;
CREATE TABLE `ai_chunk` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '切片ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `doc_id` int NOT NULL COMMENT '文档ID',
  `kb_id` int NOT NULL COMMENT '知识库ID',
  `chunk_index` int NOT NULL DEFAULT '0' COMMENT '切片序号',
  `content` text NOT NULL COMMENT '文本内容',
  `vector_id` varchar(100) DEFAULT NULL COMMENT '向量ID',
  `chunk_length` int NOT NULL DEFAULT '0' COMMENT '字符长度',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待处理 1-已向量化 2-失败',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_doc_id` (`doc_id`),
  KEY `idx_kb_id` (`kb_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI向量切片表';

-- ----------------------------
-- 14. 操作日志表 sys_oper_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_oper_log`;
CREATE TABLE `sys_oper_log` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `user_id` int DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `module` varchar(50) DEFAULT NULL COMMENT '模块',
  `action` varchar(50) DEFAULT NULL COMMENT '操作',
  `method` varchar(20) DEFAULT NULL COMMENT '请求方法',
  `url` varchar(255) DEFAULT NULL COMMENT '请求URL',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `location` varchar(100) DEFAULT NULL COMMENT '地理位置',
  `params` text COMMENT '请求参数',
  `result` tinyint DEFAULT NULL COMMENT '结果: 0-成功 1-失败',
  `error_msg` text COMMENT '错误信息',
  `duration_ms` int DEFAULT NULL COMMENT '耗时(ms)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

SET FOREIGN_KEY_CHECKS = 1;