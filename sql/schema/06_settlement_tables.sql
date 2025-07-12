-- 结算管理相关表结构
-- 数据库: settlement_db
USE settlement_db;

-- 结算规则表
CREATE TABLE t_settlement_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '规则ID',
    rule_code VARCHAR(50) NOT NULL UNIQUE COMMENT '规则编码',
    rule_name VARCHAR(200) NOT NULL COMMENT '规则名称',
    rule_type TINYINT NOT NULL COMMENT '规则类型：1-调解坐席租赁，2-分散诉讼服务，3-成功收费，4-其他',
    
    -- 适用范围
    applicable_org_types VARCHAR(200) COMMENT '适用机构类型（JSON格式）',
    applicable_regions VARCHAR(500) COMMENT '适用地区（JSON格式）',
    applicable_case_types VARCHAR(200) COMMENT '适用案件类型（JSON格式）',
    
    -- 计费规则
    fee_calculation_method TINYINT NOT NULL COMMENT '计费方式：1-固定费用，2-按比例，3-阶梯计费，4-自定义公式',
    base_fee DECIMAL(10,2) DEFAULT 0 COMMENT '基础费用',
    fee_rate DECIMAL(5,4) DEFAULT 0 COMMENT '费用比例（%）',
    min_fee DECIMAL(10,2) DEFAULT 0 COMMENT '最低费用',
    max_fee DECIMAL(10,2) DEFAULT 0 COMMENT '最高费用',
    
    -- 阶梯计费配置
    tier_config TEXT COMMENT '阶梯计费配置（JSON格式）',
    
    -- 自定义公式
    formula_expression TEXT COMMENT '计费公式表达式',
    formula_variables TEXT COMMENT '公式变量定义（JSON格式）',
    
    -- 优惠政策
    discount_config TEXT COMMENT '优惠配置（JSON格式）',
    
    -- 结算周期
    settlement_cycle TINYINT DEFAULT 1 COMMENT '结算周期：1-月结，2-季结，3-半年结，4-年结',
    settlement_day TINYINT DEFAULT 1 COMMENT '结算日（每月几号）',
    
    -- 状态信息
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-停用，2-草稿',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '失效日期',
    
    -- 版本信息
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本号',
    version_desc VARCHAR(500) COMMENT '版本说明',
    
    -- 备注信息
    description TEXT COMMENT '规则描述',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_rule_code (rule_code),
    INDEX idx_rule_type (rule_type),
    INDEX idx_status (status),
    INDEX idx_effective_date (effective_date),
    INDEX idx_settlement_cycle (settlement_cycle)
) COMMENT '结算规则表';

-- 结算记录表
CREATE TABLE t_settlement_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '结算记录ID',
    settlement_no VARCHAR(50) NOT NULL UNIQUE COMMENT '结算单号',
    settlement_batch_no VARCHAR(50) COMMENT '结算批次号',
    
    -- 结算主体
    settlement_org_id BIGINT NOT NULL COMMENT '结算机构ID',
    settlement_org_name VARCHAR(200) COMMENT '结算机构名称',
    settlement_org_type TINYINT COMMENT '机构类型：1-案源端，2-调解中心',
    
    -- 结算周期
    settlement_period_start DATE NOT NULL COMMENT '结算周期开始日期',
    settlement_period_end DATE NOT NULL COMMENT '结算周期结束日期',
    settlement_type TINYINT NOT NULL COMMENT '结算类型：1-调解坐席租赁，2-分散诉讼服务，3-成功收费',
    
    -- 业务数据统计
    total_cases INT DEFAULT 0 COMMENT '总案件数',
    successful_cases INT DEFAULT 0 COMMENT '成功案件数',
    mediation_success_cases INT DEFAULT 0 COMMENT '调解成功案件数',
    litigation_cases INT DEFAULT 0 COMMENT '诉讼案件数',
    completed_cases INT DEFAULT 0 COMMENT '完成案件数',
    
    -- 金额统计
    total_case_amount DECIMAL(18,2) DEFAULT 0 COMMENT '案件总金额',
    recovered_amount DECIMAL(18,2) DEFAULT 0 COMMENT '回收金额',
    settlement_base_amount DECIMAL(18,2) DEFAULT 0 COMMENT '结算基数',
    
    -- 费用计算
    applicable_rule_id BIGINT COMMENT '适用规则ID',
    base_fee DECIMAL(10,2) DEFAULT 0 COMMENT '基础费用',
    percentage_fee DECIMAL(10,2) DEFAULT 0 COMMENT '比例费用',
    bonus_fee DECIMAL(10,2) DEFAULT 0 COMMENT '奖励费用',
    penalty_fee DECIMAL(10,2) DEFAULT 0 COMMENT '处罚费用',
    discount_fee DECIMAL(10,2) DEFAULT 0 COMMENT '优惠费用',
    
    -- 结算金额
    gross_amount DECIMAL(10,2) NOT NULL COMMENT '结算总额',
    tax_amount DECIMAL(10,2) DEFAULT 0 COMMENT '税费',
    net_amount DECIMAL(10,2) NOT NULL COMMENT '结算净额',
    
    -- 结算状态
    settlement_status TINYINT DEFAULT 1 COMMENT '结算状态：1-待确认，2-已确认，3-待支付，4-已支付，5-已拒绝',
    approval_status TINYINT DEFAULT 0 COMMENT '审批状态：0-未审批，1-审批中，2-审批通过，3-审批拒绝',
    payment_status TINYINT DEFAULT 0 COMMENT '支付状态：0-未支付，1-支付中，2-支付成功，3-支付失败',
    
    -- 时间节点
    generated_time DATETIME COMMENT '生成时间',
    confirmed_time DATETIME COMMENT '确认时间',
    approved_time DATETIME COMMENT '审批时间',
    payment_time DATETIME COMMENT '支付时间',
    
    -- 操作人信息
    generator_id BIGINT COMMENT '生成人ID',
    confirmer_id BIGINT COMMENT '确认人ID',
    approver_id BIGINT COMMENT '审批人ID',
    payer_id BIGINT COMMENT '支付操作人ID',
    
    -- 备注信息
    settlement_summary TEXT COMMENT '结算说明',
    rejection_reason VARCHAR(500) COMMENT '拒绝原因',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_settlement_no (settlement_no),
    INDEX idx_settlement_batch_no (settlement_batch_no),
    INDEX idx_settlement_org_id (settlement_org_id),
    INDEX idx_settlement_period (settlement_period_start, settlement_period_end),
    INDEX idx_settlement_type (settlement_type),
    INDEX idx_settlement_status (settlement_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_generated_time (generated_time)
) COMMENT '结算记录表';

-- 结算明细表
CREATE TABLE t_settlement_detail (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    settlement_record_id BIGINT NOT NULL COMMENT '结算记录ID',
    settlement_no VARCHAR(50) NOT NULL COMMENT '结算单号',
    
    -- 案件信息
    case_id BIGINT NOT NULL COMMENT '案件ID',
    case_no VARCHAR(50) NOT NULL COMMENT '案件编号',
    debtor_name VARCHAR(100) COMMENT '债务人姓名',
    case_amount DECIMAL(15,2) COMMENT '案件金额',
    
    -- 业务信息
    business_type TINYINT NOT NULL COMMENT '业务类型：1-调解，2-诉讼',
    business_result TINYINT COMMENT '业务结果：1-成功，2-失败，3-部分成功',
    completion_time DATETIME COMMENT '完成时间',
    
    -- 费用信息
    fee_type TINYINT NOT NULL COMMENT '费用类型：1-基础费用，2-成功费用，3-额外费用',
    calculation_base DECIMAL(15,2) COMMENT '计算基数',
    fee_rate DECIMAL(5,4) COMMENT '费用比例',
    calculated_amount DECIMAL(10,2) COMMENT '计算金额',
    actual_amount DECIMAL(10,2) COMMENT '实际金额',
    
    -- 调整信息
    adjustment_amount DECIMAL(10,2) DEFAULT 0 COMMENT '调整金额',
    adjustment_reason VARCHAR(500) COMMENT '调整原因',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_settlement_record_id (settlement_record_id),
    INDEX idx_settlement_no (settlement_no),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_business_type (business_type),
    INDEX idx_fee_type (fee_type),
    INDEX idx_completion_time (completion_time)
) COMMENT '结算明细表';

-- 支付记录表
CREATE TABLE t_payment_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '支付记录ID',
    payment_no VARCHAR(50) NOT NULL UNIQUE COMMENT '支付单号',
    settlement_record_id BIGINT NOT NULL COMMENT '结算记录ID',
    settlement_no VARCHAR(50) NOT NULL COMMENT '结算单号',
    
    -- 支付方信息
    payer_org_id BIGINT NOT NULL COMMENT '付款方机构ID',
    payer_org_name VARCHAR(200) COMMENT '付款方机构名称',
    payer_account VARCHAR(100) COMMENT '付款账户',
    
    -- 收款方信息
    payee_org_id BIGINT NOT NULL COMMENT '收款方机构ID',
    payee_org_name VARCHAR(200) COMMENT '收款方机构名称',
    payee_account VARCHAR(100) COMMENT '收款账户',
    payee_bank VARCHAR(200) COMMENT '收款银行',
    
    -- 支付金额
    payment_amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    
    -- 支付方式
    payment_method TINYINT NOT NULL COMMENT '支付方式：1-银行转账，2-支付宝，3-微信，4-现金，5-其他',
    payment_channel VARCHAR(100) COMMENT '支付渠道',
    
    -- 支付状态
    payment_status TINYINT DEFAULT 1 COMMENT '支付状态：1-待支付，2-支付中，3-支付成功，4-支付失败，5-已撤销',
    
    -- 第三方支付信息
    third_party_no VARCHAR(100) COMMENT '第三方支付单号',
    third_party_response TEXT COMMENT '第三方响应信息',
    
    -- 时间信息
    payment_request_time DATETIME COMMENT '支付申请时间',
    payment_success_time DATETIME COMMENT '支付成功时间',
    payment_failure_time DATETIME COMMENT '支付失败时间',
    
    -- 失败信息
    failure_reason VARCHAR(500) COMMENT '失败原因',
    failure_code VARCHAR(50) COMMENT '失败代码',
    
    -- 操作人信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    
    -- 备注信息
    payment_memo VARCHAR(500) COMMENT '支付备注',
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_payment_no (payment_no),
    INDEX idx_settlement_record_id (settlement_record_id),
    INDEX idx_settlement_no (settlement_no),
    INDEX idx_payer_org_id (payer_org_id),
    INDEX idx_payee_org_id (payee_org_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_payment_success_time (payment_success_time)
) COMMENT '支付记录表';

-- 结算报表表
CREATE TABLE t_settlement_report (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '报表ID',
    report_no VARCHAR(50) NOT NULL UNIQUE COMMENT '报表编号',
    report_name VARCHAR(200) NOT NULL COMMENT '报表名称',
    report_type TINYINT NOT NULL COMMENT '报表类型：1-月度报表，2-季度报表，3-年度报表，4-自定义报表',
    
    -- 报表周期
    report_period_start DATE NOT NULL COMMENT '报表周期开始',
    report_period_end DATE NOT NULL COMMENT '报表周期结束',
    
    -- 统计维度
    org_type TINYINT COMMENT '机构类型：1-案源端，2-调解中心，0-全部',
    specific_org_id BIGINT COMMENT '特定机构ID（为空表示全部）',
    region_code VARCHAR(50) COMMENT '地区编码（为空表示全国）',
    
    -- 业务统计
    total_cases INT DEFAULT 0 COMMENT '总案件数',
    successful_cases INT DEFAULT 0 COMMENT '成功案件数',
    mediation_cases INT DEFAULT 0 COMMENT '调解案件数',
    litigation_cases INT DEFAULT 0 COMMENT '诉讼案件数',
    success_rate DECIMAL(5,2) DEFAULT 0 COMMENT '成功率（%）',
    
    -- 金额统计
    total_case_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总案件金额',
    total_recovered_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总回收金额',
    total_settlement_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总结算金额',
    avg_case_amount DECIMAL(15,2) DEFAULT 0 COMMENT '平均案件金额',
    avg_settlement_amount DECIMAL(10,2) DEFAULT 0 COMMENT '平均结算金额',
    
    -- 效率统计
    avg_completion_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均完成天数',
    avg_mediation_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均调解天数',
    avg_litigation_days DECIMAL(5,1) DEFAULT 0 COMMENT '平均诉讼天数',
    
    -- 费用统计
    total_base_fee DECIMAL(18,2) DEFAULT 0 COMMENT '总基础费用',
    total_success_fee DECIMAL(18,2) DEFAULT 0 COMMENT '总成功费用',
    total_bonus_fee DECIMAL(18,2) DEFAULT 0 COMMENT '总奖励费用',
    total_penalty_fee DECIMAL(18,2) DEFAULT 0 COMMENT '总处罚费用',
    
    -- 报表数据
    report_data TEXT COMMENT '报表详细数据（JSON格式）',
    chart_data TEXT COMMENT '图表数据（JSON格式）',
    
    -- 报表状态
    report_status TINYINT DEFAULT 1 COMMENT '报表状态：1-生成中，2-已完成，3-生成失败',
    
    -- 文件信息
    report_file_path VARCHAR(500) COMMENT '报表文件路径',
    report_file_format VARCHAR(20) COMMENT '报表文件格式（Excel/PDF）',
    
    -- 时间戳
    generated_by BIGINT COMMENT '生成人ID',
    generated_time DATETIME COMMENT '生成时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_report_no (report_no),
    INDEX idx_report_type (report_type),
    INDEX idx_report_period (report_period_start, report_period_end),
    INDEX idx_org_type (org_type),
    INDEX idx_specific_org_id (specific_org_id),
    INDEX idx_report_status (report_status),
    INDEX idx_generated_time (generated_time)
) COMMENT '结算报表表';

-- 费用调整记录表
CREATE TABLE t_fee_adjustment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '调整记录ID',
    adjustment_no VARCHAR(50) NOT NULL UNIQUE COMMENT '调整单号',
    settlement_record_id BIGINT COMMENT '关联结算记录ID',
    case_id BIGINT COMMENT '关联案件ID',
    case_no VARCHAR(50) COMMENT '案件编号',
    
    -- 调整信息
    adjustment_type TINYINT NOT NULL COMMENT '调整类型：1-费用增加，2-费用减少，3-费用退回',
    adjustment_reason TINYINT NOT NULL COMMENT '调整原因：1-业务变更，2-错误修正，3-优惠政策，4-处罚，5-其他',
    adjustment_amount DECIMAL(10,2) NOT NULL COMMENT '调整金额',
    
    -- 影响对象
    affected_org_id BIGINT NOT NULL COMMENT '受影响机构ID',
    affected_org_name VARCHAR(200) COMMENT '受影响机构名称',
    
    -- 调整说明
    adjustment_desc TEXT COMMENT '调整说明',
    supporting_documents TEXT COMMENT '支撑文件（JSON格式）',
    
    -- 审批信息
    approval_status TINYINT DEFAULT 1 COMMENT '审批状态：1-待审批，2-审批通过，3-审批拒绝',
    approver_id BIGINT COMMENT '审批人ID',
    approval_time DATETIME COMMENT '审批时间',
    approval_comment VARCHAR(500) COMMENT '审批意见',
    
    -- 执行信息
    execution_status TINYINT DEFAULT 0 COMMENT '执行状态：0-未执行，1-已执行，2-执行失败',
    execution_time DATETIME COMMENT '执行时间',
    
    -- 时间戳
    created_by BIGINT COMMENT '创建人ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人ID',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_adjustment_no (adjustment_no),
    INDEX idx_settlement_record_id (settlement_record_id),
    INDEX idx_case_id (case_id),
    INDEX idx_case_no (case_no),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_affected_org_id (affected_org_id),
    INDEX idx_approval_status (approval_status),
    INDEX idx_execution_status (execution_status),
    INDEX idx_created_time (created_time)
) COMMENT '费用调整记录表';

-- 结算统计表
CREATE TABLE t_settlement_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type TINYINT NOT NULL COMMENT '统计类型：1-日统计，2-月统计，3-年统计',
    
    -- 统计维度
    org_id BIGINT COMMENT '机构ID',
    org_type TINYINT COMMENT '机构类型：1-案源端，2-调解中心',
    settlement_type TINYINT COMMENT '结算类型',
    
    -- 结算数量统计
    total_settlements INT DEFAULT 0 COMMENT '总结算笔数',
    confirmed_settlements INT DEFAULT 0 COMMENT '已确认笔数',
    paid_settlements INT DEFAULT 0 COMMENT '已支付笔数',
    rejected_settlements INT DEFAULT 0 COMMENT '被拒绝笔数',
    
    -- 结算金额统计
    total_settlement_amount DECIMAL(18,2) DEFAULT 0 COMMENT '总结算金额',
    confirmed_amount DECIMAL(18,2) DEFAULT 0 COMMENT '已确认金额',
    paid_amount DECIMAL(18,2) DEFAULT 0 COMMENT '已支付金额',
    pending_amount DECIMAL(18,2) DEFAULT 0 COMMENT '待支付金额',
    
    -- 案件数量统计
    total_cases INT DEFAULT 0 COMMENT '总案件数',
    successful_cases INT DEFAULT 0 COMMENT '成功案件数',
    
    -- 效率统计
    avg_settlement_cycle DECIMAL(5,1) DEFAULT 0 COMMENT '平均结算周期（天）',
    avg_payment_cycle DECIMAL(5,1) DEFAULT 0 COMMENT '平均支付周期（天）',
    settlement_success_rate DECIMAL(5,2) DEFAULT 0 COMMENT '结算成功率（%）',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_stat_date_type_org (stat_date, stat_type, org_id, settlement_type),
    INDEX idx_stat_date (stat_date),
    INDEX idx_stat_type (stat_type),
    INDEX idx_org_id (org_id),
    INDEX idx_org_type (org_type),
    INDEX idx_settlement_type (settlement_type)
) COMMENT '结算统计表';