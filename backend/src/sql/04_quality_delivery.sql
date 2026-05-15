-- ===============================================
-- SmartAuto ERP 业务表结构 - Phase 6 品检/发货/售后
-- 创建时间: 2024-05-15
-- 模块: 品检管理、发货安装、售后维保、验收闭环
-- ===============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. IQC来料检验表 qc_iqc
-- ----------------------------
DROP TABLE IF EXISTS `qc_iqc`;
CREATE TABLE `qc_iqc` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '检验ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `inbound_id` int DEFAULT NULL COMMENT '入库单ID',
  `inspect_no` varchar(50) NOT NULL COMMENT '检验单号',
  `supplier_id` int DEFAULT NULL COMMENT '供应商ID',
  `inspector_id` int DEFAULT NULL COMMENT '检验员',
  `inspect_date` date DEFAULT NULL COMMENT '检验日期',
  `batch_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '来料数量',
  `sample_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '抽样数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `rejected_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数量',
  `aql_level` varchar(10) DEFAULT NULL COMMENT 'AQL等级',
  `inspect_level` varchar(10) DEFAULT NULL COMMENT '检验水平',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待判定 1-合格 2-不合格 3-让步接收',
  `remark` text COMMENT '备注',
  `attachment` varchar(500) DEFAULT NULL COMMENT '附件(JSON)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspect_no` (`inspect_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_inbound_id` (`inbound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IQC来料检验表';

-- ----------------------------
-- 2. IQC检验明细表 qc_iqc_item
-- ----------------------------
DROP TABLE IF EXISTS `qc_iqc_item`;
CREATE TABLE `qc_iqc_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `iqc_id` int NOT NULL COMMENT '检验ID',
  `material_id` int NOT NULL COMMENT '物料ID',
  `material_code` varchar(50) DEFAULT NULL COMMENT '物料编码',
  `material_name` varchar(200) NOT NULL COMMENT '物料名称',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格',
  `check_item` varchar(100) NOT NULL COMMENT '检验项目',
  `check_method` varchar(100) DEFAULT NULL COMMENT '检验方法',
  `standard` varchar(255) DEFAULT NULL COMMENT '判定标准',
  `sample_size` int NOT NULL DEFAULT '0' COMMENT '抽样数',
  `pass_count` int NOT NULL DEFAULT '0' COMMENT '合格数',
  `fail_count` int NOT NULL DEFAULT '0' COMMENT '不合格数',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待检 1-合格 2-不合格',
  `severity` tinyint DEFAULT NULL COMMENT '严重度: 1-严重 2-一般 3-轻微',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_iqc_id` (`iqc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IQC检验明细表';

-- ----------------------------
-- 3. PQC过程检验表 qc_pqc
-- ----------------------------
DROP TABLE IF EXISTS `qc_pqc`;
CREATE TABLE `qc_pqc` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '检验ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `work_order_id` int DEFAULT NULL COMMENT '工单ID',
  `operation_id` int DEFAULT NULL COMMENT '工序ID',
  `inspect_no` varchar(50) NOT NULL COMMENT '检验单号',
  `inspector_id` int DEFAULT NULL COMMENT '检验员',
  `inspect_date` date DEFAULT NULL COMMENT '检验日期',
  `shift` varchar(20) DEFAULT NULL COMMENT '班次',
  `production_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '生产数量',
  `sample_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '抽样数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `rejected_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数量',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待判定 1-合格 2-不合格',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspect_no` (`inspect_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PQC过程检验表';

-- ----------------------------
-- 4. FQC成品检验表 qc_fqc
-- ----------------------------
DROP TABLE IF EXISTS `qc_fqc`;
CREATE TABLE `qc_fqc` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '检验ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `work_order_id` int DEFAULT NULL COMMENT '工单ID',
  `inspect_no` varchar(50) NOT NULL COMMENT '检验单号',
  `product_name` varchar(200) NOT NULL COMMENT '产品名称',
  `product_code` varchar(50) DEFAULT NULL COMMENT '产品编码',
  `inspector_id` int DEFAULT NULL COMMENT '检验员',
  `inspect_date` date DEFAULT NULL COMMENT '检验日期',
  `batch_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '批数量',
  `sample_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '抽样数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `rejected_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数量',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待判定 1-合格 2-不合格 3-特采',
  `test_report_no` varchar(50) DEFAULT NULL COMMENT '测试报告号',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspect_no` (`inspect_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='FQC成品检验表';

-- ----------------------------
-- 5. OQC出货检验表 qc_oqc
-- ----------------------------
DROP TABLE IF EXISTS `qc_oqc`;
CREATE TABLE `qc_oqc` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '检验ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `outbound_id` int DEFAULT NULL COMMENT '出库单ID',
  `inspect_no` varchar(50) NOT NULL COMMENT '检验单号',
  `customer_id` int DEFAULT NULL COMMENT '客户ID',
  `inspector_id` int DEFAULT NULL COMMENT '检验员',
  `inspect_date` date DEFAULT NULL COMMENT '检验日期',
  `batch_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '出货数量',
  `sample_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '抽样数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `rejected_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数量',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待判定 1-合格 2-不合格',
  `packing_check` tinyint DEFAULT NULL COMMENT '包装检查: 0-通过 1-不通过',
  `label_check` tinyint DEFAULT NULL COMMENT '标签检查: 0-通过 1-不通过',
  `shipping_check` tinyint DEFAULT NULL COMMENT '出货检查: 0-通过 1-不通过',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspect_no` (`inspect_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_outbound_id` (`outbound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OQC出货检验表';

-- ----------------------------
-- 6. 发货单表 delivery_order
-- ----------------------------
DROP TABLE IF EXISTS `delivery_order`;
CREATE TABLE `delivery_order` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '发货ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `outbound_id` int DEFAULT NULL COMMENT '出库单ID',
  `delivery_no` varchar(50) NOT NULL COMMENT '发货单号',
  `contract_id` int DEFAULT NULL COMMENT '合同ID',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `receiver_name` varchar(50) DEFAULT NULL COMMENT '收货人',
  `receiver_phone` varchar(20) DEFAULT NULL COMMENT '收货电话',
  `receiver_address` varchar(255) DEFAULT NULL COMMENT '收货地址',
  `delivery_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-送货 1-快递 2-自提 3-物流',
  `express_company` varchar(50) DEFAULT NULL COMMENT '快递公司',
  `tracking_no` varchar(50) DEFAULT NULL COMMENT '运单号',
  `delivery_date` date DEFAULT NULL COMMENT '发货日期',
  `estimated_arrival` date DEFAULT NULL COMMENT '预计到达',
  `actual_arrival` date DEFAULT NULL COMMENT '实际到达',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '发货金额',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待发货 1-已发货 2-运输中 3-已到达 4-已签收',
  `sign_by` varchar(50) DEFAULT NULL COMMENT '签收人',
  `sign_at` datetime DEFAULT NULL COMMENT '签收时间',
  `sign_photo` varchar(500) DEFAULT NULL COMMENT '签收照片',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_delivery_no` (`delivery_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发货单表';

-- ----------------------------
-- 7. 安装任务表 delivery_install
-- ----------------------------
DROP TABLE IF EXISTS `delivery_install`;
CREATE TABLE `delivery_install` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '安装ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `delivery_id` int NOT NULL COMMENT '发货ID',
  `install_no` varchar(50) NOT NULL COMMENT '安装单号',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `site_address` varchar(255) NOT NULL COMMENT '安装地址',
  `scheduled_start` datetime DEFAULT NULL COMMENT '计划开始',
  `scheduled_end` datetime DEFAULT NULL COMMENT '计划结束',
  `actual_start` datetime DEFAULT NULL COMMENT '实际开始',
  `actual_end` datetime DEFAULT NULL COMMENT '实际结束',
  `leader_id` int DEFAULT NULL COMMENT '安装组长',
  `team_size` int DEFAULT NULL COMMENT '人数',
  `progress` int NOT NULL DEFAULT '0' COMMENT '进度%',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待安装 1-安装中 2-调试中 3-验收中 4-已完成 5-异常',
  `check_result` tinyint DEFAULT NULL COMMENT '验收结果: 0-合格 1-不合格',
  `check_report` varchar(500) DEFAULT NULL COMMENT '验收报告',
  `customer_sign` tinyint NOT NULL DEFAULT '0' COMMENT '客户签收: 0-未签 1-已签',
  `sign_photo` varchar(500) DEFAULT NULL COMMENT '签收照片',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_install_no` (`install_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_delivery_id` (`delivery_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安装任务表';

-- ----------------------------
-- 8. 售后工单表 service_ticket
-- ----------------------------
DROP TABLE IF EXISTS `service_ticket`;
CREATE TABLE `service_ticket` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `ticket_no` varchar(50) NOT NULL COMMENT '工单号',
  `ticket_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-维修 1-保养 2-咨询 3-投诉 4-其他',
  `priority` tinyint NOT NULL DEFAULT '2' COMMENT '优先级: 1-紧急 2-高 3-中 4-低',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `contact_address` varchar(255) DEFAULT NULL COMMENT '地址',
  `product_name` varchar(200) DEFAULT NULL COMMENT '产品名称',
  `product_sn` varchar(100) DEFAULT NULL COMMENT '序列号',
  `fault_description` text NOT NULL COMMENT '故障描述',
  `fault_images` varchar(500) DEFAULT NULL COMMENT '故障图片(JSON)',
  `source` tinyint NOT NULL DEFAULT '0' COMMENT '来源: 0-客户报修 1-主动巡检 2-质量反馈',
  `assigned_to` int DEFAULT NULL COMMENT '派工人员',
  `scheduled_date` date DEFAULT NULL COMMENT '预约日期',
  `actual_date` date DEFAULT NULL COMMENT '实际上门',
  `complete_date` date DEFAULT NULL COMMENT '完成日期',
  `work_hours` decimal(10,2) DEFAULT NULL COMMENT '工时',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待派工 1-已派工 2-处理中 3-待验收 4-已完成 5-已评价 6-已关闭',
  `solution` text COMMENT '处理方案',
  `parts_used` varchar(500) DEFAULT NULL COMMENT '使用配件(JSON)',
  `customer_rating` tinyint DEFAULT NULL COMMENT '客户评分(1-5)',
  `customer_feedback` text COMMENT '客户反馈',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_assigned_to` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单表';

-- ----------------------------
-- 9. 售后工单日志表 service_log
-- ----------------------------
DROP TABLE IF EXISTS `service_log`;
CREATE TABLE `service_log` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `ticket_id` int NOT NULL COMMENT '工单ID',
  `log_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-系统 1-派工 2-上门 3-完成 4-评价',
  `content` text NOT NULL COMMENT '日志内容',
  `operator_id` int DEFAULT NULL COMMENT '操作人',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单日志表';

-- ----------------------------
-- 10. 验收单表 acceptance
-- ----------------------------
DROP TABLE IF EXISTS `acceptance`;
CREATE TABLE `acceptance` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '验收ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int NOT NULL COMMENT '项目ID',
  `acceptance_no` varchar(50) NOT NULL COMMENT '验收单号',
  `contract_id` int DEFAULT NULL COMMENT '合同ID',
  `customer_id` int NOT NULL COMMENT '客户ID',
  `inspector_id` int DEFAULT NULL COMMENT '验收人员',
  `inspect_date` date DEFAULT NULL COMMENT '验收日期',
  `inspect_method` tinyint NOT NULL DEFAULT '0' COMMENT '方式: 0-现场验收 1-远程验收 2-文件验收',
  `scope` text COMMENT '验收范围',
  `content` text COMMENT '验收内容',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待验收 1-通过 2-部分通过 3-不通过',
  `pass_rate` decimal(5,2) DEFAULT NULL COMMENT '通过率%',
  `defects` text COMMENT '不合格项',
  `report_no` varchar(50) DEFAULT NULL COMMENT '验收报告编号',
  `report_url` varchar(500) DEFAULT NULL COMMENT '验收报告URL',
  `customer_confirm` tinyint NOT NULL DEFAULT '0' COMMENT '客户确认: 0-待确认 1-已确认',
  `customer_sign` varchar(100) DEFAULT NULL COMMENT '客户签名',
  `sign_date` date DEFAULT NULL COMMENT '签字日期',
  `remark` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_acceptance_no` (`acceptance_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验收单表';

-- ----------------------------
-- 11. 验收明细表 acceptance_item
-- ----------------------------
DROP TABLE IF EXISTS `acceptance_item`;
CREATE TABLE `acceptance_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `acceptance_id` int NOT NULL COMMENT '验收ID',
  `item_name` varchar(200) NOT NULL COMMENT '验收项名称',
  `standard` varchar(255) DEFAULT NULL COMMENT '验收标准',
  `method` varchar(100) DEFAULT NULL COMMENT '验收方法',
  `result` tinyint NOT NULL DEFAULT '0' COMMENT '结果: 0-待检 1-通过 2-不通过 3-不适用',
  `data_value` varchar(255) DEFAULT NULL COMMENT '实测值',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `photo_url` varchar(500) DEFAULT NULL COMMENT '照片URL',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_acceptance_id` (`acceptance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验收明细表';

SET FOREIGN_KEY_CHECKS = 1;