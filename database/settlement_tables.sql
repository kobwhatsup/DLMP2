-- 结算管理相关表结构

USE dlmp_platform;

-- 1. 结算记录表
CREATE TABLE settlement_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settlement_number VARCHAR(50) UNIQUE NOT NULL COMMENT '结算单号',
  case_id INT NOT NULL COMMENT '关联案件ID',
  case_number VARCHAR(50) NOT NULL COMMENT '案件编号',
  client_id INT NOT NULL COMMENT '委托客户ID',
  client_name VARCHAR(200) NOT NULL COMMENT '委托客户名称',
  settlement_type VARCHAR(50) NOT NULL COMMENT '结算类型：mediation-调解，litigation-诉讼，execution-执行，service-服务费',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '结算总金额',
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '已付金额',
  unpaid_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '未付金额',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '结算状态：1-草稿，2-待审核，3-已审核，4-已付款，5-部分付款，6-逾期，7-已取消',
  due_date DATE COMMENT '到期日期',
  description TEXT COMMENT '结算说明',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creator_id INT NOT NULL COMMENT '创建人ID',
  creator_name VARCHAR(100) NOT NULL COMMENT '创建人姓名',
  approver_id INT COMMENT '审核人ID',
  approver_name VARCHAR(100) COMMENT '审核人姓名',
  approve_time DATETIME COMMENT '审核时间',
  approve_remarks TEXT COMMENT '审核备注',
  INDEX idx_settlement_number (settlement_number),
  INDEX idx_case_id (case_id),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_settlement_type (settlement_type),
  INDEX idx_due_date (due_date),
  INDEX idx_created_time (created_time)
) COMMENT='结算记录表';

-- 2. 费用明细表
CREATE TABLE fee_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settlement_id INT NOT NULL COMMENT '结算记录ID',
  fee_type TINYINT NOT NULL COMMENT '费用类型：1-服务费，2-诉讼费，3-执行费，4-佣金，5-其他费用',
  fee_type_name VARCHAR(50) NOT NULL COMMENT '费用类型名称',
  description VARCHAR(200) NOT NULL COMMENT '费用说明',
  base_amount DECIMAL(15,2) COMMENT '基础金额',
  rate DECIMAL(8,4) COMMENT '费率（百分比）',
  amount DECIMAL(15,2) NOT NULL COMMENT '费用金额',
  calculation_method VARCHAR(100) COMMENT '计算方式',
  formula VARCHAR(200) COMMENT '计算公式',
  remarks TEXT COMMENT '备注',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_settlement_id (settlement_id),
  INDEX idx_fee_type (fee_type),
  FOREIGN KEY (settlement_id) REFERENCES settlement_records(id) ON DELETE CASCADE
) COMMENT='费用明细表';

-- 3. 费用计算规则表
CREATE TABLE fee_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fee_type TINYINT NOT NULL COMMENT '费用类型',
  fee_type_name VARCHAR(50) NOT NULL COMMENT '费用类型名称',
  settlement_type VARCHAR(50) COMMENT '适用结算类型',
  rate DECIMAL(8,4) NOT NULL COMMENT '费率',
  min_amount DECIMAL(15,2) COMMENT '最低金额',
  max_amount DECIMAL(15,2) COMMENT '最高金额',
  formula VARCHAR(200) NOT NULL COMMENT '计算公式',
  description TEXT COMMENT '规则描述',
  is_active TINYINT DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fee_type (fee_type),
  INDEX idx_settlement_type (settlement_type),
  INDEX idx_is_active (is_active)
) COMMENT='费用计算规则表';

-- 4. 付款记录表
CREATE TABLE payment_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settlement_id INT NOT NULL COMMENT '结算记录ID',
  payment_amount DECIMAL(15,2) NOT NULL COMMENT '付款金额',
  payment_date DATE NOT NULL COMMENT '付款日期',
  payment_method VARCHAR(50) NOT NULL COMMENT '付款方式',
  transaction_id VARCHAR(100) COMMENT '交易流水号',
  payment_proof_path VARCHAR(500) COMMENT '付款凭证路径',
  status TINYINT DEFAULT 1 COMMENT '状态：1-待确认，2-已确认，3-已拒绝',
  operator_id INT COMMENT '操作人ID',
  operator_name VARCHAR(100) COMMENT '操作人姓名',
  confirm_time DATETIME COMMENT '确认时间',
  remarks TEXT COMMENT '备注',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settlement_id (settlement_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_status (status),
  FOREIGN KEY (settlement_id) REFERENCES settlement_records(id) ON DELETE CASCADE
) COMMENT='付款记录表';

-- 5. 结算模板表
CREATE TABLE settlement_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  settlement_type VARCHAR(50) NOT NULL COMMENT '结算类型',
  description TEXT COMMENT '模板描述',
  fee_rules JSON COMMENT '费用规则配置',
  is_default TINYINT DEFAULT 0 COMMENT '是否默认模板',
  is_active TINYINT DEFAULT 1 COMMENT '是否启用',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creator_id INT NOT NULL COMMENT '创建人ID',
  creator_name VARCHAR(100) NOT NULL COMMENT '创建人姓名',
  INDEX idx_settlement_type (settlement_type),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
) COMMENT='结算模板表';

-- 6. 提醒记录表
CREATE TABLE reminder_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settlement_id INT NOT NULL COMMENT '结算记录ID',
  reminder_type VARCHAR(20) NOT NULL COMMENT '提醒类型：sms，email，phone',
  reminder_content TEXT COMMENT '提醒内容',
  scheduled_time DATETIME COMMENT '计划提醒时间',
  actual_time DATETIME COMMENT '实际发送时间',
  status TINYINT DEFAULT 1 COMMENT '状态：1-待发送，2-已发送，3-发送失败',
  result TEXT COMMENT '发送结果',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_settlement_id (settlement_id),
  INDEX idx_reminder_type (reminder_type),
  INDEX idx_status (status),
  INDEX idx_scheduled_time (scheduled_time),
  FOREIGN KEY (settlement_id) REFERENCES settlement_records(id) ON DELETE CASCADE
) COMMENT='提醒记录表';

-- 插入默认费用计算规则
INSERT INTO fee_rules (fee_type, fee_type_name, settlement_type, rate, formula, description) VALUES
(1, '服务费', 'mediation', 0.05, 'base_amount * rate', '调解服务费，按债务金额5%计算'),
(1, '服务费', 'litigation', 0.08, 'base_amount * rate', '诉讼服务费，按债务金额8%计算'),
(2, '诉讼费', 'litigation', 0.02, 'base_amount * rate', '法院诉讼费，按债务金额2%计算'),
(3, '执行费', 'execution', 0.015, 'base_amount * rate', '强制执行费，按执行金额1.5%计算'),
(4, '佣金', 'mediation', 0.03, 'base_amount * rate', '调解佣金，按回收金额3%计算'),
(4, '佣金', 'litigation', 0.05, 'base_amount * rate', '诉讼佣金，按回收金额5%计算');

-- 插入默认结算模板
INSERT INTO settlement_templates (name, settlement_type, description, fee_rules, is_default, creator_id, creator_name) VALUES
('标准调解结算模板', 'mediation', '适用于调解成功案件的标准结算模板', 
'[{"feeType": 1, "rate": 0.05}, {"feeType": 4, "rate": 0.03}]', 1, 1, '系统管理员'),
('标准诉讼结算模板', 'litigation', '适用于诉讼案件的标准结算模板', 
'[{"feeType": 1, "rate": 0.08}, {"feeType": 2, "rate": 0.02}, {"feeType": 4, "rate": 0.05}]', 1, 1, '系统管理员'),
('执行阶段结算模板', 'execution', '适用于执行阶段的结算模板', 
'[{"feeType": 3, "rate": 0.015}, {"feeType": 4, "rate": 0.05}]', 1, 1, '系统管理员');