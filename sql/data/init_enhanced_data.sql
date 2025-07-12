-- 增强的基础数据初始化脚本
-- 创建时间: 2025-07-12
-- 基于增强的案件信息架构

-- 更新用户数据库基础数据
USE user_db;

-- 更新数据字典类型，添加新的类型
INSERT INTO t_dict_type (dict_code, dict_name, description, status, created_by) VALUES
('gender', '性别', '性别分类', 1, 1),
('education', '学历', '学历分类', 1, 1),
('marital_status', '婚姻状况', '婚姻状况分类', 1, 1),
('contact_type', '联系人类型', '案件联系人类型', 1, 1),
('contact_relationship', '联系人关系', '与债务人关系', 1, 1),
('repayment_method', '还款方式', '贷款还款方式', 1, 1),
('product_type', '产品类型', '贷款产品类型', 1, 1),
('channel_type', '渠道类型', '业务渠道类型', 1, 1),
('material_type_enhanced', '增强材料类型', '案件材料类型（增强版）', 1, 1),
('overdue_level', '逾期等级', '逾期M值等级', 1, 1),
('access_level', '访问级别', '文件访问级别', 1, 1),
('review_status', '审核状态', '文件审核状态', 1, 1);

-- 获取字典类型ID（简化处理，假设按顺序插入）
-- 性别
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'gender'), 'male', '男', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'gender'), 'female', '女', '2', 2, 1, 1);

-- 学历
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'primary', '小学', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'junior_high', '初中', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'senior_high', '高中', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'technical', '中专/技校', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'college', '大专', '5', 5, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'bachelor', '本科', '6', 6, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'master', '硕士', '7', 7, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'education'), 'doctor', '博士', '8', 8, 1, 1);

-- 婚姻状况
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'marital_status'), 'single', '未婚', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'marital_status'), 'married', '已婚', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'marital_status'), 'divorced', '离异', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'marital_status'), 'widowed', '丧偶', '4', 4, 1, 1);

-- 联系人类型
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_type'), 'emergency', '紧急联系人', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_type'), 'family', '家庭联系人', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_type'), 'work', '工作联系人', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_type'), 'other', '其他联系人', '4', 4, 1, 1);

-- 联系人关系
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'spouse', '配偶', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'parent', '父母', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'child', '子女', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'sibling', '兄弟姐妹', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'friend', '朋友', '5', 5, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'colleague', '同事', '6', 6, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'contact_relationship'), 'other', '其他', '7', 7, 1, 1);

-- 还款方式
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'repayment_method'), 'equal_installment', '等额本息', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'repayment_method'), 'equal_principal', '等额本金', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'repayment_method'), 'interest_first', '先息后本', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'repayment_method'), 'lump_sum', '一次性还本付息', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'repayment_method'), 'flexible', '灵活还款', '5', 5, 1, 1);

-- 产品类型
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'consumer_loan', '消费贷款', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'credit_card', '信用卡', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'car_loan', '汽车贷款', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'house_loan', '房屋贷款', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'business_loan', '经营贷款', '5', 5, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'education_loan', '教育贷款', '6', 6, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'product_type'), 'cash_loan', '现金贷', '7', 7, 1, 1);

-- 渠道类型
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'channel_type'), 'direct', '直营', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'channel_type'), 'agent', '代理', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'channel_type'), 'online', '线上', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'channel_type'), 'offline', '线下', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'channel_type'), 'partner', '合作伙伴', '5', 5, 1, 1);

-- 增强材料类型
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'contract', '合同', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'iou', '借据', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'loan_voucher', '放款凭证', '3', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'repayment_record', '还款记录', '4', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'collection_record', '催收记录', '5', 5, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'id_card', '身份证', '6', 6, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'bank_statement', '银行流水', '7', 7, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'guarantee_contract', '担保合同', '8', 8, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'mortgage_contract', '抵押合同', '9', 9, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'material_type_enhanced'), 'other', '其他', '10', 10, 1, 1);

-- 逾期等级
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm0', 'M0（当前）', '0', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm1', 'M1（1-30天）', '1', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm2', 'M2（31-60天）', '2', 3, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm3', 'M3（61-90天）', '3', 4, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm4', 'M4（91-120天）', '4', 5, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm5', 'M5（121-150天）', '5', 6, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm6', 'M6（151-180天）', '6', 7, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'overdue_level'), 'm7_plus', 'M7+（180天以上）', '7', 8, 1, 1);

-- 访问级别
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'access_level'), 'public', '公开', '1', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'access_level'), 'internal', '内部', '2', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'access_level'), 'confidential', '机密', '3', 3, 1, 1);

-- 审核状态
INSERT INTO t_dict_item (dict_type_id, item_code, item_name, item_value, sort_order, status, created_by) VALUES
((SELECT id FROM t_dict_type WHERE dict_code = 'review_status'), 'pending', '待审核', '0', 1, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'review_status'), 'approved', '审核通过', '1', 2, 1, 1),
((SELECT id FROM t_dict_type WHERE dict_code = 'review_status'), 'rejected', '审核拒绝', '2', 3, 1, 1);

-- 更新权限数据，添加新的权限
INSERT INTO t_permission (permission_code, permission_name, permission_type, parent_id, path, component, icon, sort_order, status, created_by) VALUES
-- 案件管理的新权限
('case:detail', '查看案件详情', 2, 7, NULL, NULL, NULL, 6, 1, 1),
('case:contact', '管理联系人', 2, 7, NULL, NULL, NULL, 7, 1, 1),
('case:extension', '管理扩展信息', 2, 7, NULL, NULL, NULL, 8, 1, 1),
('case:material_review', '审核案件材料', 2, 7, NULL, NULL, NULL, 9, 1, 1),
('case:batch_operation', '批量操作', 2, 7, NULL, NULL, NULL, 10, 1, 1),

-- 数据质量相关权限
('data:quality_check', '数据质量检查', 2, 7, NULL, NULL, NULL, 11, 1, 1),
('data:duplicate_check', '重复数据检查', 2, 8, NULL, NULL, NULL, 2, 1, 1),
('data:validation', '数据验证', 2, 8, NULL, NULL, NULL, 3, 1, 1);

-- 为现有角色添加新权限
-- 为案源端管理员添加案件详细权限
INSERT INTO t_role_permission (role_id, permission_id, created_by)
SELECT 3, p.id, 1 
FROM t_permission p 
WHERE p.permission_code IN ('case:detail', 'case:contact', 'case:extension', 'data:quality_check');

-- 为调解中心管理员添加案件查看权限
INSERT INTO t_role_permission (role_id, permission_id, created_by)
SELECT 5, p.id, 1 
FROM t_permission p 
WHERE p.permission_code IN ('case:detail', 'case:contact');

-- 初始化案件数据库基础数据
USE case_db;

-- 创建示例案件数据（用于测试）
INSERT INTO t_case (
    case_no, iou_number, debtor_id, debtor_name, debtor_id_card, debtor_phone,
    gender, education, marital_status, household_province, household_city,
    current_province, current_city, loan_project, loan_amount, debt_amount,
    overdue_days, overdue_m_value, product_type, consignor, capital_provider,
    source_org_id, source_org_name, case_status, priority_level, risk_level,
    created_by
) VALUES
(
    'CASE20240001', 'IOU20240001', 'DEBTOR001', '张三', '110101199001011234', '13800138001',
    1, '本科', '已婚', '北京市', '北京市',
    '上海市', '上海市', '消费贷款', 100000.00, 85000.00,
    45, 2, '消费贷款', '演示银行', '演示资方',
    2, '演示银行', 1, 2, 2,
    1
),
(
    'CASE20240002', 'IOU20240002', 'DEBTOR002', '李四', '110101199002021234', '13800138002',
    1, '大专', '未婚', '广东省', '深圳市',
    '广东省', '深圳市', '信用卡', 50000.00, 42000.00,
    75, 3, '信用卡', '演示银行', '演示资方',
    2, '演示银行', 2, 1, 3,
    1
);

-- 创建示例联系人数据
INSERT INTO t_case_contact (
    case_id, case_no, contact_name, contact_phone, relationship,
    contact_type, contact_priority, contact_status, created_by
) VALUES
(1, 'CASE20240001', '王五', '13900139001', '配偶', 1, 1, 1, 1),
(1, 'CASE20240001', '张父', '13900139002', '父母', 2, 2, 1, 1),
(2, 'CASE20240002', '李母', '13900139003', '父母', 1, 1, 1, 1);

-- 创建示例扩展信息
INSERT INTO t_case_extension (
    case_id, case_no, field_name, field_value, field_type, field_group,
    field_desc, is_searchable, created_by
) VALUES
(1, 'CASE20240001', 'special_note', 'VIP客户', 'string', 'customer_info', '客户特殊标注', 1, 1),
(1, 'CASE20240001', 'credit_score', '720', 'number', 'credit_info', '信用评分', 1, 1),
(2, 'CASE20240002', 'collection_difficulty', 'high', 'string', 'collection_info', '催收难度', 1, 1);

-- 创建示例批次数据
INSERT INTO t_case_batch (
    batch_no, batch_name, source_org_id, source_org_name,
    total_count, total_amount, import_status, success_count,
    quality_score, created_by
) VALUES
(
    'BATCH20240001', '2024年第一批案件', 2, '演示银行',
    2, 150000.00, 2, 2,
    95.5, 1
);

-- 更新案件的批次号
UPDATE t_case SET batch_no = 'BATCH20240001' WHERE id IN (1, 2);