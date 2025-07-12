-- 用户管理相关表结构
-- 数据库: user_db
USE user_db;

-- 用户表
CREATE TABLE t_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(100) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号码',
    email VARCHAR(100) COMMENT '邮箱地址',
    avatar VARCHAR(500) COMMENT '头像URL',
    user_type TINYINT NOT NULL DEFAULT 1 COMMENT '用户类型：1-案源端客户，2-调解中心，3-平台运营，4-系统管理员',
    organization_id BIGINT COMMENT '所属机构ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_organization (organization_id),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_created_time (created_time)
) COMMENT '用户表';

-- 角色表
CREATE TABLE t_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
    description VARCHAR(500) COMMENT '角色描述',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_role_code (role_code),
    INDEX idx_status (status)
) COMMENT '角色表';

-- 权限表
CREATE TABLE t_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_type TINYINT DEFAULT 1 COMMENT '权限类型：1-菜单，2-按钮，3-接口',
    parent_id BIGINT DEFAULT 0 COMMENT '父权限ID',
    path VARCHAR(200) COMMENT '路径/URL',
    component VARCHAR(200) COMMENT '组件名称',
    icon VARCHAR(100) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    description VARCHAR(500) COMMENT '权限描述',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_permission_code (permission_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_permission_type (permission_type),
    INDEX idx_status (status)
) COMMENT '权限表';

-- 用户角色关联表
CREATE TABLE t_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) COMMENT '用户角色关联表';

-- 角色权限关联表
CREATE TABLE t_role_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) COMMENT '角色权限关联表';

-- 机构表
CREATE TABLE t_organization (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '机构ID',
    org_code VARCHAR(50) NOT NULL UNIQUE COMMENT '机构编码',
    org_name VARCHAR(200) NOT NULL COMMENT '机构名称',
    org_type TINYINT NOT NULL COMMENT '机构类型：1-银行，2-消费金融公司，3-小贷公司，4-资产管理公司，5-律所，6-调解中心',
    parent_id BIGINT DEFAULT 0 COMMENT '父机构ID',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    address VARCHAR(500) COMMENT '详细地址',
    contact_person VARCHAR(100) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    legal_person VARCHAR(100) COMMENT '法人代表',
    business_license VARCHAR(200) COMMENT '营业执照号',
    capacity_level TINYINT DEFAULT 1 COMMENT '能力等级：1-低，2-中，3-高',
    cooperation_info TEXT COMMENT '合作信息',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_org_code (org_code),
    INDEX idx_org_type (org_type),
    INDEX idx_parent_id (parent_id),
    INDEX idx_location (province, city),
    INDEX idx_status (status)
) COMMENT '机构表';

-- 用户登录日志表
CREATE TABLE t_user_login_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    login_ip VARCHAR(50) COMMENT '登录IP',
    login_location VARCHAR(200) COMMENT '登录地点',
    browser VARCHAR(100) COMMENT '浏览器',
    os VARCHAR(100) COMMENT '操作系统',
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    login_result TINYINT DEFAULT 1 COMMENT '登录结果：1-成功，0-失败',
    failure_reason VARCHAR(500) COMMENT '失败原因',
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_login_time (login_time),
    INDEX idx_login_result (login_result)
) COMMENT '用户登录日志表';

-- 数据字典表
CREATE TABLE t_dict_type (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '字典类型ID',
    dict_code VARCHAR(100) NOT NULL UNIQUE COMMENT '字典编码',
    dict_name VARCHAR(100) NOT NULL COMMENT '字典名称',
    description VARCHAR(500) COMMENT '字典描述',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_dict_code (dict_code),
    INDEX idx_status (status)
) COMMENT '数据字典类型表';

-- 数据字典项表
CREATE TABLE t_dict_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '字典项ID',
    dict_type_id BIGINT NOT NULL COMMENT '字典类型ID',
    item_code VARCHAR(100) NOT NULL COMMENT '字典项编码',
    item_name VARCHAR(100) NOT NULL COMMENT '字典项名称',
    item_value VARCHAR(200) COMMENT '字典项值',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    description VARCHAR(500) COMMENT '字典项描述',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_dict_type_code (dict_type_id, item_code),
    INDEX idx_dict_type_id (dict_type_id),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
) COMMENT '数据字典项表';