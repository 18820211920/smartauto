-- SmartAuto 数据库初始化脚本
-- 执行: mysql -u root -p < init.sql

CREATE DATABASE IF NOT EXISTS smartauto DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartauto;

-- ===== 1. sys_package 套餐表（先建，租户依赖）=====
CREATE TABLE IF NOT EXISTS sys_package (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  package_code VARCHAR(32) NOT NULL UNIQUE COMMENT '套餐编码',
  package_name VARCHAR(64) NOT NULL COMMENT '套餐名称',
  package_type TINYINT NOT NULL DEFAULT 2 COMMENT '1=试用 2=付费',
  price_monthly DECIMAL(10,2) DEFAULT 0 COMMENT '月费',
  price_yearly DECIMAL(10,2) DEFAULT 0 COMMENT '年费',
  max_users INT NOT NULL DEFAULT 5 COMMENT '最大用户数',
  max_projects INT NOT NULL DEFAULT 2 COMMENT '最大项目数',
  features JSON COMMENT '功能清单',
  data_retention_days INT DEFAULT 365 COMMENT '数据保留天数',
  support_level VARCHAR(32) DEFAULT '基础' COMMENT '支持级别',
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 0 COMMENT '0=启用 1=停用',
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_package_code (package_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套餐表';

-- ===== 2. sys_tenant 租户表 ======
CREATE TABLE IF NOT EXISTS sys_tenant (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_code VARCHAR(32) NOT NULL UNIQUE COMMENT '租户编码',
  tenant_name VARCHAR(128) NOT NULL COMMENT '租户名称',
  contact_name VARCHAR(64) DEFAULT '',
  contact_phone VARCHAR(32) DEFAULT '',
  contact_email VARCHAR(128) DEFAULT '',
  package_id BIGINT NOT NULL COMMENT '订阅套餐ID',
  package_start DATE COMMENT '套餐开始日期',
  package_expire DATE COMMENT '套餐到期日期',
  max_users INT DEFAULT 5 COMMENT '最大用户数',
  max_projects INT DEFAULT 2 COMMENT '最大项目数',
  storage_quota_mb BIGINT DEFAULT 1024 COMMENT '存储配额MB',
  status TINYINT DEFAULT 0 COMMENT '0=正常 1=冻结 2=欠费',
  remark VARCHAR(512) DEFAULT '',
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_tenant_code (tenant_code),
  INDEX idx_status (status),
  INDEX idx_package_expire (package_expire),
  FOREIGN KEY (package_id) REFERENCES sys_package(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户主表';

-- ===== 3. sys_dept 部门表 ======
CREATE TABLE IF NOT EXISTS sys_dept (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  parent_id BIGINT DEFAULT 0,
  dept_name VARCHAR(64) NOT NULL COMMENT '部门名称',
  dept_code VARCHAR(32) DEFAULT '',
  leader_user_id BIGINT,
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 0,
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_tenant (tenant_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- ===== 4. sys_role 角色表 ======
CREATE TABLE IF NOT EXISTS sys_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT COMMENT '所属租户（NULL=系统内置）',
  role_code VARCHAR(64) NOT NULL COMMENT '角色编码',
  role_name VARCHAR(64) NOT NULL COMMENT '角色名称',
  role_type TINYINT DEFAULT 2 COMMENT '1=系统内置 2=租户自建',
  data_scope TINYINT DEFAULT 1 COMMENT '1=全部 2=本部门 3=本人 4=自定义',
  dept_id BIGINT COMMENT '数据权限部门',
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 0,
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_tenant (tenant_id),
  INDEX idx_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ===== 5. sys_permission 权限表 ======
CREATE TABLE IF NOT EXISTS sys_permission (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  permission_code VARCHAR(128) NOT NULL UNIQUE COMMENT '权限编码',
  permission_name VARCHAR(64) NOT NULL COMMENT '权限名称',
  module VARCHAR(32) NOT NULL COMMENT '模块',
  menu VARCHAR(64) DEFAULT '',
  action VARCHAR(32) DEFAULT '',
  permission_type TINYINT DEFAULT 1 COMMENT '1=菜单 2=按钮 3=数据字段',
  parent_id BIGINT DEFAULT 0,
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_module (module),
  INDEX idx_permission_code (permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- ===== 6. sys_role_permission 角色-权限关联表 ======
CREATE TABLE IF NOT EXISTS sys_role_permission (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  UNIQUE INDEX idx_role_perm (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES sys_role(id),
  FOREIGN KEY (permission_id) REFERENCES sys_permission(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ===== 7. sys_user 用户表 ======
CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  real_name VARCHAR(64) DEFAULT '',
  phone VARCHAR(32) DEFAULT '',
  email VARCHAR(128) DEFAULT '',
  avatar VARCHAR(512) DEFAULT '',
  dept_id BIGINT,
  status TINYINT DEFAULT 0 COMMENT '0=正常 1=冻结 2=待激活',
  last_login_at DATETIME,
  last_login_ip VARCHAR(64),
  login_count INT DEFAULT 0,
  pwd_expire_at DATE,
  pwd_force_change TINYINT DEFAULT 0,
  failed_login_count INT DEFAULT 0,
  lock_expire_at DATETIME,
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_tenant (tenant_id),
  INDEX idx_username (username),
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  FOREIGN KEY (tenant_id) REFERENCES sys_tenant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ===== 8. sys_user_role 用户-角色关联表 ======
CREATE TABLE IF NOT EXISTS sys_user_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  tenant_id BIGINT NOT NULL,
  project_id BIGINT COMMENT '限定项目（NULL=全租户）',
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  UNIQUE INDEX idx_user_role (user_id, role_id, project_id),
  FOREIGN KEY (user_id) REFERENCES sys_user(id),
  FOREIGN KEY (role_id) REFERENCES sys_role(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ===== 9. sys_menu 菜单表 ======
CREATE TABLE IF NOT EXISTS sys_menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT DEFAULT 0,
  menu_name VARCHAR(64) NOT NULL,
  menu_code VARCHAR(64) DEFAULT '',
  menu_type TINYINT DEFAULT 2 COMMENT '1=目录 2=菜单 3=按钮',
  path VARCHAR(256) DEFAULT '',
  component VARCHAR(256) DEFAULT '',
  icon VARCHAR(128) DEFAULT '',
  sort_order INT DEFAULT 0,
  visible TINYINT DEFAULT 0 COMMENT '0=显示 1=隐藏',
  cache TINYINT DEFAULT 0 COMMENT '0=缓存 1=不缓存',
  status TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';

-- ===== 10. sys_login_log 登录日志 ======
CREATE TABLE IF NOT EXISTS sys_login_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT DEFAULT 0,
  user_id BIGINT DEFAULT 0,
  username VARCHAR(64) DEFAULT '',
  ip VARCHAR(64) DEFAULT '',
  location VARCHAR(256) DEFAULT '',
  device VARCHAR(128) DEFAULT '',
  browser VARCHAR(128) DEFAULT '',
  os VARCHAR(64) DEFAULT '',
  login_status TINYINT DEFAULT 0 COMMENT '0=成功 1=失败',
  fail_reason VARCHAR(256) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志表';

-- ===== 11. sys_tenant_project 租户项目表 ======
CREATE TABLE IF NOT EXISTS sys_tenant_project (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_code VARCHAR(64) NOT NULL,
  project_name VARCHAR(128) NOT NULL,
  project_type VARCHAR(32) DEFAULT 'standard' COMMENT 'standard=标准 non_standard=非标',
  status TINYINT DEFAULT 0 COMMENT '0=正常 1=暂停 2=完成 3=归档',
  start_date DATE,
  end_date DATE,
  manager_user_id BIGINT,
  description VARCHAR(1024) DEFAULT '',
  created_by BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  UNIQUE INDEX idx_tenant_code (tenant_id, project_code),
  INDEX idx_status (status),
  FOREIGN KEY (tenant_id) REFERENCES sys_tenant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户项目表';

-- ===== 初始化套餐数据 ======
INSERT INTO sys_package (package_code, package_name, package_type, price_monthly, price_yearly, max_users, max_projects, features, support_level, sort_order) VALUES
('trial', '试用版', 1, 0.00, 0.00, 5, 2, '{"sales":true,"purchase":false,"warehouse":true,"production":false,"quality":false,"finance":false,"hr":false,"ai_assistant":false}', '基础', 0),
('basic', '基础版', 2, 299.00, 2990.00, 10, 5, '{"sales":true,"purchase":true,"warehouse":true,"production":false,"quality":false,"finance":false,"hr":false,"ai_assistant":false}', '基础', 1),
('standard', '标准版', 2, 599.00, 5990.00, 30, 20, '{"sales":true,"purchase":true,"warehouse":true,"production":true,"quality":true,"finance":false,"hr":false,"ai_assistant":true}', '标准', 2),
('professional', '专业版', 2, 1299.00, 12990.00, 100, 50, '{"sales":true,"purchase":true,"warehouse":true,"production":true,"quality":true,"finance":true,"hr":false,"ai_assistant":true}', '专业', 3),
('flagship', '旗舰版', 2, 2999.00, 29990.00, 999, 999, '{"sales":true,"purchase":true,"warehouse":true,"production":true,"quality":true,"finance":true,"hr":true,"ai_assistant":true}', '尊享', 4);

-- ===== 初始化系统内置角色 ======
INSERT INTO sys_role (tenant_id, role_code, role_name, role_type, data_scope, sort_order) VALUES
(NULL, 'super_admin', '超级管理员', 1, 1, 1),
(NULL, 'project_manager', '项目经理', 1, 1, 2),
(NULL, 'designer', '设计师', 1, 3, 3),
(NULL, 'buyer', '采购员', 1, 2, 4),
(NULL, 'warehouse_keeper', '仓管员', 1, 2, 5),
(NULL, 'quality_inspector', '品检员', 1, 2, 6),
(NULL, 'finance', '财务', 1, 1, 7),
(NULL, 'hr', '人事', 1, 1, 8),
(NULL, 'sales', '销售员', 1, 3, 9);

-- ===== 初始化权限数据 ======
INSERT INTO sys_permission (permission_code, permission_name, module, menu, action, permission_type, sort_order) VALUES
-- 销售模块
('sales:customer:read', '客户-查看', 'sales', 'sales/customer', 'read', 2, 1),
('sales:customer:create', '客户-新增', 'sales', 'sales/customer', 'create', 2, 2),
('sales:customer:update', '客户-编辑', 'sales', 'sales/customer', 'update', 2, 3),
('sales:customer:delete', '客户-删除', 'sales', 'sales/customer', 'delete', 2, 4),
('sales:customer:export', '客户-导出', 'sales', 'sales/customer', 'export', 2, 5),
('sales:quote:read', '报价-查看', 'sales', 'sales/quote', 'read', 2, 6),
('sales:quote:create', '报价-新增', 'sales', 'sales/quote', 'create', 2, 7),
('sales:quote:update', '报价-编辑', 'sales', 'sales/quote', 'update', 2, 8),
('sales:quote:approve', '报价-审批', 'sales', 'sales/quote', 'approve', 2, 9),
('sales:contract:read', '合同-查看', 'sales', 'sales/contract', 'read', 2, 10),
('sales:contract:create', '合同-新增', 'sales', 'sales/contract', 'create', 2, 11),
('sales:contract:update', '合同-编辑', 'sales', 'sales/contract', 'update', 2, 12),
-- 项目管理模块
('project:info:read', '项目-查看', 'project', 'project/info', 'read', 2, 20),
('project:task:read', '任务-查看', 'project', 'project/task', 'read', 2, 21),
('project:task:create', '任务-新增', 'project', 'project/task', 'create', 2, 22),
('project:task:update', '任务-更新', 'project', 'project/task', 'update', 2, 23);