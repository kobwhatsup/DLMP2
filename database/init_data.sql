-- 个贷不良资产分散诉讼调解平台初始数据
-- 使用数据库
USE dlmp_platform;

-- 插入初始用户数据
INSERT INTO users (id, username, real_name, phone, email, user_type, organization_id, status) VALUES
(1, 'admin', '系统管理员', '18888888888', 'admin@dlmp.com', 1, 1, 1),
(2, 'mediator1', '调解员张三', '18888888889', 'mediator1@dlmp.com', 2, 1, 1),
(3, 'client1', '委托方代表', '18888888890', 'client1@bank.com', 3, 2, 1);

-- 插入初始案件数据
INSERT INTO cases (id, case_no, title, amount, overdue_total_amount, debtor_name, debtor_id_card, debtor_phone, client_name, status, case_status, assignment_status, mediation_center_id, mediator_id, create_time) VALUES
(1, 'DLMP20240101001', '张三个人贷款纠纷案', 50000.00, 50000.00, '张三', '110101199001010001', '13800138001', '某银行', 1, 1, 0, NULL, NULL, '2024-01-01'),
(2, 'DLMP20240101002', '李四信用卡透支案', 80000.00, 80000.00, '李四', '110101199002020002', '13800138002', '某银行', 2, 2, 1, 1, 101, '2024-01-02'),
(3, 'DLMP20240101003', '王五房贷逾期案', 120000.00, 120000.00, '王五', '110101199003030003', '13800138003', '某银行', 3, 2, 1, 1, 102, '2024-01-03');

-- 插入初始调解案件数据
INSERT INTO mediation_cases (id, case_id, case_number, borrower_name, amount, mediator_name, mediator_id, mediation_center_id, status, start_time, end_time, result_description) VALUES
(1, 2, 'DLMP-M-20240102001', '李四', 80000.00, '调解员张三', 101, 1, 2, '2024-01-02 10:00:00', NULL, '调解进行中'),
(2, 3, 'DLMP-M-20240103001', '王五', 120000.00, '调解员李四', 102, 1, 4, '2024-01-03 14:00:00', '2024-01-03 16:00:00', '调解失败，转入诉讼程序');

-- 插入初始诉讼案件数据
INSERT INTO litigation_cases (id, case_id, case_number, borrower_name, debt_amount, court_name, court_case_number, judge_name, plaintiff_lawyer, stage, status, progress, filing_date, trial_date, judgment_date, judgment_amount, execution_court, case_description) VALUES
(1, 3, 'DLMP-L-20240103001', '王五', 120000.00, '北京市朝阳区人民法院', '(2024)京0105民初1001号', '张法官', '李律师', 3, 1, 60, '2024-01-05', '2024-01-20', NULL, NULL, NULL, '房贷逾期纠纷，调解失败后转入诉讼程序'),
(2, 1, 'DLMP-L-20240105001', '张三', 50000.00, '北京市海淀区人民法院', '(2024)京0108民初2001号', '王法官', '赵律师', 5, 1, 85, '2024-01-05', '2024-01-25', '2024-02-10', 52000.00, '北京市海淀区人民法院', '个人贷款纠纷，已判决进入执行阶段');

-- 插入法院事件数据
INSERT INTO court_events (id, case_id, type, title, description, scheduled_time, actual_time, location, status, result) VALUES
(1, 1, 'hearing', '第一次开庭', '案件首次开庭审理', '2024-01-20 09:00:00', '2024-01-20 09:15:00', '北京市朝阳区人民法院第三法庭', 'completed', '开庭审理完毕，择期宣判'),
(2, 1, 'hearing', '第二次开庭', '补充证据后再次开庭', '2024-02-05 14:00:00', NULL, '北京市朝阳区人民法院第五法庭', 'scheduled', NULL),
(3, 2, 'execution', '财产查封', '对被执行人财产进行查封', '2024-02-15 10:00:00', '2024-02-15 10:30:00', '被执行人住所地', 'completed', '查封房产一套，价值约60万元');

-- 插入文书模板数据
INSERT INTO document_templates (id, name, type, category, description, content, template_path, variables, file_type, created_by) VALUES
(1, '民事起诉状', 'complaint', 'litigation', '民事起诉状标准模板，适用于债权债务纠纷案件', 
'民事起诉状\n\n原告：${clientName}\n被告：${borrowerName}，身份证号：${borrowerIdCard}\n\n诉讼请求：\n1. 请求法院判令被告偿还债务人民币${debtAmount}元\n2. 本案诉讼费用由被告承担\n\n事实与理由：\n...\n\n此致\n${courtName}\n\n起诉人：${clientName}\n日期：${currentDate}', 
'/templates/civil_complaint.docx', 
'["caseNumber", "borrowerName", "borrowerIdCard", "debtAmount", "courtName", "currentDate", "clientName"]', 
'docx', '系统管理员'),

(2, '执行申请书', 'execution', 'litigation', '强制执行申请书模板', 
'执行申请书\n\n申请执行人：${clientName}\n被执行人：${borrowerName}\n\n申请执行标的：人民币${judgmentAmount}元\n\n申请执行依据：${courtName}作出的民事判决书（案件编号：${caseNumber}）\n\n申请执行事项：\n1. 强制执行判决书确定的债务\n2. 执行费用由被执行人承担\n\n此致\n${courtName}\n\n申请人：${clientName}\n日期：${currentDate}', 
'/templates/execution_application.docx', 
'["caseNumber", "borrowerName", "judgmentAmount", "courtName", "currentDate", "clientName"]', 
'docx', '系统管理员'),

(3, '庭审传票', 'summons', 'litigation', '法院庭审传票模板', 
'传票\n\n${borrowerName}：\n\n本院受理的${clientName}诉你债权债务纠纷一案（案件编号：${caseNumber}），定于${trialDate}在${courtName}${courtroom}开庭审理，你应准时到庭参加诉讼。\n\n如不到庭，将依法缺席判决。\n\n特此传唤\n\n${courtName}\n日期：${currentDate}', 
'/templates/court_summons.docx', 
'["caseNumber", "borrowerName", "trialDate", "courtName", "courtroom", "currentDate", "clientName"]', 
'docx', '系统管理员');

-- 插入执行记录数据
INSERT INTO execution_records (id, case_id, type, title, content, amount, execute_time, result) VALUES
(1, 2, 'freeze', '银行账户冻结', '冻结被执行人张三名下银行账户', 30000.00, '2024-02-20 10:00:00', '冻结成功，冻结金额3万元'),
(2, 2, 'auction', '房产拍卖', '拍卖被执行人名下房产', 600000.00, '2024-03-01 10:00:00', '拍卖成功，成交价60万元');

-- 插入系统配置数据
INSERT INTO system_config (config_key, config_value, description, type) VALUES
('system_name', '个贷不良资产分散诉讼调解平台', '系统名称', 'string'),
('max_upload_size', '10485760', '最大上传文件大小(字节)', 'number'),
('session_timeout', '7200', '会话超时时间(秒)', 'number'),
('enable_auto_assignment', 'true', '是否启用自动分案', 'boolean'),
('mediation_timeout_days', '30', '调解超时天数', 'number'),
('litigation_stages', '["诉前准备", "立案审查", "开庭审理", "判决生效", "强制执行", "执行完毕"]', '诉讼阶段配置', 'json');