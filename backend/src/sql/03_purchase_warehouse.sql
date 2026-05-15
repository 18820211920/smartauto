-- ===============================================
-- SmartAuto ERP 业务表结构 - Phase 5 采购/仓库/生产
-- 创建时间: 2024-05-15
-- 模块: 采购管理、仓库物料、生产装配
-- ===============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 供应商表 pur_supplier
-- ----------------------------
DROP TABLE IF EXISTS `pur_supplier`;
CREATE TABLE `pur_supplier` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '供应商ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `supplier_name` varchar(100) NOT NULL COMMENT '供应商名称',
  `supplier_code` varchar(50) DEFAULT NULL COMMENT '供应商编码',
  `supplier_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-厂商 1-代理商 2-贸易商',
  `category` varchar(50) DEFAULT NULL COMMENT '供应类别',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `level` tinyint NOT NULL DEFAULT '3' COMMENT '等级: 1-战略 2-优秀 3-普通 4-淘汰',
  `payment_days` int DEFAULT NULL COMMENT '账期(天)',
  `tax_rate` decimal(5,2) DEFAULT '0.00' COMMENT '税率%',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '开户银行',
  `bank_account` varchar(50) DEFAULT NULL COMMENT '银行账号',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-正常 1-暂停 2-禁用',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商表';

-- ----------------------------
-- 2. 采购申请表 pur_requisition
-- ----------------------------
DROP TABLE IF EXISTS `pur_requisition`;
CREATE TABLE `pur_requisition` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `requisition_no` varchar(50) NOT NULL COMMENT '申请单号',
  `department` varchar(50) DEFAULT NULL COMMENT '申请部门',
  `applicant_id` int DEFAULT NULL COMMENT '申请人',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '总金额',
  `urgency` tinyint NOT NULL DEFAULT '2' COMMENT '紧急度: 1-紧急 2-普通 3-计划',
  `purpose` text COMMENT '采购用途',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待审批 1-审批中 2-已批准 3-已驳回 4-已关闭',
  `approver_id` int DEFAULT NULL COMMENT '审批人',
  `approve_at` datetime DEFAULT NULL COMMENT '审批时间',
  `approve_remark` varchar(255) DEFAULT NULL COMMENT '审批备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_requisition_no` (`requisition_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购申请表';

-- ----------------------------
-- 3. 采购申请明细表 pur_requisition_item
-- ----------------------------
DROP TABLE IF EXISTS `pur_requisition_item`;
CREATE TABLE `pur_requisition_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `requisition_id` int NOT NULL COMMENT '申请ID',
  `material_code` varchar(50) DEFAULT NULL COMMENT '物料编码',
  `material_name` varchar(200) NOT NULL COMMENT '物料名称',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) DEFAULT NULL COMMENT '单位',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT '申请数量',
  `unit_price` decimal(15,4) DEFAULT '0.00' COMMENT '预估单价',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '小计金额',
  `supplier_id` int DEFAULT NULL COMMENT '推荐供应商',
  `required_date` date DEFAULT NULL COMMENT '需求日期',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_requisition_id` (`requisition_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购申请明细表';

-- ----------------------------
-- 4. 采购订单表 pur_order
-- ----------------------------
DROP TABLE IF EXISTS `pur_order`;
CREATE TABLE `pur_order` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `requisition_id` int DEFAULT NULL COMMENT '采购申请ID',
  `supplier_id` int NOT NULL COMMENT '供应商ID',
  `order_no` varchar(50) NOT NULL COMMENT '订单号',
  `order_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-标准采购 1-紧急采购 2-合同采购',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '订单金额',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '税额',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '折扣',
  `final_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '最终金额',
  `sign_date` date DEFAULT NULL COMMENT '签订日期',
  `delivery_date` date DEFAULT NULL COMMENT '交货日期',
  `payment_terms` varchar(50) DEFAULT NULL COMMENT '付款条件',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待确认 1-已确认 2-部分到货 3-已完成 4-已取消',
  `invoice_status` tinyint NOT NULL DEFAULT '0' COMMENT '发票状态: 0-未开 1-部分 2-已开',
  `description` text COMMENT '备注',
  `attachment` varchar(500) DEFAULT NULL COMMENT '附件(JSON)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购订单表';

-- ----------------------------
-- 5. 采购订单明细表 pur_order_item
-- ----------------------------
DROP TABLE IF EXISTS `pur_order_item`;
CREATE TABLE `pur_order_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `material_code` varchar(50) DEFAULT NULL COMMENT '物料编码',
  `material_name` varchar(200) NOT NULL COMMENT '物料名称',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) DEFAULT NULL COMMENT '单位',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT '订单数量',
  `unit_price` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT '税率%',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '金额',
  `delivered_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '已到货数量',
  `accepted_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '已验收数量',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购订单明细表';

-- ----------------------------
-- 6. 物料表 inv_material
-- ----------------------------
DROP TABLE IF EXISTS `inv_material`;
CREATE TABLE `inv_material` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '物料ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `material_code` varchar(50) NOT NULL COMMENT '物料编码',
  `material_name` varchar(200) NOT NULL COMMENT '物料名称',
  `category_id` int DEFAULT NULL COMMENT '分类ID',
  `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) DEFAULT NULL COMMENT '单位',
  `safety_stock` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '安全库存',
  `min_stock` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '最小库存',
  `max_stock` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '最大库存',
  `standard_cost` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '标准成本',
  `image_url` varchar(500) DEFAULT NULL COMMENT '图片URL',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_code` (`material_code`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料表';

-- ----------------------------
-- 7. 物料分类表 inv_category
-- ----------------------------
DROP TABLE IF EXISTS `inv_category`;
CREATE TABLE `inv_category` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `parent_id` int DEFAULT NULL COMMENT '上级分类',
  `category_name` varchar(100) NOT NULL COMMENT '分类名称',
  `category_code` varchar(50) DEFAULT NULL COMMENT '分类编码',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料分类表';

-- ----------------------------
-- 8. 仓库表 inv_warehouse
-- ----------------------------
DROP TABLE IF EXISTS `inv_warehouse`;
CREATE TABLE `inv_warehouse` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '仓库ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `warehouse_code` varchar(50) NOT NULL COMMENT '仓库编码',
  `warehouse_name` varchar(100) NOT NULL COMMENT '仓库名称',
  `warehouse_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-原料仓 1-成品仓 2-在制品仓 3-不合格品仓',
  `province` varchar(50) DEFAULT NULL COMMENT '省份',
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `manager_id` int DEFAULT NULL COMMENT '仓库管理员',
  `capacity` decimal(15,2) DEFAULT NULL COMMENT '容量(平米)',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_code` (`warehouse_code`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库表';

-- ----------------------------
-- 9. 库位表 inv_location
-- ----------------------------
DROP TABLE IF EXISTS `inv_location`;
CREATE TABLE `inv_location` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '库位ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `warehouse_id` int NOT NULL COMMENT '仓库ID',
  `location_code` varchar(50) NOT NULL COMMENT '库位编码',
  `location_name` varchar(100) DEFAULT NULL COMMENT '库位名称',
  `zone` varchar(50) DEFAULT NULL COMMENT '区域',
  `shelf` varchar(50) DEFAULT NULL COMMENT '货架',
  `layer` varchar(20) DEFAULT NULL COMMENT '层',
  `position` varchar(20) DEFAULT NULL COMMENT '位',
  `location_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-存储 1-暂存 2-待检 3-退货',
  `capacity` int DEFAULT NULL COMMENT '容量',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-可用 1-占用 2-维护',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_location_code` (`location_code`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_warehouse_id` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库位表';

-- ----------------------------
-- 10. 库存表 inv_stock
-- ----------------------------
DROP TABLE IF EXISTS `inv_stock`;
CREATE TABLE `inv_stock` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '库存ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `material_id` int NOT NULL COMMENT '物料ID',
  `warehouse_id` int NOT NULL COMMENT '仓库ID',
  `location_id` int DEFAULT NULL COMMENT '库位ID',
  `batch_no` varchar(50) DEFAULT NULL COMMENT '批次号',
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '库存数量',
  `frozen_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '冻结数量',
  `available_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '可用数量',
  `unit_cost` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '单位成本',
  `total_cost` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '总成本',
  `inbound_date` date DEFAULT NULL COMMENT '入库日期',
  `expire_date` date DEFAULT NULL COMMENT '有效期',
  `supplier_id` int DEFAULT NULL COMMENT '供应商',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_warehouse_batch` (`material_id`, `warehouse_id`, `batch_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_material_id` (`material_id`),
  KEY `idx_warehouse_id` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- ----------------------------
-- 11. 入库单表 inv_inbound
-- ----------------------------
DROP TABLE IF EXISTS `inv_inbound`;
CREATE TABLE `inv_inbound` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '入库ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `inbound_no` varchar(50) NOT NULL COMMENT '入库单号',
  `inbound_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-采购入库 1-生产入库 2-退货入库 3-调拨入库',
  `supplier_id` int DEFAULT NULL COMMENT '供应商(采购用)',
  `order_id` int DEFAULT NULL COMMENT '关联订单',
  `warehouse_id` int NOT NULL COMMENT '仓库ID',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '总金额',
  `check_status` tinyint NOT NULL DEFAULT '0' COMMENT '质检状态: 0-待检 1-已检 2-部分合格',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待入库 1-已入库 2-已取消',
  `inbound_date` date DEFAULT NULL COMMENT '入库日期',
  `handler_id` int DEFAULT NULL COMMENT '经办人',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inbound_no` (`inbound_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_warehouse_id` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库单表';

-- ----------------------------
-- 12. 入库明细表 inv_inbound_item
-- ----------------------------
DROP TABLE IF EXISTS `inv_inbound_item`;
CREATE TABLE `inv_inbound_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `inbound_id` int NOT NULL COMMENT '入库ID',
  `material_id` int NOT NULL COMMENT '物料ID',
  `batch_no` varchar(50) DEFAULT NULL COMMENT '批次号',
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `rejected_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数量',
  `unit_cost` decimal(15,4) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '金额',
  `location_id` int DEFAULT NULL COMMENT '库位ID',
  `expire_date` date DEFAULT NULL COMMENT '有效期',
  `qc_result` tinyint DEFAULT NULL COMMENT '质检结果: 0-合格 1-不合格 2-让步接收',
  `qc_remark` varchar(255) DEFAULT NULL COMMENT '质检备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_inbound_id` (`inbound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入库明细表';

-- ----------------------------
-- 13. 出库单表 inv_outbound
-- ----------------------------
DROP TABLE IF EXISTS `inv_outbound`;
CREATE TABLE `inv_outbound` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '出库ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `outbound_no` varchar(50) NOT NULL COMMENT '出库单号',
  `outbound_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-生产领料 1-销售出库 2-调拨出库 3-退货出库',
  `warehouse_id` int NOT NULL COMMENT '仓库ID',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '总金额',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待出库 1-已出库 2-已取消',
  `outbound_date` date DEFAULT NULL COMMENT '出库日期',
  `recipient` varchar(50) DEFAULT NULL COMMENT '领料人/收货人',
  `handler_id` int DEFAULT NULL COMMENT '经办人',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_no` (`outbound_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_warehouse_id` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出库单表';

-- ----------------------------
-- 14. 生产工单表 pro_work_order
-- ----------------------------
DROP TABLE IF EXISTS `pro_work_order`;
CREATE TABLE `pro_work_order` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_id` int DEFAULT NULL COMMENT '项目ID',
  `work_order_no` varchar(50) NOT NULL COMMENT '工单号',
  `product_name` varchar(200) NOT NULL COMMENT '产品名称',
  `product_code` varchar(50) DEFAULT NULL COMMENT '产品编码',
  `bom_id` int DEFAULT NULL COMMENT 'BOM ID',
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00' COMMENT '生产数量',
  `completed_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '已完成数量',
  `qualified_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数量',
  `workshop` varchar(50) DEFAULT NULL COMMENT '生产车间',
  `workstation` varchar(50) DEFAULT NULL COMMENT '工位',
  `priority` tinyint NOT NULL DEFAULT '2' COMMENT '优先级: 1-紧急 2-高 3-中 4-低',
  `planned_start` datetime DEFAULT NULL COMMENT '计划开始',
  `planned_end` datetime DEFAULT NULL COMMENT '计划结束',
  `actual_start` datetime DEFAULT NULL COMMENT '实际开始',
  `actual_end` datetime DEFAULT NULL COMMENT '实际结束',
  `progress` int NOT NULL DEFAULT '0' COMMENT '进度%',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待生产 1-生产中 2-已完成 3-已暂停 4-已取消',
  `description` text COMMENT '备注',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_order_no` (`work_order_no`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生产工单表';

-- ----------------------------
-- 15. 生产工序表 pro_operation
-- ----------------------------
DROP TABLE IF EXISTS `pro_operation`;
CREATE TABLE `pro_operation` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工序ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `work_order_id` int NOT NULL COMMENT '工单ID',
  `operation_name` varchar(100) NOT NULL COMMENT '工序名称',
  `operation_no` varchar(50) DEFAULT NULL COMMENT '工序编号',
  `workstation` varchar(50) DEFAULT NULL COMMENT '工位',
  `worker_id` int DEFAULT NULL COMMENT '作业员',
  `planned_hours` decimal(10,2) DEFAULT NULL COMMENT '计划工时',
  `actual_hours` decimal(10,2) DEFAULT NULL COMMENT '实际工时',
  `planned_start` datetime DEFAULT NULL COMMENT '计划开始',
  `planned_end` datetime DEFAULT NULL COMMENT '计划结束',
  `actual_start` datetime DEFAULT NULL COMMENT '实际开始',
  `actual_end` datetime DEFAULT NULL COMMENT '实际结束',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-待生产 1-进行中 2-已完成 3-异常',
  `quality_status` tinyint DEFAULT NULL COMMENT '质量状态: 0-待检 1-合格 2-不合格',
  `pass_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '合格数',
  `fail_qty` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '不合格数',
  `description` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_work_order_id` (`work_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生产工序表';

SET FOREIGN_KEY_CHECKS = 1;