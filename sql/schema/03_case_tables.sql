-- 案件管理相关表结构
-- 数据库: case_db
USE case_db;

-- 案件主表（按年分表：t_case_2024, t_case_2025...）
CREATE TABLE t_case (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL UNIQUE COMMENT '案件编号',
    batch_no VARCHAR(50) COMMENT '批次号',
    
    -- 债务人信息
    debtor_name VARCHAR(100) NOT NULL COMMENT '债务人姓名',
    debtor_id_card VARCHAR(18) NOT NULL COMMENT '债务人身份证号',
    debtor_phone VARCHAR(20) COMMENT '债务人手机号',
    debtor_address VARCHAR(500) COMMENT '债务人地址',
    
    -- 债权信息
    debt_amount DECIMAL(15,2) NOT NULL COMMENT '债务金额',
    principal_amount DECIMAL(15,2) COMMENT '本金金额',
    interest_amount DECIMAL(15,2) COMMENT '利息金额',
    penalty_amount DECIMAL(15,2) COMMENT '罚息金额',
    overdue_days INT NOT NULL DEFAULT 0 COMMENT '逾期天数',
    
    -- 产品信息
    product_name VARCHAR(200) COMMENT '产品名称',
    product_type VARCHAR(100) COMMENT '产品类型',
    contract_no VARCHAR(100) COMMENT '合同编号',
    loan_date DATE COMMENT '放款日期',
    due_date DATE COMMENT '到期日期',
    
    -- 机构信息
    source_org_id BIGINT NOT NULL COMMENT '案源机构ID',
    source_org_name VARCHAR(200) COMMENT '案源机构名称',
    assigned_mediation_id BIGINT COMMENT '分配的调解中心ID',
    assigned_mediation_name VARCHAR(200) COMMENT '分配的调解中心名称',
    assigned_time DATETIME COMMENT '分配时间',
    
    -- 案件状态
    case_status TINYINT DEFAULT 1 COMMENT '案件状态：1-待分配，2-调解中，3-调解成功，4-调解失败，5-诉讼中，6-已结案，7-已撤回',
    status_update_time DATETIME COMMENT '状态更新时间',
    
    -- 地域信息
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    
    -- 优先级和标签
    priority_level TINYINT DEFAULT 2 COMMENT '优先级：1-高，2-中，3-低',
    case_tags VARCHAR(500) COMMENT '案件标签（JSON格式）',
    risk_level TINYINT DEFAULT 2 COMMENT '风险等级：1-高，2-中，3-低',
    
    -- 督办信息
    is_supervised TINYINT DEFAULT 0 COMMENT '是否督办：1-是，0-否',
    supervision_count INT DEFAULT 0 COMMENT '督办次数',
    last_supervision_time DATETIME COMMENT '最后督办时间',
    
    -- 备注和扩展信息
    remark VARCHAR(1000) COMMENT '备注',
    ext_info JSON COMMENT '扩展信息（JSON格式）',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_no (case_no),
    INDEX idx_batch_no (batch_no),
    INDEX idx_debtor_name (debtor_name),
    INDEX idx_debtor_id_card (debtor_id_card),
    INDEX idx_source_org (source_org_id),
    INDEX idx_assigned_mediation (assigned_mediation_id),
    INDEX idx_case_status (case_status),
    INDEX idx_location (province, city),
    INDEX idx_priority_level (priority_level),
    INDEX idx_debt_amount (debt_amount),
    INDEX idx_overdue_days (overdue_days),
    INDEX idx_created_time (created_time),
    INDEX idx_status_update_time (status_update_time),
    INDEX idx_is_supervised (is_supervised)
) COMMENT '案件主表';

-- 案件材料表（按案件ID哈希分表：t_case_material_0 ~ t_case_material_15）
CREATE TABLE t_case_material (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '材料ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 材料信息
    material_type TINYINT NOT NULL COMMENT '材料类型：1-合同，2-借据，3-放款凭证，4-还款记录，5-催收记录，6-身份证，7-其他',
    material_name VARCHAR(255) NOT NULL COMMENT '材料名称',
    material_desc VARCHAR(500) COMMENT '材料描述',
    
    -- 文件信息
    file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型',
    file_hash VARCHAR(64) COMMENT '文件哈希值（用于去重）',
    
    -- 存储信息
    storage_type TINYINT DEFAULT 1 COMMENT '存储类型：1-本地，2-OSS，3-其他云存储',
    storage_path VARCHAR(500) COMMENT '存储路径',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-已删除',
    is_sensitive TINYINT DEFAULT 0 COMMENT '是否敏感文件：1-是，0-否',
    access_level TINYINT DEFAULT 1 COMMENT '访问级别：1-公开，2-内部，3-机密',
    
    -- 时间戳
    uploaded_by BIGINT COMMENT '上传人ID',
    uploaded_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_material_type (material_type),
    INDEX idx_file_hash (file_hash),
    INDEX idx_status (status),
    INDEX idx_uploaded_time (uploaded_time)
) COMMENT '案件材料表';

-- 案件操作日志表（按月分表：t_case_log_202401, t_case_log_202402...）
CREATE TABLE t_case_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 操作信息
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_name VARCHAR(100) NOT NULL COMMENT '操作名称',
    operation_desc VARCHAR(500) COMMENT '操作描述',
    
    -- 变更信息
    before_value TEXT COMMENT '变更前值',
    after_value TEXT COMMENT '变更后值',
    
    -- 操作人信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    operator_ip VARCHAR(50) COMMENT '操作IP',
    
    -- 时间戳
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_operation_type (operation_type),
    INDEX idx_operator_id (operator_id),
    INDEX idx_operation_time (operation_time)
) COMMENT '案件操作日志表';

-- 案件督办记录表
CREATE TABLE t_case_supervision (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '督办ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 督办信息
    supervision_type TINYINT DEFAULT 1 COMMENT '督办类型：1-普通督办，2-紧急督办，3-重点督办',
    supervision_reason VARCHAR(500) COMMENT '督办原因',
    supervision_content TEXT COMMENT '督办内容',
    expected_completion_time DATETIME COMMENT '期望完成时间',
    
    -- 督办人信息
    supervisor_id BIGINT NOT NULL COMMENT '督办人ID',
    supervisor_name VARCHAR(100) COMMENT '督办人姓名',
    supervisor_org_id BIGINT COMMENT '督办人机构ID',
    
    -- 处理信息
    assignee_id BIGINT COMMENT '处理人ID',
    assignee_name VARCHAR(100) COMMENT '处理人姓名',
    assignee_org_id BIGINT COMMENT '处理人机构ID',
    
    -- 状态信息
    supervision_status TINYINT DEFAULT 1 COMMENT '督办状态：1-待处理，2-处理中，3-已完成，4-已撤销',
    response_content TEXT COMMENT '回复内容',
    response_time DATETIME COMMENT '回复时间',
    completion_time DATETIME COMMENT '完成时间',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_supervisor_id (supervisor_id),
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_supervision_status (supervision_status),
    INDEX idx_created_time (created_time)
) COMMENT '案件督办记录表';

-- 案件批次信息表
CREATE TABLE t_case_batch (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '批次ID',
    batch_no VARCHAR(50) NOT NULL UNIQUE COMMENT '批次号',
    batch_name VARCHAR(200) NOT NULL COMMENT '批次名称',
    
    -- 批次信息
    source_org_id BIGINT NOT NULL COMMENT '案源机构ID',
    source_org_name VARCHAR(200) COMMENT '案源机构名称',
    total_count INT DEFAULT 0 COMMENT '总案件数',
    total_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总金额',
    
    -- 导入信息
    import_file_name VARCHAR(255) COMMENT '导入文件名',
    import_file_path VARCHAR(500) COMMENT '导入文件路径',
    import_status TINYINT DEFAULT 1 COMMENT '导入状态：1-导入中，2-导入成功，3-导入失败',
    success_count INT DEFAULT 0 COMMENT '成功导入数量',
    failed_count INT DEFAULT 0 COMMENT '失败导入数量',
    error_message TEXT COMMENT '错误信息',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_batch_no (batch_no),
    INDEX idx_source_org_id (source_org_id),
    INDEX idx_import_status (import_status),
    INDEX idx_created_time (created_time)
) COMMENT '案件批次信息表';

-- 案件统计表
CREATE TABLE t_case_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type TINYINT NOT NULL COMMENT '统计类型：1-日统计，2-月统计，3-年统计',
    
    -- 机构维度
    org_id BIGINT COMMENT '机构ID',
    org_name VARCHAR(200) COMMENT '机构名称',
    
    -- 案件数量统计
    total_cases INT DEFAULT 0 COMMENT '总案件数',
    new_cases INT DEFAULT 0 COMMENT '新增案件数',
    assigned_cases INT DEFAULT 0 COMMENT '已分配案件数',
    mediation_cases INT DEFAULT 0 COMMENT '调解中案件数',
    litigation_cases INT DEFAULT 0 COMMENT '诉讼中案件数',
    completed_cases INT DEFAULT 0 COMMENT '已完成案件数',
    
    -- 金额统计
    total_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总金额',
    new_amount DECIMAL(18,2) DEFAULT 0 COMMENT '新增金额',
    recovered_amount DECIMAL(18,2) DEFAULT 0 COMMENT '回收金额',
    
    -- 效率统计
    avg_assignment_time DECIMAL(10,2) COMMENT '平均分配时间（小时）',
    avg_mediation_time DECIMAL(10,2) COMMENT '平均调解时间（天）',
    mediation_success_rate DECIMAL(5,2) COMMENT '调解成功率（%）',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_stat_date_type_org (stat_date, stat_type, org_id),
    INDEX idx_stat_date (stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_org_id (org_id)
) COMMENT '案件统计表';