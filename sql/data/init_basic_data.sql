-- 基础数据初始化脚本
-- 创建时间: 2025-07-12

-- 初始化用户数据库基础数据
USE user_db;

-- 初始化数据字典类型
INSERT INTO t_dict_type (dict_code, dict_name, description, status, created_by) VALUES
('user_type', '用户类型', '系统用户类型分类', 1, 1),
('org_type', '机构类型', '机构类型分类', 1, 1),
('case_status', '案件状态', '案件处理状态', 1, 1),
('mediation_status', '调解状态', '调解处理状态', 1, 1),
('litigation_status', '诉讼状态', '诉讼处理状态', 1, 1),
('settlement_type', '结算类型', '结算业务类型', 1, 1),
('material_type', '材料类型', '案件材料类型', 1, 1),
('priority_level', '优先级', '优先级等级', 1, 1),
('risk_level', '风险等级', '风险等级分类', 1, 1),
('capacity_level', '能力等级', '机构能力等级', 1, 1);

-- 初始化数据字典项
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
-- 用户类型
(1, 'case_source', '案源端客户', '1', 1, 1, 1),
(1, 'mediation_center', '调解中心', '2', 2, 1, 1),
(1, 'platform_operator', '平台运营', '3', 3, 1, 1),
(1, 'system_admin', '系统管理员', '4', 4, 1, 1),

-- 机构类型
(2, 'bank', '银行', '1', 1, 1, 1),
(2, 'consumer_finance', '消费金融公司', '2', 2, 1, 1),
(2, 'microfinance', '小贷公司', '3', 3, 1, 1),
(2, 'asset_management', '资产管理公司', '4', 4, 1, 1),
(2, 'law_firm', '律所', '5', 5, 1, 1),
(2, 'mediation_org', '调解中心', '6', 6, 1, 1),

-- 案件状态
(3, 'pending_assignment', '待分配', '1', 1, 1, 1),
(3, 'in_mediation', '调解中', '2', 2, 1, 1),
(3, 'mediation_success', '调解成功', '3', 3, 1, 1),
(3, 'mediation_failed', '调解失败', '4', 4, 1, 1),
(3, 'in_litigation', '诉讼中', '5', 5, 1, 1),
(3, 'case_closed', '已结案', '6', 6, 1, 1),
(3, 'case_withdrawn', '已撤回', '7', 7, 1, 1),

-- 调解状态
(4, 'in_progress', '进行中', '1', 1, 1, 1),
(4, 'mediation_success', '调解成功', '2', 2, 1, 1),
(4, 'mediation_failed', '调解失败', '3', 3, 1, 1),
(4, 'debtor_refused', '当事人拒绝', '4', 4, 1, 1),
(4, 'timeout_incomplete', '超时未完成', '5', 5, 1, 1),

-- 诉讼状态
(5, 'preparing', '准备中', '1', 1, 1, 1),
(5, 'filed', '已立案', '2', 2, 1, 1),
(5, 'in_trial', '审理中', '3', 3, 1, 1),
(5, 'judged', '已判决', '4', 4, 1, 1),
(5, 'in_execution', '执行中', '5', 5, 1, 1),
(5, 'case_closed', '已结案', '6', 6, 1, 1),
(5, 'case_withdrawn', '已撤诉', '7', 7, 1, 1),

-- 结算类型
(6, 'mediation_seat_rental', '调解坐席租赁', '1', 1, 1, 1),
(6, 'litigation_service', '分散诉讼服务', '2', 2, 1, 1),
(6, 'success_fee', '成功收费', '3', 3, 1, 1),

-- 材料类型
(7, 'contract', '合同', '1', 1, 1, 1),
(7, 'iou', '借据', '2', 2, 1, 1),
(7, 'loan_voucher', '放款凭证', '3', 3, 1, 1),
(7, 'repayment_record', '还款记录', '4', 4, 1, 1),
(7, 'collection_record', '催收记录', '5', 5, 1, 1),
(7, 'id_card', '身份证', '6', 6, 1, 1),
(7, 'other', '其他', '7', 7, 1, 1),

-- 优先级
(8, 'high', '高', '1', 1, 1, 1),
(8, 'medium', '中', '2', 2, 1, 1),
(8, 'low', '低', '3', 3, 1, 1),

-- 风险等级
(9, 'high', '高', '1', 1, 1, 1),
(9, 'medium', '中', '2', 2, 1, 1),
(9, 'low', '低', '3', 3, 1, 1),

-- 能力等级
(10, 'low', '低', '1', 1, 1, 1),
(10, 'medium', '中', '2', 2, 1, 1),
(10, 'high', '高', '3', 3, 1, 1);

-- 初始化权限数据
INSERT INTO t_permission (permission_code, permission_name, permission_type, parent_id, path, component, icon, sort_order, status, created_by) VALUES
-- 一级菜单
('dashboard', '控制面板', 1, 0, '/dashboard', 'Dashboard', 'dashboard', 1, 1, 1),
('case_management', '案件管理', 1, 0, '/cases', 'CaseManagement', 'case', 2, 1, 1),
('mediation_management', '调解管理', 1, 0, '/mediation', 'MediationManagement', 'mediation', 3, 1, 1),
('litigation_management', '诉讼管理', 1, 0, '/litigation', 'LitigationManagement', 'litigation', 4, 1, 1),
('settlement_management', '结算管理', 1, 0, '/settlement', 'SettlementManagement', 'settlement', 5, 1, 1),
('system_management', '系统管理', 1, 0, '/system', 'SystemManagement', 'system', 6, 1, 1),

-- 案件管理二级菜单
('case_list', '案件列表', 1, 2, '/cases/list', 'CaseList', 'list', 1, 1, 1),
('case_import', '案件导入', 1, 2, '/cases/import', 'CaseImport', 'import', 2, 1, 1),
('case_assignment', '案件分配', 1, 2, '/cases/assignment', 'CaseAssignment', 'assignment', 3, 1, 1),
('case_supervision', '案件督办', 1, 2, '/cases/supervision', 'CaseSupervision', 'supervision', 4, 1, 1),

-- 调解管理二级菜单
('mediation_workbench', '调解工作台', 1, 3, '/mediation/workbench', 'MediationWorkbench', 'workbench', 1, 1, 1),
('mediation_center', '调解中心管理', 1, 3, '/mediation/centers', 'MediationCenter', 'center', 2, 1, 1),
('mediator_management', '调解员管理', 1, 3, '/mediation/mediators', 'MediatorManagement', 'mediator', 3, 1, 1),
('mediation_templates', '文书模板', 1, 3, '/mediation/templates', 'MediationTemplates', 'template', 4, 1, 1),

-- 诉讼管理二级菜单
('litigation_cases', '诉讼案件', 1, 4, '/litigation/cases', 'LitigationCases', 'litigation-case', 1, 1, 1),
('court_management', '法院管理', 1, 4, '/litigation/courts', 'CourtManagement', 'court', 2, 1, 1),
('property_clues', '财产线索', 1, 4, '/litigation/property', 'PropertyClues', 'property', 3, 1, 1),
('execution_records', '执行记录', 1, 4, '/litigation/execution', 'ExecutionRecords', 'execution', 4, 1, 1),

-- 结算管理二级菜单
('settlement_records', '结算记录', 1, 5, '/settlement/records', 'SettlementRecords', 'record', 1, 1, 1),
('settlement_rules', '结算规则', 1, 5, '/settlement/rules', 'SettlementRules', 'rule', 2, 1, 1),
('payment_records', '支付记录', 1, 5, '/settlement/payments', 'PaymentRecords', 'payment', 3, 1, 1),
('settlement_reports', '结算报表', 1, 5, '/settlement/reports', 'SettlementReports', 'report', 4, 1, 1),

-- 系统管理二级菜单
('user_management', '用户管理', 1, 6, '/system/users', 'UserManagement', 'user', 1, 1, 1),
('role_management', '角色管理', 1, 6, '/system/roles', 'RoleManagement', 'role', 2, 1, 1),
('org_management', '机构管理', 1, 6, '/system/organizations', 'OrgManagement', 'organization', 3, 1, 1),
('dict_management', '字典管理', 1, 6, '/system/dictionaries', 'DictManagement', 'dictionary', 4, 1, 1),
('log_management', '日志管理', 1, 6, '/system/logs', 'LogManagement', 'log', 5, 1, 1),

-- 按钮权限
('case:create', '创建案件', 2, 7, NULL, NULL, NULL, 1, 1, 1),
('case:update', '编辑案件', 2, 7, NULL, NULL, NULL, 2, 1, 1),
('case:delete', '删除案件', 2, 7, NULL, NULL, NULL, 3, 1, 1),
('case:view', '查看案件', 2, 7, NULL, NULL, NULL, 4, 1, 1),
('case:import', '导入案件', 2, 8, NULL, NULL, NULL, 1, 1, 1),
('case:export', '导出案件', 2, 7, NULL, NULL, NULL, 5, 1, 1),
('case:assign', '分配案件', 2, 9, NULL, NULL, NULL, 1, 1, 1),
('case:supervise', '督办案件', 2, 10, NULL, NULL, NULL, 1, 1, 1),

('mediation:accept', '接收案件', 2, 11, NULL, NULL, NULL, 1, 1, 1),
('mediation:process', '处理调解', 2, 11, NULL, NULL, NULL, 2, 1, 1),
('mediation:complete', '完成调解', 2, 11, NULL, NULL, NULL, 3, 1, 1),

('user:create', '创建用户', 2, 19, NULL, NULL, NULL, 1, 1, 1),
('user:update', '编辑用户', 2, 19, NULL, NULL, NULL, 2, 1, 1),
('user:delete', '删除用户', 2, 19, NULL, NULL, NULL, 3, 1, 1),
('user:reset_password', '重置密码', 2, 19, NULL, NULL, NULL, 4, 1, 1);

-- 初始化角色数据
INSERT INTO t_role (role_code, role_name, description, status, created_by) VALUES
('super_admin', '超级管理员', '系统最高权限管理员', 1, 1),
('platform_admin', '平台管理员', '平台运营管理员', 1, 1),
('case_source_admin', '案源端管理员', '案源端机构管理员', 1, 1),
('case_source_user', '案源端用户', '案源端普通用户', 1, 1),
('mediation_admin', '调解中心管理员', '调解中心管理员', 1, 1),
('mediation_user', '调解中心用户', '调解中心普通用户', 1, 1),
('mediator', '调解员', '执行调解工作的调解员', 1, 1);

-- 初始化机构数据
INSERT INTO t_organization (org_code, org_name, org_type, province, city, contact_person, contact_phone, status, created_by) VALUES
('MATRIX001', '杭州矩阵智能公司', 6, '浙江省', '杭州市', '系统管理员', '13800138000', 1, 1),
('DEMO_BANK001', '演示银行', 1, '浙江省', '杭州市', '张三', '13800138001', 1, 1),
('DEMO_MC001', '演示调解中心', 6, '浙江省', '杭州市', '李四', '13800138002', 1, 1);

-- 初始化超级管理员用户
INSERT INTO t_user (username, password, real_name, phone, email, user_type, organization_id, status, created_by) VALUES
('admin', '$2a$10$7JB720yubVSFLEgYPUgdQe.D.7J8w/LV9g1.JtQr6RnK8b9wJYO5a', '系统管理员', '13800138000', 'admin@matrix.com', 3, 1, 1, 1),
('demo_bank_admin', '$2a$10$7JB720yubVSFLEgYPUgdQe.D.7J8w/LV9g1.JtQr6RnK8b9wJYO5a', '演示银行管理员', '13800138001', 'bank@demo.com', 1, 2, 1, 1),
('demo_mc_admin', '$2a$10$7JB720yubVSFLEgYPUgdQe.D.7J8w/LV9g1.JtQr6RnK8b9wJYO5a', '演示调解中心管理员', '13800138002', 'mc@demo.com', 2, 3, 1, 1);

-- 注意：密码是 'admin123' 的BCrypt加密结果

-- 分配角色给用户
INSERT INTO t_user_role (user_id, role_id, created_by) VALUES
(1, 1, 1),  -- admin用户分配超级管理员角色
(2, 3, 1),  -- 演示银行管理员
(3, 5, 1);  -- 演示调解中心管理员

-- 为超级管理员角色分配所有权限
INSERT INTO t_role_permission (role_id, permission_id, created_by)
SELECT 1, id, 1 FROM t_permission WHERE status = 1;

-- 为案源端管理员分配相关权限（案件管理、结算查看等）
INSERT INTO t_role_permission (role_id, permission_id, created_by) VALUES
(3, 1, 1),   -- 控制面板
(3, 2, 1),   -- 案件管理
(3, 7, 1),   -- 案件列表
(3, 8, 1),   -- 案件导入
(3, 9, 1),   -- 案件分配
(3, 10, 1),  -- 案件督办
(3, 5, 1),   -- 结算管理
(3, 16, 1),  -- 结算记录
(3, 18, 1),  -- 支付记录
(3, 19, 1);  -- 结算报表

-- 为调解中心管理员分配相关权限（调解管理、案件查看等）
INSERT INTO t_role_permission (role_id, permission_id, created_by) VALUES
(5, 1, 1),   -- 控制面板
(5, 2, 1),   -- 案件管理
(5, 7, 1),   -- 案件列表
(5, 3, 1),   -- 调解管理
(5, 11, 1),  -- 调解工作台
(5, 12, 1),  -- 调解中心管理
(5, 13, 1),  -- 调解员管理
(5, 14, 1),  -- 文书模板
(5, 4, 1),   -- 诉讼管理
(5, 15, 1),  -- 诉讼案件
(5, 5, 1),   -- 结算管理
(5, 16, 1);  -- 结算记录

-- 初始化调解中心数据
USE mediation_db;

INSERT INTO t_mediation_center (center_code, center_name, center_type, province, city, district, contact_person, contact_phone, capacity_level, status, created_by) VALUES
('MC001', '杭州市滨江区调解中心', 1, '浙江省', '杭州市', '滨江区', '王五', '13800138003', 2, 1, 1),
('MC002', '杭州市西湖区调解中心', 1, '浙江省', '杭州市', '西湖区', '赵六', '13800138004', 2, 1, 1),
('MC003', '上海市浦东新区调解中心', 1, '上海市', '上海市', '浦东新区', '孙七', '13800138005', 3, 1, 1);

-- 初始化调解员数据
INSERT INTO t_mediator (mediator_code, mediation_center_id, name, phone, email, qualification_level, status, created_by) VALUES
('MED001', 1, '张调解', '13900139001', 'zhang@mediation.com', 2, 1, 1),
('MED002', 1, '李调解', '13900139002', 'li@mediation.com', 2, 1, 1),
('MED003', 2, '王调解', '13900139003', 'wang@mediation.com', 3, 1, 1),
('MED004', 3, '刘调解', '13900139004', 'liu@mediation.com', 3, 1, 1);

-- 初始化文书模板数据
INSERT INTO t_mediation_template (template_code, template_name, template_type, template_content, status, is_default, created_by) VALUES
('TPL001', '标准调解协议模板', 1, '调解协议书模板内容...', 1, 1, 1),
('TPL002', '司法确认申请书模板', 2, '司法确认申请书模板内容...', 1, 1, 1),
('TPL003', '调解通知书模板', 3, '调解通知书模板内容...', 1, 1, 1);

-- 初始化法院信息
USE litigation_db;

INSERT INTO t_court_info (court_code, court_name, court_level, province, city, district, contact_phone, status, created_by) VALUES
('COURT001', '杭州市滨江区人民法院', 1, '浙江省', '杭州市', '滨江区', '0571-12345001', 1, 1),
('COURT002', '杭州市西湖区人民法院', 1, '浙江省', '杭州市', '西湖区', '0571-12345002', 1, 1),
('COURT003', '杭州市中级人民法院', 2, '浙江省', '杭州市', '', '0571-12345003', 1, 1),
('COURT004', '上海市浦东新区人民法院', 1, '上海市', '上海市', '浦东新区', '021-12345001', 1, 1);

-- 初始化结算规则
USE settlement_db;

INSERT INTO t_settlement_rule (rule_code, rule_name, rule_type, fee_calculation_method, base_fee, fee_rate, min_fee, max_fee, settlement_cycle, status, effective_date, created_by) VALUES
('RULE001', '调解坐席租赁费用标准', 1, 1, 1000.00, 0, 1000.00, 5000.00, 1, 1, '2024-01-01', 1),
('RULE002', '分散诉讼服务费用标准', 2, 2, 0, 0.03, 500.00, 10000.00, 1, 1, '2024-01-01', 1),
('RULE003', '调解成功奖励费用', 3, 2, 0, 0.01, 100.00, 2000.00, 1, 1, '2024-01-01', 1);

-- 初始化日志清理配置
USE log_db;

INSERT INTO t_log_cleanup_config (table_name, retention_days, cleanup_enabled, cleanup_hour, batch_size) VALUES
('t_operation_log', 365, 1, 2, 10000),
('t_access_log', 90, 1, 2, 20000),
('t_error_log', 180, 1, 2, 10000),
('t_performance_log', 30, 1, 2, 50000),
('t_security_audit', 730, 1, 2, 10000),
('t_data_change_audit', 1095, 1, 2, 10000);