-- 诉讼管理相关表结构
-- 数据库: litigation_db
USE litigation_db;

-- 诉讼案件记录表
CREATE TABLE t_litigation_case (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '诉讼记录ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    mediation_center_id BIGINT NOT NULL COMMENT '调解中心ID',
    
    -- 诉讼基本信息
    litigation_no VARCHAR(100) COMMENT '诉讼案号',
    court_id BIGINT COMMENT '法院ID',
    court_name VARCHAR(200) COMMENT '法院名称',
    court_level TINYINT COMMENT '法院级别：1-基层法院，2-中级法院，3-高级法院，4-最高法院',
    
    -- 当事人信息
    plaintiff VARCHAR(500) COMMENT '原告信息（JSON格式）',
    defendant VARCHAR(500) COMMENT '被告信息（JSON格式）',
    third_party VARCHAR(500) COMMENT '第三人信息（JSON格式）',
    
    -- 代理人信息
    plaintiff_lawyer VARCHAR(200) COMMENT '原告代理律师',
    plaintiff_law_firm VARCHAR(200) COMMENT '原告代理律所',
    defendant_lawyer VARCHAR(200) COMMENT '被告代理律师',
    defendant_law_firm VARCHAR(200) COMMENT '被告代理律所',
    
    -- 案件信息
    case_type TINYINT DEFAULT 1 COMMENT '案件类型：1-民事，2-商事，3-执行',
    claim_amount DECIMAL(15,2) COMMENT '诉讼标的额',
    case_category VARCHAR(100) COMMENT '案件性质',
    litigation_reason VARCHAR(500) COMMENT '起诉事由',
    
    -- 诉讼状态
    litigation_status TINYINT DEFAULT 1 COMMENT '诉讼状态：1-准备中，2-已立案，3-审理中，4-已判决，5-执行中，6-已结案，7-已撤诉',
    current_stage TINYINT DEFAULT 1 COMMENT '当前阶段：1-立案，2-答辩，3-举证，4-开庭，5-判决，6-执行',
    
    -- 重要时间节点
    case_start_time DATETIME COMMENT '案件启动时间',
    filing_time DATETIME COMMENT '立案时间',
    trial_time DATETIME COMMENT '开庭时间',
    judgment_time DATETIME COMMENT '判决时间',
    execution_start_time DATETIME COMMENT '执行开始时间',
    case_end_time DATETIME COMMENT '案件结束时间',
    
    -- 判决信息
    judgment_result TINYINT COMMENT '判决结果：1-全部胜诉，2-部分胜诉，3-败诉，4-调解结案，5-撤诉',
    judgment_amount DECIMAL(15,2) COMMENT '判决金额',
    judgment_file_path VARCHAR(500) COMMENT '判决书文件路径',
    
    -- 执行信息
    execution_status TINYINT COMMENT '执行状态：1-执行中，2-执行完毕，3-执行中止，4-执行终结',
    executed_amount DECIMAL(15,2) DEFAULT 0 COMMENT '已执行金额',
    execution_rate DECIMAL(5,2) DEFAULT 0 COMMENT '执行率（%）',
    
    -- 费用信息
    litigation_fee DECIMAL(10,2) DEFAULT 0 COMMENT '诉讼费',
    lawyer_fee DECIMAL(10,2) DEFAULT 0 COMMENT '律师费',
    other_fee DECIMAL(10,2) DEFAULT 0 COMMENT '其他费用',
    total_cost DECIMAL(10,2) DEFAULT 0 COMMENT '总费用',
    
    -- 备注信息
    case_summary TEXT COMMENT '案件摘要',
    special_note VARCHAR(1000) COMMENT '特别说明',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_litigation_no (litigation_no),
    INDEX idx_court_id (court_id),
    INDEX idx_mediation_center_id (mediation_center_id),
    INDEX idx_litigation_status (litigation_status),
    INDEX idx_current_stage (current_stage),
    INDEX idx_filing_time (filing_time),
    INDEX idx_judgment_time (judgment_time)
) COMMENT '诉讼案件记录表';

-- 法院信息表
CREATE TABLE t_court_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '法院ID',
    court_code VARCHAR(50) NOT NULL UNIQUE COMMENT '法院编码',
    court_name VARCHAR(200) NOT NULL COMMENT '法院名称',
    court_level TINYINT NOT NULL COMMENT '法院级别：1-基层法院，2-中级法院，3-高级法院，4-最高法院',
    court_type TINYINT DEFAULT 1 COMMENT '法院类型：1-人民法院，2-专门法院',
    
    -- 地址信息
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    address VARCHAR(500) COMMENT '详细地址',
    
    -- 联系信息
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    website VARCHAR(200) COMMENT '官方网站',
    
    -- 业务信息
    jurisdiction_area TEXT COMMENT '管辖区域（JSON格式）',
    business_scope VARCHAR(500) COMMENT '业务范围',
    online_filing_supported TINYINT DEFAULT 0 COMMENT '是否支持网上立案：1-支持，0-不支持',
    
    -- 统计信息
    total_cases INT DEFAULT 0 COMMENT '总案件数',
    current_cases INT DEFAULT 0 COMMENT '当前案件数',
    avg_trial_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均审理天数',
    case_load_level TINYINT DEFAULT 1 COMMENT '案件负荷等级：1-低，2-中，3-高',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-停用',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_court_code (court_code),
    INDEX idx_court_level (court_level),
    INDEX idx_location (province, city),
    INDEX idx_status (status),
    INDEX idx_case_load_level (case_load_level)
) COMMENT '法院信息表';

-- 诉讼进展记录表
CREATE TABLE t_litigation_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '进展记录ID',
    litigation_case_id BIGINT NOT NULL COMMENT '诉讼案件ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 进展信息
    progress_type TINYINT NOT NULL COMMENT '进展类型：1-立案，2-送达，3-答辩，4-举证，5-开庭，6-调解，7-判决，8-执行，9-其他',
    progress_stage TINYINT NOT NULL COMMENT '进展阶段：1-立案，2-答辩，3-举证，4-开庭，5-判决，6-执行',
    progress_title VARCHAR(200) NOT NULL COMMENT '进展标题',
    progress_content TEXT COMMENT '进展内容',
    progress_result VARCHAR(500) COMMENT '进展结果',
    
    -- 时间信息
    scheduled_time DATETIME COMMENT '计划时间',
    actual_time DATETIME COMMENT '实际时间',
    next_scheduled_time DATETIME COMMENT '下次计划时间',
    
    -- 文件信息
    related_documents TEXT COMMENT '相关文件（JSON格式）',
    court_documents TEXT COMMENT '法院文书（JSON格式）',
    
    -- 参与人信息
    participants TEXT COMMENT '参与人员（JSON格式）',
    
    -- 状态信息
    progress_status TINYINT DEFAULT 1 COMMENT '进展状态：1-进行中，2-已完成，3-已延期，4-已取消',
    
    -- 操作人信息
    recorder_id BIGINT COMMENT '记录人ID',
    recorder_name VARCHAR(100) COMMENT '记录人姓名',
    
    -- 时间戳
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_litigation_case_id (litigation_case_id),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_progress_type (progress_type),
    INDEX idx_progress_stage (progress_stage),
    INDEX idx_actual_time (actual_time),
    INDEX idx_progress_status (progress_status)
) COMMENT '诉讼进展记录表';

-- 诉讼文书表
CREATE TABLE t_litigation_document (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文书ID',
    litigation_case_id BIGINT NOT NULL COMMENT '诉讼案件ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 文书信息
    document_type TINYINT NOT NULL COMMENT '文书类型：1-起诉状，2-答辩状，3-证据清单，4-庭审笔录，5-判决书，6-执行裁定书，7-其他',
    document_name VARCHAR(200) NOT NULL COMMENT '文书名称',
    document_no VARCHAR(100) COMMENT '文书编号',
    document_category VARCHAR(100) COMMENT '文书分类',
    
    -- 文件信息
    file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型',
    file_hash VARCHAR(64) COMMENT '文件哈希值',
    
    -- 生成信息
    generate_method TINYINT DEFAULT 1 COMMENT '生成方式：1-手动上传，2-系统生成，3-法院推送',
    template_id BIGINT COMMENT '使用的模板ID',
    
    -- 签署信息
    signature_status TINYINT DEFAULT 0 COMMENT '签署状态：0-未签署，1-已签署，2-签署失败',
    signature_info TEXT COMMENT '签署信息（JSON格式）',
    signature_time DATETIME COMMENT '签署时间',
    
    -- 状态信息
    document_status TINYINT DEFAULT 1 COMMENT '文书状态：1-草稿，2-已提交，3-已送达，4-已生效',
    is_key_document TINYINT DEFAULT 0 COMMENT '是否关键文书：1-是，0-否',
    
    -- 关联信息
    related_progress_id BIGINT COMMENT '关联进展记录ID',
    parent_document_id BIGINT COMMENT '父文书ID',
    
    -- 备注信息
    description VARCHAR(500) COMMENT '文书描述',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_litigation_case_id (litigation_case_id),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_document_type (document_type),
    INDEX idx_document_status (document_status),
    INDEX idx_signature_status (signature_status),
    INDEX idx_is_key_document (is_key_document),
    INDEX idx_created_time (created_time)
) COMMENT '诉讼文书表';

-- 财产线索表
CREATE TABLE t_property_clue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '线索ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    litigation_case_id BIGINT COMMENT '诉讼案件ID',
    
    -- 财产信息
    property_type TINYINT NOT NULL COMMENT '财产类型：1-银行存款，2-房产，3-车辆，4-股权，5-工资，6-其他',
    property_name VARCHAR(200) COMMENT '财产名称',
    property_value DECIMAL(15,2) COMMENT '财产价值',
    property_address VARCHAR(500) COMMENT '财产地址',
    
    -- 详细信息
    bank_name VARCHAR(200) COMMENT '银行名称（存款类）',
    account_no VARCHAR(100) COMMENT '账号（存款类）',
    property_cert_no VARCHAR(200) COMMENT '产权证号（房产类）',
    vehicle_plate_no VARCHAR(20) COMMENT '车牌号（车辆类）',
    company_name VARCHAR(200) COMMENT '公司名称（股权/工资类）',
    
    -- 线索来源
    clue_source TINYINT NOT NULL COMMENT '线索来源：1-当事人提供，2-网络查询，3-法院查询，4-第三方提供',
    source_detail VARCHAR(500) COMMENT '来源详情',
    clue_reliability TINYINT DEFAULT 2 COMMENT '线索可靠性：1-高，2-中，3-低',
    
    -- 核实信息
    verification_status TINYINT DEFAULT 0 COMMENT '核实状态：0-未核实，1-核实中，2-已核实，3-核实失败',
    verification_result TEXT COMMENT '核实结果',
    verification_time DATETIME COMMENT '核实时间',
    verifier_id BIGINT COMMENT '核实人ID',
    
    -- 处置信息
    disposal_status TINYINT DEFAULT 0 COMMENT '处置状态：0-未处置，1-已冻结，2-已查封，3-已扣划，4-处置完成',
    disposal_amount DECIMAL(15,2) DEFAULT 0 COMMENT '处置金额',
    disposal_time DATETIME COMMENT '处置时间',
    disposal_remark VARCHAR(500) COMMENT '处置备注',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-有效，0-无效',
    
    -- 时间戳
    discovered_time DATETIME COMMENT '发现时间',
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_litigation_case_id (litigation_case_id),
    INDEX idx_property_type (property_type),
    INDEX idx_clue_source (clue_source),
    INDEX idx_verification_status (verification_status),
    INDEX idx_disposal_status (disposal_status),
    INDEX idx_discovered_time (discovered_time)
) COMMENT '财产线索表';

-- 执行记录表
CREATE TABLE t_execution_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '执行记录ID',
    litigation_case_id BIGINT NOT NULL COMMENT '诉讼案件ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 执行信息
    execution_no VARCHAR(100) COMMENT '执行案号',
    execution_type TINYINT NOT NULL COMMENT '执行类型：1-财产保全，2-强制执行，3-恢复执行，4-终结执行',
    execution_stage TINYINT DEFAULT 1 COMMENT '执行阶段：1-立案执行，2-财产调查，3-财产处置，4-分配执行',
    
    -- 执行标的
    execution_target DECIMAL(15,2) COMMENT '执行标的',
    executed_amount DECIMAL(15,2) DEFAULT 0 COMMENT '已执行金额',
    remaining_amount DECIMAL(15,2) COMMENT '剩余金额',
    
    -- 执行措施
    execution_measures TEXT COMMENT '执行措施（JSON格式）',
    execution_content TEXT COMMENT '执行内容',
    execution_result VARCHAR(500) COMMENT '执行结果',
    
    -- 执行状态
    execution_status TINYINT DEFAULT 1 COMMENT '执行状态：1-执行中，2-部分执行，3-执行完毕，4-执行中止，5-执行终结',
    status_reason VARCHAR(500) COMMENT '状态原因',
    
    -- 关联财产
    related_property_ids VARCHAR(500) COMMENT '关联财产线索ID列表',
    
    -- 时间信息
    execution_start_time DATETIME COMMENT '执行开始时间',
    execution_end_time DATETIME COMMENT '执行结束时间',
    next_execution_time DATETIME COMMENT '下次执行时间',
    
    -- 操作人信息
    executor_id BIGINT COMMENT '执行人ID',
    executor_name VARCHAR(100) COMMENT '执行人姓名',
    
    -- 备注信息
    execution_summary TEXT COMMENT '执行总结',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_litigation_case_id (litigation_case_id),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_execution_no (execution_no),
    INDEX idx_execution_type (execution_type),
    INDEX idx_execution_status (execution_status),
    INDEX idx_execution_start_time (execution_start_time),
    INDEX idx_executor_id (executor_id)
) COMMENT '执行记录表';

-- 诉讼统计表
CREATE TABLE t_litigation_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type TINYINT NOT NULL COMMENT '统计类型：1-日统计，2-月统计，3-年统计',
    
    -- 统计维度
    court_id BIGINT COMMENT '法院ID',
    mediation_center_id BIGINT COMMENT '调解中心ID',
    
    -- 案件数量统计
    new_litigation_cases INT DEFAULT 0 COMMENT '新增诉讼案件数',
    filed_cases INT DEFAULT 0 COMMENT '已立案数',
    trial_cases INT DEFAULT 0 COMMENT '开庭案件数',
    judgment_cases INT DEFAULT 0 COMMENT '已判决案件数',
    execution_cases INT DEFAULT 0 COMMENT '执行案件数',
    completed_cases INT DEFAULT 0 COMMENT '已结案数',
    
    -- 效率统计
    avg_filing_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均立案天数',
    avg_trial_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均审理天数',
    avg_judgment_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均判决天数',
    avg_execution_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均执行天数',
    
    -- 结果统计
    win_rate DECIMAL(5,2) DEFAULT 0 COMMENT '胜诉率（%）',
    settlement_rate DECIMAL(5,2) DEFAULT 0 COMMENT '调解结案率（%）',
    execution_rate DECIMAL(5,2) DEFAULT 0 COMMENT '执行率（%）',
    
    -- 金额统计
    total_claim_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总诉讼标的额',
    total_judgment_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总判决金额',
    total_executed_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总执行金额',
    total_litigation_cost DECIMAL(18,2) DEFAULT 0 COMMENT '总诉讼费用',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_stat_date_type_court_center (stat_date, stat_type, court_id, mediation_center_id),
    INDEX idx_stat_date (stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_court_id (court_id),
    INDEX idx_mediation_center_id (mediation_center_id)
) COMMENT '诉讼统计表';