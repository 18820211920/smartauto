-- ===============================================
-- SmartAuto ERP 系统表结构 v1.0
-- 创建时间: 2024-05-14
-- 说明: Phase 1 基础框架 - SaaS租户系统核心表
-- ===============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 订阅套餐表 sys_package
-- ----------------------------
DROP TABLE IF EXISTS `sys_package`;
CREATE TABLE `sys_package` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '套餐ID',
  `package_code` varchar(50) NOT NULL COMMENT '套餐编码',
  `package_name` varchar(100) NOT NULL COMMENT '套餐名称',
  `package_type` tinyint NOT NULL DEFAULT '2' COMMENT '类型: 1-试用(30天) 2-年费(365天)',
  `price` decimal(10,2) DEFAULT '0.00' COMMENT '价格(元/月)',
  `user_limit` int NOT NULL DEFAULT '5' COMMENT '用户数上限',
  `project_limit` int NOT NULL DEFAULT '3' COMMENT '项目数上限',
  `storage_limit` int NOT NULL DEFAULT '1' COMMENT '存储上限(GB)',
  `ai_quota` int NOT NULL DEFAULT '1000' COMMENT 'AI调用配额(次/月)',
  `features` text COMMENT '功能清单(JSON)',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-启用 1-禁用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_package_code` (`package_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅套餐表';

-- ----------------------------
-- 2. 租户表 sys_tenant
-- ----------------------------
DROP TABLE IF EXISTS `sys_tenant`;
CREATE TABLE `sys_tenant` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '租户ID',
  `tenant_code` varchar(50) NOT NULL COMMENT '租户编码',
  `tenant_name` varchar(100) NOT NULL COMMENT '租户名称',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `industry` varchar(50) DEFAULT NULL COMMENT '所属行业',
  `company_size` varchar(20) DEFAULT NULL COMMENT '公司规模',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `package_id` int DEFAULT NULL COMMENT '套餐ID',
  `package_expire` date DEFAULT NULL COMMENT '套餐到期日',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-正常 1-冻结',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_code` (`tenant_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户表';

-- ----------------------------
-- 3. 部门表 sys_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `parent_id` int DEFAULT NULL COMMENT '上级部门ID',
  `dept_name` varchar(50) NOT NULL COMMENT '部门名称',
  `dept_code` varchar(50) DEFAULT NULL COMMENT '部门编码',
  `manager_id` int DEFAULT NULL COMMENT '部门负责人',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- ----------------------------
-- 4. 用户表 sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `dept_id` int DEFAULT NULL COMMENT '部门ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码(bcrypt)',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-正常 1-冻结 2-锁定',
  `failed_login_count` int NOT NULL DEFAULT '0' COMMENT '连续失败次数',
  `lock_expire_at` datetime DEFAULT NULL COMMENT '锁定过期时间',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `login_count` int NOT NULL DEFAULT '0' COMMENT '登录次数',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------
-- 5. 角色表 sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `tenant_id` int DEFAULT NULL COMMENT '租户ID(为空=系统级角色)',
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL COMMENT '角色编码',
  `role_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型: 0-租户级 1-系统级',
  `data_scope` tinyint NOT NULL DEFAULT '0' COMMENT '数据范围: 0-全部 1-本部门及下级 2-本部门 3-仅本人',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ----------------------------
-- 6. 权限表 sys_permission
-- ----------------------------
DROP TABLE IF EXISTS `sys_permission`;
CREATE TABLE `sys_permission` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `permission_name` varchar(50) NOT NULL COMMENT '权限名称',
  `permission_code` varchar(100) NOT NULL COMMENT '权限编码',
  `module` varchar(50) DEFAULT NULL COMMENT '所属模块',
  `type` tinyint NOT NULL DEFAULT '1' COMMENT '类型: 1-菜单 2-按钮 3-接口',
  `parent_id` int DEFAULT NULL COMMENT '上级权限ID',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- ----------------------------
-- 7. 菜单表 sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `menu_name` varchar(50) NOT NULL COMMENT '菜单名称',
  `parent_id` int DEFAULT NULL COMMENT '上级菜单ID',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `visible` tinyint NOT NULL DEFAULT '0' COMMENT '显示: 0-显示 1-隐藏',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';

-- ----------------------------
-- 8. 用户角色关联表 sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ----------------------------
-- 9. 角色权限关联表 sys_role_permission
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_permission`;
CREATE TABLE `sys_role_permission` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `permission_id` int NOT NULL COMMENT '权限ID',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ----------------------------
-- 10. 租户项目表 sys_tenant_project
-- ----------------------------
DROP TABLE IF EXISTS `sys_tenant_project`;
CREATE TABLE `sys_tenant_project` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `tenant_id` int NOT NULL COMMENT '租户ID',
  `project_name` varchar(100) NOT NULL COMMENT '项目名称',
  `project_code` varchar(50) DEFAULT NULL COMMENT '项目编码',
  `project_type` varchar(50) DEFAULT NULL COMMENT '项目类型',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态: 0-进行中 1-完成 2-暂停 3-终止',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `manager_id` int DEFAULT NULL COMMENT '项目经理',
  `description` text COMMENT '项目描述',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '删除标记',
  `created_by` int DEFAULT NULL COMMENT '创建人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户项目表';

-- ----------------------------
-- 初始化数据
-- ----------------------------

-- 插入默认套餐
INSERT INTO `sys_package` (`package_code`, `package_name`, `package_type`, `price`, `user_limit`, `project_limit`, `storage_limit`, `ai_quota`, `features`, `status`, `sort_order`) VALUES
('trial', '试用版', 1, 0.00, 3, 1, 1, 100, '{"modules":["sales","project"],"aiEnabled":false}', 0, 1),
('basic', '基础版', 2, 299.00, 10, 5, 5, 1000, '{"modules":["sales","project","rnd","purchase"],"aiEnabled":true}', 0, 2),
('professional', '专业版', 2, 999.00, 30, 20, 20, 5000, '{"modules":["all"],"aiEnabled":true}', 0, 3),
('enterprise', '企业版', 2, 2999.00, 100, 50, 100, 20000, '{"modules":["all"],"aiEnabled":true,"customAI":true}', 0, 4);

-- 插入系统级角色
INSERT INTO `sys_role` (`role_name`, `role_code`, `role_type`, `data_scope`, `description`, `sort_order`) VALUES
('超级管理员', 'super_admin', 1, 0, '系统超级管理员，拥有全部权限', 1),
('租户管理员', 'tenant_admin', 1, 0, '租户管理员，管理本租户', 2),
('普通用户', 'user', 1, 3, '普通用户，仅能访问本人数据', 3);

SET FOREIGN_KEY_CHECKS = 1;