-- 使用数据库
USE dlmp_platform;

-- 1. 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  real_name VARCHAR(100) NOT NULL COMMENT '真实姓名',
  phone VARCHAR(20) COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  password_hash VARCHAR(255) COMMENT '密码哈希',
  user_type TINYINT NOT NULL DEFAULT 1 COMMENT '用户类型：1-管理员，2-调解员，3-委托方，4-法院',
  organization_id INT COMMENT '组织机构ID',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_user_type (user_type),
  INDEX idx_organization (organization_id)
) COMMENT='用户表';

-- 2. 案件表
CREATE TABLE cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_no VARCHAR(50) UNIQUE NOT NULL COMMENT '案件编号',
  title VARCHAR(200) NOT NULL COMMENT '案件标题',
  amount DECIMAL(15,2) NOT NULL COMMENT '债务金额',
  overdue_total_amount DECIMAL(15,2) NOT NULL COMMENT '逾期总金额',
  debtor_name VARCHAR(100) NOT NULL COMMENT '债务人姓名',
  debtor_id_card VARCHAR(18) COMMENT '债务人身份证',
  debtor_phone VARCHAR(20) COMMENT '债务人电话',
  client_name VARCHAR(200) NOT NULL COMMENT '委托方名称',
  status TINYINT DEFAULT 1 COMMENT '案件状态：1-待分案，2-调解中，3-诉讼中，4-已结案',
  case_status TINYINT DEFAULT 1 COMMENT '处理状态：1-待处理，2-处理中，3-已完成',
  assignment_status TINYINT DEFAULT 0 COMMENT '分案状态：0-未分案，1-已分案',
  mediation_center_id INT COMMENT '调解中心ID',
  mediator_id INT COMMENT '调解员ID',
  create_time DATE COMMENT '案件创建日期',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_case_no (case_no),
  INDEX idx_debtor_name (debtor_name),
  INDEX idx_status (status),
  INDEX idx_assignment (assignment_status),
  INDEX idx_mediation_center (mediation_center_id)
) COMMENT='案件表';

-- 3. 调解案件表
CREATE TABLE mediation_cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '关联案件ID',
  case_number VARCHAR(50) NOT NULL COMMENT '调解案件编号',
  borrower_name VARCHAR(100) NOT NULL COMMENT '借款人姓名',
  amount DECIMAL(15,2) NOT NULL COMMENT '调解金额',
  mediator_name VARCHAR(100) COMMENT '调解员姓名',
  mediator_id INT COMMENT '调解员ID',
  mediation_center_id INT COMMENT '调解中心ID',
  status TINYINT DEFAULT 1 COMMENT '调解状态：1-待调解，2-调解中，3-调解成功，4-调解失败',
  start_time DATETIME COMMENT '调解开始时间',
  end_time DATETIME COMMENT '调解结束时间',
  result_description TEXT COMMENT '调解结果描述',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_number (case_number),
  INDEX idx_mediator (mediator_id),
  INDEX idx_status (status)
) COMMENT='调解案件表';

-- 4. 诉讼案件表
CREATE TABLE litigation_cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '关联案件ID',
  case_number VARCHAR(50) NOT NULL COMMENT '诉讼案件编号',
  borrower_name VARCHAR(100) NOT NULL COMMENT '借款人姓名',
  debt_amount DECIMAL(15,2) NOT NULL COMMENT '债务金额',
  court_name VARCHAR(200) COMMENT '法院名称',
  court_case_number VARCHAR(100) COMMENT '法院案件编号',
  judge_name VARCHAR(100) COMMENT '法官姓名',
  plaintiff_lawyer VARCHAR(100) COMMENT '原告律师',
  stage TINYINT DEFAULT 1 COMMENT '诉讼阶段：1-诉前准备，2-立案审查，3-开庭审理，4-判决生效，5-强制执行，6-执行完毕',
  status TINYINT DEFAULT 1 COMMENT '案件状态：1-进行中，2-已完成，3-已暂停',
  progress INT DEFAULT 0 COMMENT '进度百分比',
  filing_date DATE COMMENT '立案日期',
  trial_date DATE COMMENT '开庭日期',
  judgment_date DATE COMMENT '判决日期',
  judgment_amount DECIMAL(15,2) COMMENT '判决金额',
  execution_court VARCHAR(200) COMMENT '执行法院',
  case_description TEXT COMMENT '案件描述',
  remarks TEXT COMMENT '备注',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_number (case_number),
  INDEX idx_court (court_name),
  INDEX idx_stage (stage),
  INDEX idx_status (status)
) COMMENT='诉讼案件表';

-- 5. 法院事件表
CREATE TABLE court_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '诉讼案件ID',
  type VARCHAR(50) NOT NULL COMMENT '事件类型：hearing-开庭，judgment-判决，execution-执行等',
  title VARCHAR(200) NOT NULL COMMENT '事件标题',
  description TEXT COMMENT '事件描述',
  scheduled_time DATETIME COMMENT '计划时间',
  actual_time DATETIME COMMENT '实际时间',
  location VARCHAR(200) COMMENT '地点',
  status VARCHAR(20) DEFAULT 'scheduled' COMMENT '状态：scheduled-计划，completed-完成，cancelled-取消',
  result TEXT COMMENT '事件结果',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_id (case_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_scheduled_time (scheduled_time)
) COMMENT='法院事件表';

-- 6. 文书模板表
CREATE TABLE document_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '模板名称',
  type VARCHAR(50) NOT NULL COMMENT '模板类型：complaint-起诉状，summons-传票等',
  category VARCHAR(50) DEFAULT 'litigation' COMMENT '模板分类：litigation-诉讼，mediation-调解等',
  description TEXT COMMENT '模板描述',
  content LONGTEXT COMMENT '模板内容',
  template_path VARCHAR(500) COMMENT '模板文件路径',
  variables JSON COMMENT '可用变量列表',
  file_type VARCHAR(10) DEFAULT 'docx' COMMENT '文件类型',
  created_by VARCHAR(100) COMMENT '创建人',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_name (name)
) COMMENT='文书模板表';

-- 7. 生成文书表
CREATE TABLE generated_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '案件ID',
  template_id INT NOT NULL COMMENT '模板ID',
  type VARCHAR(50) NOT NULL COMMENT '文书类型',
  name VARCHAR(200) NOT NULL COMMENT '文书名称',
  file_path VARCHAR(500) COMMENT '文件路径',
  status VARCHAR(20) DEFAULT 'generated' COMMENT '状态：generated-已生成，signed-已签章，sent-已发送',
  variables_data JSON COMMENT '变量数据',
  created_by VARCHAR(100) COMMENT '创建人',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_id (case_id),
  INDEX idx_template_id (template_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
) COMMENT='生成文书表';

-- 8. 执行记录表
CREATE TABLE execution_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '诉讼案件ID',
  type VARCHAR(50) NOT NULL COMMENT '执行类型：freeze-冻结，auction-拍卖等',
  title VARCHAR(200) NOT NULL COMMENT '执行标题',
  content TEXT NOT NULL COMMENT '执行内容',
  amount DECIMAL(15,2) COMMENT '执行金额',
  execute_time DATETIME COMMENT '执行时间',
  result VARCHAR(200) COMMENT '执行结果',
  attachments JSON COMMENT '附件信息',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_id (case_id),
  INDEX idx_type (type),
  INDEX idx_execute_time (execute_time)
) COMMENT='执行记录表';

-- 9. 系统日志表
CREATE TABLE system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '操作用户ID',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  resource VARCHAR(100) COMMENT '操作资源',
  resource_id INT COMMENT '资源ID',
  details JSON COMMENT '操作详情',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_time (created_time)
) COMMENT='系统日志表';

-- 10. 配置表
CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  config_value TEXT COMMENT '配置值',
  description VARCHAR(500) COMMENT '配置描述',
  type VARCHAR(20) DEFAULT 'string' COMMENT '值类型：string,number,boolean,json',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) COMMENT='系统配置表';