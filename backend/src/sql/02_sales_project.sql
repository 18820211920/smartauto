-- ===============================================
-- SmartAuto ERP 业务表结构 - Phase 3 销售/项目
-- 创建时间: 2024-05-15
-- 模块: 销售管理、项目管理
-- ===============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 客户表 crm_customer
-- ----------------------------
DROP TABLE IF EXISTS `crm_customer`;
CREATE TABLE `crm_customer` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `customer_name` varchar(100) NOT NULL COMMENT '客户名称',
  `customer_code` varchar(50) DEFAULT NULL COMMENT '客户编码',
  `customer_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-企业 1-个人 2-渠道商',
  `industry` varchar(50) DEFAULT NULL COMMENT '所属行业',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `province` varchar(50) DEFAULT NULL COMMENT '省份',
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `level` tinyint NOT NULL DEFAULT '3' COMMENT '等级: 1-重点 2-重要 3-普通 4-低价值',
  `source` varchar(50) DEFAULT NULL COMMENT '客户来源',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-潜在 1-合作中 2-已成交 3-已流失',
  `tags` varchar(255) DEFAULT NULL COMMENT '标签(逗号分隔)',
  `description` text COMMENT '备注',
  `owner_id` int DEFAULT NULL COMMENT '负责人',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- ----------------------------
-- 2. 联系人表 crm_contact
-- ----------------------------
DROP TABLE IF EXISTS `crm_contact`;
CREATE TABLE `crm_contact` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '联系人ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `contact_name` varchar(50) NOT NULL COMMENT '姓名',
  `gender` tinyint DEFAULT NULL COMMENT '性别: 0-女 1-男',
  `position` varchar(50) DEFAULT NULL COMMENT '职位',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机',
  `tel` varchar(20) DEFAULT NULL COMMENT '电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `is_primary` tinyint NOT NULL DEFAULT '0' COMMENT '主联系人: 0-否 1-是',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';

-- ----------------------------
-- 3. 报价单表 sales_quote
-- ----------------------------
DROP TABLE IF EXISTS `sales_quote`;
CREATE TABLE `sales_quote` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '报价ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '关联项目ID',
  `quote_no` varchar(50) NOT NULL COMMENT '报价单号',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `title` varchar(200) NOT NULL COMMENT '报价标题',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '总金额',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '折扣金额',
  `final_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '最终金额',
  `valid_days` int NOT NULL DEFAULT '30' COMMENT '有效期(天)',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-草稿 1-已提交 2-已确认 3-已拒绝 4-已失效',
  `version` int NOT NULL DEFAULT '1' COMMENT '版本号',
  `parent_id` int DEFAULT NULL COMMENT '原报价ID(修订时)',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quote_no` (`quote_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单表';

-- ----------------------------
-- 4. 报价明细表 sales_quote_item
-- ----------------------------
DROP TABLE IF EXISTS `sales_quote_item`;
CREATE TABLE `sales_quote_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `quote_id` int NOT NULL COMMENT '报价ID',
  `product_name` varchar(200) NOT NULL COMMENT '产品名称',
  `product_code` varchar(50) DEFAULT NULL COMMENT '产品编码',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) DEFAULT NULL COMMENT '单位',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT '数量',
  `unit_price` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '小计金额',
  `delivery_days` int DEFAULT NULL COMMENT '交期(天)',
  `description` varchar(500) DEFAULT NULL COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_quote_id` (`quote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价明细表';

-- ----------------------------
-- 5. 合同表 sales_contract
-- ----------------------------
DROP TABLE IF EXISTS `sales_contract`;
CREATE TABLE `sales_contract` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '合同ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '关联项目ID',
  `contract_no` varchar(50) NOT NULL COMMENT '合同编号',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `contract_name` varchar(200) NOT NULL COMMENT '合同名称',
  `contract_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-销售合同 1-采购合同 2-外协合同',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '合同金额',
  `received_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '已收款',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT '税率%',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '税额',
  `sign_date` date DEFAULT NULL COMMENT '签订日期',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-执行中 1-已完成 2-已终止 3-待审核',
  `attachment` varchar(500) DEFAULT NULL COMMENT '合同附件(JSON)',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contract_no` (`contract_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

-- ----------------------------
-- 6. 合同收款计划表 sales_contract_payment
-- ----------------------------
DROP TABLE IF EXISTS `sales_contract_payment`;
CREATE TABLE `sales_contract_payment` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `contract_id` int NOT NULL COMMENT '合同ID',
  `period_name` varchar(50) NOT NULL COMMENT '期次名称',
  `plan_date` date DEFAULT NULL COMMENT '计划日期',
  `plan_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '计划金额',
  `actual_date` date DEFAULT NULL COMMENT '实际日期',
  `actual_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '实际金额',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待收款 1-已收款 2-逾期',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '付款方式',
  `invoice_no` varchar(50) DEFAULT NULL COMMENT '发票号',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_contract_id` (`contract_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同收款计划表';

-- ----------------------------
-- 7. 项目任务表 prj_task
-- ----------------------------
DROP TABLE IF EXISTS `prj_task`;
CREATE TABLE `prj_task` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int NOT NULL COMMENT '项目ID',
  `parent_id` int DEFAULT NULL COMMENT '父任务ID',
  `task_name` varchar(200) NOT NULL COMMENT '任务名称',
  `task_no` varchar(50) DEFAULT NULL COMMENT '任务编号',
  `priority` tinyint NOT NULL DEFAULT '2' COMMENT '优先级: 1-紧急 2-高 3-中 4-低',
  `assignee_id` int DEFAULT NULL COMMENT '负责人',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '截止日期',
  `actual_start` date DEFAULT NULL COMMENT '实际开始',
  `actual_end` date DEFAULT NULL COMMENT '实际结束',
  `progress` int NOT NULL DEFAULT '0' COMMENT '进度%',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待开始 1-进行中 2-已完成 3-已取消',
  `description` text COMMENT '任务描述',
  `attachment` varchar(500) DEFAULT NULL COMMENT '附件(JSON)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_assignee_id` (`assignee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目任务表';

-- ----------------------------
-- 8. 项目日志表 prj_log
-- ----------------------------
DROP TABLE IF EXISTS `prj_log`;
CREATE TABLE `prj_log` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int NOT NULL COMMENT '项目ID',
  `task_id` int DEFAULT NULL COMMENT '任务ID',
  `log_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-进度 1-问题 2-变更 3-备注',
  `content` text NOT NULL COMMENT '日志内容',
  `attach_urls` varchar(500) DEFAULT NULL COMMENT '附件URL(JSON)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目日志表';

-- ----------------------------
-- 9. 项目成员表 prj_member
-- ----------------------------
DROP TABLE IF EXISTS `prj_member`;
CREATE TABLE `prj_member` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int NOT NULL COMMENT '项目ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `role` varchar(50) DEFAULT NULL COMMENT '项目角色',
  `join_date` date DEFAULT NULL COMMENT '加入日期',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员表';

-- ----------------------------
-- 10. 变更记录表 prj_change
-- ----------------------------
DROP TABLE IF EXISTS `prj_change`;
CREATE TABLE `prj_change` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int NOT NULL COMMENT '项目ID',
  `change_no` varchar(50) NOT NULL COMMENT '变更单号',
  `title` varchar(200) NOT NULL COMMENT '变更标题',
  `change_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-范围 1-进度 2-成本 3-资源',
  `before_value` text COMMENT '变更前',
  `after_value` text COMMENT '变更后',
  `reason` text COMMENT '变更原因',
  `impact` text COMMENT '影响分析',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待审批 1-已批准 2-已拒绝',
  `approver_id` int DEFAULT NULL COMMENT '审批人',
  `approve_at` datetime DEFAULT NULL COMMENT '审批时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '申请人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_change_no` (`change_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='变更记录表';

SET FOREIGN_KEY_CHECKS = 1;