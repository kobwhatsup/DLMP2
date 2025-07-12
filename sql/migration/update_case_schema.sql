-- 数据库架构迁移脚本
-- 从基础版本升级到增强版本
-- 创建时间: 2025-07-12

USE case_db;

-- 备份原有数据（如果需要）
-- CREATE TABLE t_case_backup AS SELECT * FROM t_case;
-- CREATE TABLE t_case_material_backup AS SELECT * FROM t_case_material;

-- 由于表结构变化较大，建议先导出数据，然后重建表结构
-- 这里提供数据迁移的思路

-- 1. 创建临时表保存重要数据
CREATE TEMPORARY TABLE temp_case_data AS
SELECT 
    id, case_no, batch_no, debtor_name, debtor_id_card,
    debt_amount, overdue_days, source_org_id, source_org_name,
    assigned_mediation_id, assigned_mediation_name, case_status,
    priority_level, risk_level, remark, created_by, created_time
FROM t_case;

CREATE TEMPORARY TABLE temp_material_data AS
SELECT 
    id, case_id, case_no, material_type, material_name,
    file_name, file_path, file_size, file_type, file_hash,
    uploaded_by, uploaded_time
FROM t_case_material;

-- 2. 删除外键约束（如果有）
-- ALTER TABLE t_case_material DROP FOREIGN KEY fk_case_material_case_id;

-- 3. 删除现有表
DROP TABLE IF EXISTS t_case_material;
DROP TABLE IF EXISTS t_case;

-- 4. 重新创建表（已在 03_case_tables_enhanced.sql 中定义）
-- 执行增强版表结构创建脚本

-- 5. 数据迁移脚本（在新表结构创建后执行）

-- 迁移案件数据
INSERT INTO t_case (
    id, case_no, batch_no, debtor_name, debtor_id_card,
    debt_amount, overdue_days, source_org_id, source_org_name,
    assigned_mediation_id, assigned_mediation_name, case_status,
    priority_level, risk_level, remark, created_by, created_time,
    -- 新增字段使用默认值或从其他字段推导
    debtor_id, loan_amount, loan_project, product_type,
    case_status, status_update_time
)
SELECT 
    id, case_no, batch_no, debtor_name, debtor_id_card,
    debt_amount, overdue_days, source_org_id, source_org_name,
    assigned_mediation_id, assigned_mediation_name, case_status,
    priority_level, risk_level, remark, created_by, created_time,
    -- 新增字段的处理
    CONCAT('DEBTOR', LPAD(id, 6, '0')) as debtor_id,  -- 生成债务人编号
    debt_amount as loan_amount,  -- 假设贷款金额等于债务金额
    '未知产品' as loan_project,  -- 默认值
    '其他' as product_type,  -- 默认值
    case_status,
    created_time as status_update_time
FROM temp_case_data;

-- 迁移材料数据
INSERT INTO t_case_material (
    id, case_id, case_no, material_type, material_name,
    file_name, file_path, file_size, file_type, file_hash,
    uploaded_by, uploaded_time,
    -- 新增字段使用默认值
    material_desc, storage_type, status, access_level
)
SELECT 
    id, case_id, case_no, material_type, material_name,
    file_name, file_path, file_size, file_type, file_hash,
    uploaded_by, uploaded_time,
    -- 新增字段的默认值
    CONCAT(material_name, '相关材料') as material_desc,
    2 as storage_type,  -- 假设使用OSS存储
    1 as status,  -- 正常状态
    2 as access_level  -- 内部访问级别
FROM temp_material_data;

-- 6. 数据完整性检查
-- 检查迁移后的数据数量
SELECT 
    (SELECT COUNT(*) FROM temp_case_data) as original_case_count,
    (SELECT COUNT(*) FROM t_case) as migrated_case_count,
    (SELECT COUNT(*) FROM temp_material_data) as original_material_count,
    (SELECT COUNT(*) FROM t_case_material) as migrated_material_count;

-- 7. 创建必要的索引（如果在表创建时没有）
-- ALTER TABLE t_case ADD INDEX idx_debtor_id (debtor_id);
-- ALTER TABLE t_case ADD INDEX idx_loan_project (loan_project);
-- ALTER TABLE t_case ADD INDEX idx_product_type (product_type);

-- 8. 更新统计信息
-- ANALYZE TABLE t_case;
-- ANALYZE TABLE t_case_material;

-- 9. 清理临时表
-- DROP TEMPORARY TABLE temp_case_data;
-- DROP TEMPORARY TABLE temp_material_data;

-- 数据验证查询
-- 验证关键字段是否正确迁移
SELECT 
    case_no, debtor_name, debtor_id_card, debt_amount, 
    overdue_days, case_status, created_time
FROM t_case 
ORDER BY id 
LIMIT 10;

-- 验证材料数据
SELECT 
    cm.case_no, cm.material_name, cm.file_name, 
    cm.material_type, cm.uploaded_time
FROM t_case_material cm
JOIN t_case c ON cm.case_id = c.id
ORDER BY cm.id 
LIMIT 10;