-- 案件管理相关表结构（增强版）
-- 数据库: case_db
-- 基于 case_info_schema_final.txt 文档更新
USE case_db;

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS t_case_statistics;
DROP TABLE IF EXISTS t_case_batch;
DROP TABLE IF EXISTS t_case_supervision;
DROP TABLE IF EXISTS t_case_log;
DROP TABLE IF EXISTS t_case_material;
DROP TABLE IF EXISTS t_case;

-- 案件主表（增强版，包含完整的案件信息）
CREATE TABLE t_case (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL UNIQUE COMMENT '案件编号',
    batch_no VARCHAR(50) COMMENT '批次号',
    
    -- 借据和合同信息
    iou_number VARCHAR(100) COMMENT '借据编号',
    contract_amount DECIMAL(15,2) COMMENT '合同金额',
    
    -- 债务人基本信息
    debtor_id VARCHAR(50) NOT NULL COMMENT '债务人编号',
    debtor_name VARCHAR(100) NOT NULL COMMENT '客户姓名/债务人姓名',
    debtor_id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
    debtor_phone VARCHAR(20) COMMENT '手机号',
    gender TINYINT COMMENT '性别：1-男，2-女',
    education VARCHAR(50) COMMENT '学历',
    ethnicity VARCHAR(50) COMMENT '民族',
    marital_status VARCHAR(50) COMMENT '婚姻状况',
    
    -- 地址信息
    household_province VARCHAR(50) COMMENT '户籍所在省',
    household_city VARCHAR(50) COMMENT '户籍所在市',
    household_address VARCHAR(500) COMMENT '户籍详细地址',
    current_province VARCHAR(50) COMMENT '现居省',
    current_city VARCHAR(50) COMMENT '现居市',
    current_address VARCHAR(500) COMMENT '现居地址',
    
    -- 工作信息
    company_name VARCHAR(200) COMMENT '单位名称',
    job_position VARCHAR(100) COMMENT '职务',
    company_phone VARCHAR(20) COMMENT '单位电话',
    company_province VARCHAR(50) COMMENT '单位所在省',
    company_city VARCHAR(50) COMMENT '单位所在市',
    company_address VARCHAR(500) COMMENT '单位地址',
    
    -- 借款产品信息
    loan_project VARCHAR(200) COMMENT '借款项目/产品线',
    loan_amount DECIMAL(15,2) NOT NULL COMMENT '贷款金额',
    product_name VARCHAR(200) COMMENT '贷款商品名称',
    product_type VARCHAR(100) COMMENT '商品类型',
    product_price DECIMAL(15,2) COMMENT '商品价格',
    down_payment DECIMAL(15,2) COMMENT '商品首付',
    
    -- 还款信息
    total_periods INT COMMENT '总期数',
    monthly_payment DECIMAL(10,2) COMMENT '月还款额',
    monthly_interest_rate VARCHAR(20) COMMENT '月利率',
    monthly_fee_rate VARCHAR(20) COMMENT '月费率',
    annual_interest_rate VARCHAR(20) COMMENT '年化利率',
    repayment_method VARCHAR(100) COMMENT '还款方式',
    min_payment_amount DECIMAL(10,2) COMMENT '最低还款额',
    
    -- 时间节点
    loan_date DATE COMMENT '放款日',
    first_repayment_date DATE COMMENT '首期还款日',
    loan_due_date DATE COMMENT '贷款到期日',
    overdue_date DATE COMMENT '逾期日期',
    
    -- 还款状态
    paid_amount DECIMAL(15,2) DEFAULT 0 COMMENT '已还金额',
    paid_periods INT DEFAULT 0 COMMENT '已还款期数',
    is_completed TINYINT DEFAULT 0 COMMENT '是否完结：1-是，0-否',
    remaining_periods INT COMMENT '剩余还款期数',
    remaining_undue_periods INT COMMENT '未到期剩余期数',
    remaining_undue_principal DECIMAL(15,2) COMMENT '剩余未到期本金',
    remaining_undue_interest DECIMAL(15,2) COMMENT '剩余未到期利率',
    monthly_beginning_principal DECIMAL(15,2) COMMENT '月初剩余本金',
    
    -- 债务金额
    debt_amount DECIMAL(15,2) NOT NULL COMMENT '剩余应还金额',
    total_debt_amount DECIMAL(15,2) COMMENT '债权总额',
    outstanding_interest DECIMAL(15,2) COMMENT '尚欠利息',
    overdue_penalty DECIMAL(15,2) COMMENT '逾期违约金',
    penalty_interest_rate VARCHAR(20) COMMENT '罚息利率',
    overdue_penalty_interest DECIMAL(15,2) COMMENT '逾期罚息',
    
    -- 逾期信息
    overdue_days INT NOT NULL DEFAULT 0 COMMENT '逾期天数',
    overdue_m_value INT COMMENT '逾期M值',
    
    -- 委托信息
    consignor VARCHAR(200) COMMENT '委托方',
    consignment_start_time DATETIME COMMENT '委托开始时间',
    consignment_end_time DATETIME COMMENT '委托到期时间',
    first_consignment_time DATETIME COMMENT '首次委托时间',
    
    -- 资方信息
    capital_provider VARCHAR(200) COMMENT '资方名称',
    capital_nature VARCHAR(100) COMMENT '资方性质',
    guarantor VARCHAR(200) COMMENT '代偿方',
    guarantee_fee VARCHAR(100) COMMENT '担保费',
    
    -- 渠道信息
    channel_name VARCHAR(200) COMMENT '渠道名称',
    channel_type VARCHAR(100) COMMENT '渠道类型',
    
    -- 银行账户信息
    account_number VARCHAR(100) COMMENT '账号',
    bank_name VARCHAR(200) COMMENT '开户行',
    payment_method VARCHAR(100) COMMENT '还款支付方式',
    
    -- 法律信息
    has_jurisdiction_agreement TINYINT DEFAULT 0 COMMENT '是否约定管辖：1-是，0-否',
    preferential_policy TEXT COMMENT '优惠政策',
    
    -- 联系人信息
    contact1_name VARCHAR(100) COMMENT '联系人1',
    contact1_phone VARCHAR(20) COMMENT '联系人1电话',
    contact1_relationship VARCHAR(50) COMMENT '与联系人1关系',
    contact1_company VARCHAR(200) COMMENT '联系人1单位',
    
    -- 机构信息
    source_org_id BIGINT NOT NULL COMMENT '案源机构ID',
    source_org_name VARCHAR(200) COMMENT '案源机构名称',
    assigned_mediation_id BIGINT COMMENT '分配的调解中心ID',
    assigned_mediation_name VARCHAR(200) COMMENT '分配的调解中心名称',
    assigned_time DATETIME COMMENT '分配时间',
    
    -- 案件状态
    case_status TINYINT DEFAULT 1 COMMENT '案件状态：1-待分配，2-调解中，3-调解成功，4-调解失败，5-诉讼中，6-已结案，7-已撤回',
    status_update_time DATETIME COMMENT '状态更新时间',
    
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
    
    -- 索引
    INDEX idx_case_no (case_no),
    INDEX idx_batch_no (batch_no),
    INDEX idx_iou_number (iou_number),
    INDEX idx_debtor_id (debtor_id),
    INDEX idx_debtor_name (debtor_name),
    INDEX idx_debtor_id_card (debtor_id_card),
    INDEX idx_debtor_phone (debtor_phone),
    INDEX idx_source_org (source_org_id),
    INDEX idx_assigned_mediation (assigned_mediation_id),
    INDEX idx_case_status (case_status),
    INDEX idx_current_location (current_province, current_city),
    INDEX idx_household_location (household_province, household_city),
    INDEX idx_company_location (company_province, company_city),
    INDEX idx_priority_level (priority_level),
    INDEX idx_debt_amount (debt_amount),
    INDEX idx_loan_amount (loan_amount),
    INDEX idx_overdue_days (overdue_days),
    INDEX idx_overdue_m_value (overdue_m_value),
    INDEX idx_loan_date (loan_date),
    INDEX idx_loan_due_date (loan_due_date),
    INDEX idx_overdue_date (overdue_date),
    INDEX idx_created_time (created_time),
    INDEX idx_status_update_time (status_update_time),
    INDEX idx_is_supervised (is_supervised),
    INDEX idx_is_completed (is_completed),
    INDEX idx_consignor (consignor),
    INDEX idx_capital_provider (capital_provider),
    INDEX idx_product_type (product_type),
    INDEX idx_channel_type (channel_type)
) COMMENT '案件主表（增强版）';

-- 案件材料表（按案件ID哈希分表：t_case_material_0 ~ t_case_material_15）
CREATE TABLE t_case_material (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '材料ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 材料信息
    material_type TINYINT NOT NULL COMMENT '材料类型：1-合同，2-借据，3-放款凭证，4-还款记录，5-催收记录，6-身份证，7-银行流水，8-担保合同，9-抵押合同，10-其他',
    material_name VARCHAR(255) NOT NULL COMMENT '材料名称',
    material_desc VARCHAR(500) COMMENT '材料描述',
    material_category VARCHAR(100) COMMENT '材料分类',
    
    -- 文件信息
    file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型',
    file_hash VARCHAR(64) COMMENT '文件哈希值（用于去重）',
    file_url VARCHAR(500) COMMENT '文件访问URL',
    
    -- 存储信息
    storage_type TINYINT DEFAULT 1 COMMENT '存储类型：1-本地，2-OSS，3-其他云存储',
    storage_path VARCHAR(500) COMMENT '存储路径',
    storage_bucket VARCHAR(100) COMMENT '存储桶名称',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-已删除',
    is_sensitive TINYINT DEFAULT 0 COMMENT '是否敏感文件：1-是，0-否',
    access_level TINYINT DEFAULT 1 COMMENT '访问级别：1-公开，2-内部，3-机密',
    
    -- 审核信息
    review_status TINYINT DEFAULT 0 COMMENT '审核状态：0-未审核，1-审核通过，2-审核拒绝',
    reviewer_id BIGINT COMMENT '审核人ID',
    review_time DATETIME COMMENT '审核时间',
    review_comment VARCHAR(500) COMMENT '审核意见',
    
    -- 时间戳
    uploaded_by BIGINT COMMENT '上传人ID',
    uploaded_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_material_type (material_type),
    INDEX idx_material_category (material_category),
    INDEX idx_file_hash (file_hash),
    INDEX idx_status (status),
    INDEX idx_review_status (review_status),
    INDEX idx_uploaded_time (uploaded_time)
) COMMENT '案件材料表（增强版）';

-- 案件扩展信息表（用于存储可变的扩展字段）
CREATE TABLE t_case_extension (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '扩展信息ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 扩展字段
    field_name VARCHAR(100) NOT NULL COMMENT '字段名称',
    field_value TEXT COMMENT '字段值',
    field_type VARCHAR(50) COMMENT '字段类型：string/number/date/boolean/json',
    field_group VARCHAR(100) COMMENT '字段分组',
    
    -- 字段描述
    field_desc VARCHAR(500) COMMENT '字段描述',
    is_searchable TINYINT DEFAULT 0 COMMENT '是否可搜索：1-是，0-否',
    is_required TINYINT DEFAULT 0 COMMENT '是否必填：1-是，0-否',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_case_field (case_id, field_name),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_field_name (field_name),
    INDEX idx_field_group (field_group),
    INDEX idx_is_searchable (is_searchable)
) COMMENT '案件扩展信息表';

-- 案件联系人表（支持多个联系人）
CREATE TABLE t_case_contact (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '联系人ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 联系人信息
    contact_name VARCHAR(100) NOT NULL COMMENT '联系人姓名',
    contact_phone VARCHAR(20) COMMENT '联系人电话',
    contact_phone2 VARCHAR(20) COMMENT '联系人备用电话',
    relationship VARCHAR(50) COMMENT '与债务人关系',
    company_name VARCHAR(200) COMMENT '联系人单位',
    contact_address VARCHAR(500) COMMENT '联系人地址',
    
    -- 联系人类型
    contact_type TINYINT DEFAULT 1 COMMENT '联系人类型：1-紧急联系人，2-家庭联系人，3-工作联系人，4-其他',
    contact_priority TINYINT DEFAULT 2 COMMENT '联系优先级：1-高，2-中，3-低',
    
    -- 联系状态
    contact_status TINYINT DEFAULT 1 COMMENT '联系状态：1-有效，2-无效，3-拒绝联系',
    last_contact_time DATETIME COMMENT '最后联系时间',
    contact_count INT DEFAULT 0 COMMENT '联系次数',
    
    -- 备注信息
    remark VARCHAR(500) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_contact_phone (contact_phone),
    INDEX idx_contact_type (contact_type),
    INDEX idx_contact_status (contact_status),
    INDEX idx_contact_priority (contact_priority)
) COMMENT '案件联系人表';

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
    changed_fields TEXT COMMENT '变更字段（JSON格式）',
    
    -- 操作人信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    operator_ip VARCHAR(50) COMMENT '操作IP',
    operator_type TINYINT COMMENT '操作人类型：1-用户，2-系统，3-定时任务',
    
    -- 业务信息
    business_type VARCHAR(50) COMMENT '业务类型',
    request_id VARCHAR(64) COMMENT '请求ID',
    
    -- 时间戳
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_operation_type (operation_type),
    INDEX idx_operator_id (operator_id),
    INDEX idx_business_type (business_type),
    INDEX idx_operation_time (operation_time)
) COMMENT '案件操作日志表';

-- 案件督办记录表（保持不变）
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

-- 案件批次信息表（保持不变）
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
    
    -- 数据质量检查
    quality_score DECIMAL(5,2) COMMENT '数据质量评分（0-100）',
    duplicate_count INT DEFAULT 0 COMMENT '重复数据数量',
    invalid_count INT DEFAULT 0 COMMENT '无效数据数量',
    
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

-- 案件统计表（增强版）
CREATE TABLE t_case_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type TINYINT NOT NULL COMMENT '统计类型：1-日统计，2-月统计，3-年统计',
    
    -- 机构维度
    org_id BIGINT COMMENT '机构ID',
    org_name VARCHAR(200) COMMENT '机构名称',
    org_type TINYINT COMMENT '机构类型',
    
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
    
    -- 逾期统计
    m1_cases INT DEFAULT 0 COMMENT 'M1案件数（1-30天）',
    m2_cases INT DEFAULT 0 COMMENT 'M2案件数（31-60天）',
    m3_cases INT DEFAULT 0 COMMENT 'M3案件数（61-90天）',
    m3_plus_cases INT DEFAULT 0 COMMENT 'M3+案件数（90天以上）',
    
    -- 效率统计
    avg_assignment_time DECIMAL(10,2) COMMENT '平均分配时间（小时）',
    avg_mediation_time DECIMAL(10,2) COMMENT '平均调解时间（天）',
    mediation_success_rate DECIMAL(5,2) COMMENT '调解成功率（%）',
    
    -- 质量统计
    avg_case_quality_score DECIMAL(5,2) COMMENT '平均案件质量评分',
    supervision_rate DECIMAL(5,2) COMMENT '督办率（%）',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_stat_date_type_org (stat_date, stat_type, org_id),
    INDEX idx_stat_date (stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_org_id (org_id),
    INDEX idx_org_type (org_type)
) COMMENT '案件统计表（增强版）';