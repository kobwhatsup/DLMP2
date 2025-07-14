-- 数据库索引优化脚本
-- 针对DLMP项目的查询场景优化索引

-- ==============================================
-- 用户表索引优化
-- ==============================================

-- 用户登录查询优化
CREATE INDEX IF NOT EXISTS idx_users_username_status ON users(username, status) 
WHERE status = 1;

-- 用户类型和状态查询
CREATE INDEX IF NOT EXISTS idx_users_type_status ON users(user_type, status);

-- 手机号查询优化
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 邮箱查询优化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 创建时间范围查询
CREATE INDEX IF NOT EXISTS idx_users_create_time ON users(create_time DESC);

-- ==============================================
-- 案件表索引优化
-- ==============================================

-- 案件编号唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS uk_cases_case_number ON cases(case_number);

-- 案件状态查询优化
CREATE INDEX IF NOT EXISTS idx_cases_status_create_time ON cases(status, create_time DESC);

-- 债务人姓名查询
CREATE INDEX IF NOT EXISTS idx_cases_borrower_name ON cases(borrower_name);

-- 债务人身份证查询
CREATE INDEX IF NOT EXISTS idx_cases_debtor_idcard ON cases(debtor_id_card);

-- 债务金额范围查询
CREATE INDEX IF NOT EXISTS idx_cases_debt_amount ON cases(debt_amount);

-- 创建用户查询
CREATE INDEX IF NOT EXISTS idx_cases_create_user ON cases(create_user_id, create_time DESC);

-- 分案相关查询
CREATE INDEX IF NOT EXISTS idx_cases_assignment ON cases(assigned_center_id, assignment_time);

-- 复合查询优化（状态+创建时间+用户）
CREATE INDEX IF NOT EXISTS idx_cases_complex ON cases(status, create_user_id, create_time DESC);

-- ==============================================
-- 调解记录表索引优化
-- ==============================================

-- 案件ID查询
CREATE INDEX IF NOT EXISTS idx_mediation_case_id ON mediation_records(case_id, create_time DESC);

-- 调解员查询
CREATE INDEX IF NOT EXISTS idx_mediation_mediator ON mediation_records(mediator_id, start_time DESC);

-- 调解状态查询
CREATE INDEX IF NOT EXISTS idx_mediation_status ON mediation_records(status, start_time DESC);

-- 调解时间范围查询
CREATE INDEX IF NOT EXISTS idx_mediation_time_range ON mediation_records(start_time, end_time);

-- ==============================================
-- 诉讼记录表索引优化
-- ==============================================

-- 案件ID查询
CREATE INDEX IF NOT EXISTS idx_litigation_case_id ON litigation_records(case_id, create_time DESC);

-- 法院查询
CREATE INDEX IF NOT EXISTS idx_litigation_court ON litigation_records(court_id, filing_time DESC);

-- 诉讼状态查询
CREATE INDEX IF NOT EXISTS idx_litigation_status ON litigation_records(status, filing_time DESC);

-- 诉讼类型查询
CREATE INDEX IF NOT EXISTS idx_litigation_type ON litigation_records(litigation_type, filing_time DESC);

-- ==============================================
-- 结算记录表索引优化
-- ==============================================

-- 案件ID查询
CREATE INDEX IF NOT EXISTS idx_settlement_case_id ON settlement_records(case_id, settlement_time DESC);

-- 结算状态查询
CREATE INDEX IF NOT EXISTS idx_settlement_status ON settlement_records(settlement_status, settlement_time DESC);

-- 结算金额查询
CREATE INDEX IF NOT EXISTS idx_settlement_amount ON settlement_records(settlement_amount);

-- 结算时间范围查询
CREATE INDEX IF NOT EXISTS idx_settlement_time_range ON settlement_records(settlement_time);

-- ==============================================
-- 文件管理表索引优化
-- ==============================================

-- 关联对象查询
CREATE INDEX IF NOT EXISTS idx_files_object ON file_records(object_type, object_id, create_time DESC);

-- 文件类型查询
CREATE INDEX IF NOT EXISTS idx_files_type ON file_records(file_type, create_time DESC);

-- 文件状态查询
CREATE INDEX IF NOT EXISTS idx_files_status ON file_records(status);

-- 上传用户查询
CREATE INDEX IF NOT EXISTS idx_files_uploader ON file_records(upload_user_id, create_time DESC);

-- ==============================================
-- 系统日志表索引优化
-- ==============================================

-- 操作时间查询
CREATE INDEX IF NOT EXISTS idx_logs_operation_time ON operation_logs(operation_time DESC);

-- 操作用户查询
CREATE INDEX IF NOT EXISTS idx_logs_user ON operation_logs(user_id, operation_time DESC);

-- 操作类型查询
CREATE INDEX IF NOT EXISTS idx_logs_operation_type ON operation_logs(operation_type, operation_time DESC);

-- IP地址查询
CREATE INDEX IF NOT EXISTS idx_logs_ip ON operation_logs(client_ip);

-- ==============================================
-- 通知消息表索引优化
-- ==============================================

-- 接收用户查询
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id, send_time DESC);

-- 消息状态查询
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, send_time DESC);

-- 消息类型查询
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(message_type, send_time DESC);

-- 未读消息查询
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(receiver_id, status, send_time DESC)
WHERE status = 0;

-- ==============================================
-- 分区表优化（大数据量表）
-- ==============================================

-- 操作日志按月分区
-- ALTER TABLE operation_logs PARTITION BY RANGE (YEAR(operation_time) * 100 + MONTH(operation_time)) (
--     PARTITION p202401 VALUES LESS THAN (202402),
--     PARTITION p202402 VALUES LESS THAN (202403),
--     PARTITION p202403 VALUES LESS THAN (202404),
--     PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

-- 通知消息按月分区
-- ALTER TABLE notifications PARTITION BY RANGE (YEAR(send_time) * 100 + MONTH(send_time)) (
--     PARTITION p202401 VALUES LESS THAN (202402),
--     PARTITION p202402 VALUES LESS THAN (202403),
--     PARTITION p202403 VALUES LESS THAN (202404),
--     PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

-- ==============================================
-- 查询统计信息更新
-- ==============================================

-- 更新表统计信息以优化查询计划
ANALYZE TABLE users;
ANALYZE TABLE cases;
ANALYZE TABLE mediation_records;
ANALYZE TABLE litigation_records;
ANALYZE TABLE settlement_records;
ANALYZE TABLE file_records;
ANALYZE TABLE operation_logs;
ANALYZE TABLE notifications;