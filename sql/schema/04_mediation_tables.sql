-- 调解管理相关表结构
-- 数据库: mediation_db
USE mediation_db;

-- 调解中心表
CREATE TABLE t_mediation_center (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '调解中心ID',
    center_code VARCHAR(50) NOT NULL UNIQUE COMMENT '调解中心编码',
    center_name VARCHAR(200) NOT NULL COMMENT '调解中心名称',
    center_type TINYINT DEFAULT 1 COMMENT '调解中心类型：1-人民调解委员会，2-行业调解组织，3-专业调解机构',
    
    -- 地址信息
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    address VARCHAR(500) COMMENT '详细地址',
    
    -- 联系信息
    contact_person VARCHAR(100) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    
    -- 能力信息
    capacity_level TINYINT DEFAULT 1 COMMENT '能力等级：1-低，2-中，3-高',
    max_concurrent_cases INT DEFAULT 100 COMMENT '最大并发案件数',
    speciality_fields VARCHAR(500) COMMENT '擅长领域（JSON格式）',
    
    -- 合作信息
    court_cooperation TEXT COMMENT '合作法院信息（JSON格式）',
    service_areas VARCHAR(500) COMMENT '服务区域（JSON格式）',
    business_license VARCHAR(200) COMMENT '营业执照号',
    qualification_cert VARCHAR(200) COMMENT '资质证书号',
    
    -- 统计信息
    total_cases INT DEFAULT 0 COMMENT '总接案数',
    success_cases INT DEFAULT 0 COMMENT '成功调解数',
    success_rate DECIMAL(5,2) DEFAULT 0 COMMENT '成功率（%）',
    avg_completion_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均完成天数',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用，2-暂停服务',
    entry_time DATETIME COMMENT '入驻时间',
    last_active_time DATETIME COMMENT '最后活跃时间',
    
    -- 评级信息
    rating_score DECIMAL(3,1) DEFAULT 0 COMMENT '评分（0-5分）',
    rating_count INT DEFAULT 0 COMMENT '评分次数',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_center_code (center_code),
    INDEX idx_location (province, city),
    INDEX idx_capacity_level (capacity_level),
    INDEX idx_status (status),
    INDEX idx_success_rate (success_rate),
    INDEX idx_rating_score (rating_score)
) COMMENT '调解中心表';

-- 调解员表
CREATE TABLE t_mediator (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '调解员ID',
    mediator_code VARCHAR(50) NOT NULL UNIQUE COMMENT '调解员编码',
    mediation_center_id BIGINT NOT NULL COMMENT '所属调解中心ID',
    
    -- 个人信息
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    id_card VARCHAR(18) COMMENT '身份证号',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender TINYINT COMMENT '性别：1-男，2-女',
    birth_date DATE COMMENT '出生日期',
    
    -- 资质信息
    education VARCHAR(50) COMMENT '学历',
    major VARCHAR(100) COMMENT '专业',
    certificate_no VARCHAR(200) COMMENT '调解员证书号',
    qualification_level TINYINT DEFAULT 1 COMMENT '资质等级：1-初级，2-中级，3-高级',
    work_experience INT DEFAULT 0 COMMENT '工作经验（年）',
    
    -- 专业能力
    speciality_fields VARCHAR(500) COMMENT '擅长领域（JSON格式）',
    language_skills VARCHAR(200) COMMENT '语言能力',
    max_concurrent_cases INT DEFAULT 20 COMMENT '最大并发案件数',
    
    -- 工作统计
    total_cases INT DEFAULT 0 COMMENT '总调解案件数',
    success_cases INT DEFAULT 0 COMMENT '成功调解数',
    success_rate DECIMAL(5,2) DEFAULT 0 COMMENT '成功率（%）',
    avg_completion_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均完成天数',
    current_cases INT DEFAULT 0 COMMENT '当前案件数',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用，2-暂停，3-休假',
    join_time DATETIME COMMENT '入职时间',
    last_active_time DATETIME COMMENT '最后活跃时间',
    
    -- 评级信息
    rating_score DECIMAL(3,1) DEFAULT 0 COMMENT '评分（0-5分）',
    rating_count INT DEFAULT 0 COMMENT '评分次数',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_mediator_code (mediator_code),
    INDEX idx_mediation_center_id (mediation_center_id),
    INDEX idx_status (status),
    INDEX idx_qualification_level (qualification_level),
    INDEX idx_success_rate (success_rate),
    INDEX idx_current_cases (current_cases)
) COMMENT '调解员表';

-- 调解案件记录表
CREATE TABLE t_mediation_case (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '调解记录ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    mediation_center_id BIGINT NOT NULL COMMENT '调解中心ID',
    mediator_id BIGINT COMMENT '调解员ID',
    
    -- 接案信息
    received_time DATETIME COMMENT '接案时间',
    acceptance_status TINYINT DEFAULT 1 COMMENT '承接状态：1-已承接，0-拒绝承接',
    refusal_reason VARCHAR(500) COMMENT '拒绝原因',
    
    -- 调解信息
    mediation_start_time DATETIME COMMENT '调解开始时间',
    first_contact_time DATETIME COMMENT '首次联系时间',
    expected_completion_time DATETIME COMMENT '预期完成时间',
    actual_completion_time DATETIME COMMENT '实际完成时间',
    
    -- 调解结果
    mediation_status TINYINT DEFAULT 1 COMMENT '调解状态：1-进行中，2-调解成功，3-调解失败，4-当事人拒绝，5-超时未完成',
    mediation_result TINYINT COMMENT '调解结果：1-达成协议，2-部分达成，3-调解不成',
    settlement_amount DECIMAL(15,2) COMMENT '和解金额',
    payment_plan TEXT COMMENT '还款计划（JSON格式）',
    
    -- 协议信息
    agreement_no VARCHAR(100) COMMENT '调解协议编号',
    agreement_content TEXT COMMENT '协议内容',
    agreement_file_path VARCHAR(500) COMMENT '协议文件路径',
    sign_time DATETIME COMMENT '签署时间',
    
    -- 司法确认
    judicial_confirmation_status TINYINT DEFAULT 0 COMMENT '司法确认状态：0-未申请，1-已申请，2-已确认，3-确认失败',
    confirmation_application_time DATETIME COMMENT '确认申请时间',
    confirmation_time DATETIME COMMENT '确认时间',
    confirmation_file_path VARCHAR(500) COMMENT '确认文件路径',
    court_name VARCHAR(200) COMMENT '确认法院',
    
    -- 费用信息
    mediation_fee DECIMAL(10,2) DEFAULT 0 COMMENT '调解费用',
    fee_status TINYINT DEFAULT 0 COMMENT '费用状态：0-未收费，1-已收费',
    
    -- 备注信息
    mediation_summary TEXT COMMENT '调解总结',
    failure_reason VARCHAR(500) COMMENT '失败原因',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_mediation_center_id (mediation_center_id),
    INDEX idx_mediator_id (mediator_id),
    INDEX idx_mediation_status (mediation_status),
    INDEX idx_received_time (received_time),
    INDEX idx_completion_time (actual_completion_time)
) COMMENT '调解案件记录表';

-- 调解过程记录表
CREATE TABLE t_mediation_process (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '过程记录ID',
    mediation_case_id BIGINT NOT NULL COMMENT '调解案件ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    
    -- 过程信息
    process_type TINYINT NOT NULL COMMENT '过程类型：1-首次联系，2-沟通协商，3-提交方案，4-签署协议，5-其他',
    process_title VARCHAR(200) NOT NULL COMMENT '过程标题',
    process_content TEXT COMMENT '过程内容',
    
    -- 联系信息
    contact_method TINYINT COMMENT '联系方式：1-电话，2-短信，3-邮件，4-微信，5-面谈',
    contact_result TINYINT COMMENT '联系结果：1-成功联系，2-无人接听，3-拒绝沟通，4-其他',
    contact_person VARCHAR(100) COMMENT '联系人',
    
    -- 文件附件
    attachments TEXT COMMENT '附件信息（JSON格式）',
    
    -- 操作人信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    operator_type TINYINT COMMENT '操作人类型：1-调解员，2-助理，3-系统',
    
    -- 时间戳
    process_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '过程时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_mediation_case_id (mediation_case_id),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_process_type (process_type),
    INDEX idx_process_time (process_time),
    INDEX idx_operator_id (operator_id)
) COMMENT '调解过程记录表';

-- 调解文书模板表
CREATE TABLE t_mediation_template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
    template_code VARCHAR(50) NOT NULL UNIQUE COMMENT '模板编码',
    template_name VARCHAR(200) NOT NULL COMMENT '模板名称',
    template_type TINYINT NOT NULL COMMENT '模板类型：1-调解协议，2-司法确认申请书，3-通知书，4-其他',
    
    -- 模板内容
    template_content TEXT COMMENT '模板内容',
    template_variables TEXT COMMENT '模板变量（JSON格式）',
    template_format TINYINT DEFAULT 1 COMMENT '模板格式：1-Word，2-PDF，3-HTML',
    
    -- 适用范围
    applicable_scenes VARCHAR(500) COMMENT '适用场景',
    applicable_regions VARCHAR(500) COMMENT '适用地区',
    
    -- 版本信息
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本号',
    version_desc VARCHAR(500) COMMENT '版本说明',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用，2-草稿',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认模板：1-是，0-否',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_template_code (template_code),
    INDEX idx_template_type (template_type),
    INDEX idx_status (status),
    INDEX idx_is_default (is_default)
) COMMENT '调解文书模板表';

-- 调解评价表
CREATE TABLE t_mediation_evaluation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评价ID',
    mediation_case_id BIGINT NOT NULL COMMENT '调解案件ID',
    case_id BIGINT NOT NULL COMMENT '案件ID',
    mediation_center_id BIGINT NOT NULL COMMENT '调解中心ID',
    mediator_id BIGINT COMMENT '调解员ID',
    
    -- 评价人信息
    evaluator_type TINYINT NOT NULL COMMENT '评价人类型：1-案源方，2-债务人，3-系统自动',
    evaluator_id BIGINT COMMENT '评价人ID',
    evaluator_name VARCHAR(100) COMMENT '评价人姓名',
    
    -- 评价内容
    service_score TINYINT NOT NULL COMMENT '服务评分（1-5分）',
    efficiency_score TINYINT NOT NULL COMMENT '效率评分（1-5分）',
    result_score TINYINT NOT NULL COMMENT '结果评分（1-5分）',
    overall_score DECIMAL(3,1) NOT NULL COMMENT '综合评分',
    
    -- 评价详情
    evaluation_content TEXT COMMENT '评价内容',
    suggestions TEXT COMMENT '建议',
    tags VARCHAR(500) COMMENT '评价标签（JSON格式）',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-有效，0-无效',
    
    -- 时间戳
    evaluation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
    
    INDEX idx_mediation_case_id (mediation_case_id),
    INDEX idx_mediation_center_id (mediation_center_id),
    INDEX idx_mediator_id (mediator_id),
    INDEX idx_evaluator_type (evaluator_type),
    INDEX idx_overall_score (overall_score),
    INDEX idx_evaluation_time (evaluation_time)
) COMMENT '调解评价表';

-- 调解统计表
CREATE TABLE t_mediation_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type TINYINT NOT NULL COMMENT '统计类型：1-日统计，2-月统计，3-年统计',
    
    -- 统计维度
    mediation_center_id BIGINT COMMENT '调解中心ID',
    mediator_id BIGINT COMMENT '调解员ID',
    
    -- 案件数量统计
    received_cases INT DEFAULT 0 COMMENT '接收案件数',
    accepted_cases INT DEFAULT 0 COMMENT '承接案件数',
    completed_cases INT DEFAULT 0 COMMENT '完成案件数',
    success_cases INT DEFAULT 0 COMMENT '成功案件数',
    failed_cases INT DEFAULT 0 COMMENT '失败案件数',
    
    -- 效率统计
    avg_response_hours DECIMAL(5,1) DEFAULT 0 COMMENT '平均响应时间（小时）',
    avg_completion_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均完成时间（天）',
    success_rate DECIMAL(5,2) DEFAULT 0 COMMENT '成功率（%）',
    
    -- 金额统计
    total_settlement_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总和解金额',
    avg_settlement_amount DECIMAL(15,2) DEFAULT 0 COMMENT '平均和解金额',
    
    -- 评价统计
    avg_service_score DECIMAL(3,1) DEFAULT 0 COMMENT '平均服务评分',
    avg_efficiency_score DECIMAL(3,1) DEFAULT 0 COMMENT '平均效率评分',
    avg_result_score DECIMAL(3,1) DEFAULT 0 COMMENT '平均结果评分',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_stat_date_type_center_mediator (stat_date, stat_type, mediation_center_id, mediator_id),
    INDEX idx_stat_date (stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_mediation_center_id (mediation_center_id),
    INDEX idx_mediator_id (mediator_id)
) COMMENT '调解统计表';