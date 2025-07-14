-- 数据库分区表优化脚本
-- 针对大数据量表进行分区优化

-- ==============================================
-- 操作日志表分区（按月分区）
-- ==============================================

-- 创建分区操作日志表
DROP TABLE IF EXISTS operation_logs_partitioned;

CREATE TABLE operation_logs_partitioned (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '操作用户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_module VARCHAR(50) NOT NULL COMMENT '操作模块',
    operation_description TEXT COMMENT '操作描述',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    response_result TEXT COMMENT '响应结果',
    client_ip VARCHAR(50) COMMENT '客户端IP',
    user_agent VARCHAR(500) COMMENT '用户代理',
    operation_time DATETIME NOT NULL COMMENT '操作时间',
    execution_time BIGINT COMMENT '执行时间(ms)',
    status TINYINT DEFAULT 1 COMMENT '状态:1-成功,0-失败',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_operation_time (user_id, operation_time),
    INDEX idx_operation_type_time (operation_type, operation_time),
    INDEX idx_client_ip (client_ip),
    INDEX idx_status_time (status, operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='操作日志表(分区版)'
PARTITION BY RANGE (YEAR(operation_time) * 100 + MONTH(operation_time)) (
    PARTITION p202401 VALUES LESS THAN (202402) COMMENT '2024年1月',
    PARTITION p202402 VALUES LESS THAN (202403) COMMENT '2024年2月',
    PARTITION p202403 VALUES LESS THAN (202404) COMMENT '2024年3月',
    PARTITION p202404 VALUES LESS THAN (202405) COMMENT '2024年4月',
    PARTITION p202405 VALUES LESS THAN (202406) COMMENT '2024年5月',
    PARTITION p202406 VALUES LESS THAN (202407) COMMENT '2024年6月',
    PARTITION p202407 VALUES LESS THAN (202408) COMMENT '2024年7月',
    PARTITION p202408 VALUES LESS THAN (202409) COMMENT '2024年8月',
    PARTITION p202409 VALUES LESS THAN (202410) COMMENT '2024年9月',
    PARTITION p202410 VALUES LESS THAN (202411) COMMENT '2024年10月',
    PARTITION p202411 VALUES LESS THAN (202412) COMMENT '2024年11月',
    PARTITION p202412 VALUES LESS THAN (202501) COMMENT '2024年12月',
    PARTITION p202501 VALUES LESS THAN (202502) COMMENT '2025年1月',
    PARTITION p202502 VALUES LESS THAN (202503) COMMENT '2025年2月',
    PARTITION p202503 VALUES LESS THAN (202504) COMMENT '2025年3月',
    PARTITION p202504 VALUES LESS THAN (202505) COMMENT '2025年4月',
    PARTITION p202505 VALUES LESS THAN (202506) COMMENT '2025年5月',
    PARTITION p202506 VALUES LESS THAN (202507) COMMENT '2025年6月',
    PARTITION p202507 VALUES LESS THAN (202508) COMMENT '2025年7月',
    PARTITION p202508 VALUES LESS THAN (202509) COMMENT '2025年8月',
    PARTITION p202509 VALUES LESS THAN (202510) COMMENT '2025年9月',
    PARTITION p202510 VALUES LESS THAN (202511) COMMENT '2025年10月',
    PARTITION p202511 VALUES LESS THAN (202512) COMMENT '2025年11月',
    PARTITION p202512 VALUES LESS THAN (202601) COMMENT '2025年12月',
    PARTITION pmax VALUES LESS THAN MAXVALUE COMMENT '未来分区'
);

-- ==============================================
-- 通知消息表分区（按月分区）
-- ==============================================

-- 创建分区通知消息表
DROP TABLE IF EXISTS notifications_partitioned;

CREATE TABLE notifications_partitioned (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    receiver_id BIGINT NOT NULL COMMENT '接收用户ID',
    sender_id BIGINT COMMENT '发送用户ID',
    message_type TINYINT NOT NULL COMMENT '消息类型:1-系统通知,2-案件通知,3-调解通知,4-诉讼通知',
    title VARCHAR(200) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    related_type VARCHAR(50) COMMENT '关联类型',
    related_id BIGINT COMMENT '关联ID',
    status TINYINT DEFAULT 0 COMMENT '状态:0-未读,1-已读,2-已删除',
    send_time DATETIME NOT NULL COMMENT '发送时间',
    read_time DATETIME COMMENT '阅读时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_receiver_status_time (receiver_id, status, send_time),
    INDEX idx_message_type_time (message_type, send_time),
    INDEX idx_related (related_type, related_id),
    INDEX idx_send_time (send_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='通知消息表(分区版)'
PARTITION BY RANGE (YEAR(send_time) * 100 + MONTH(send_time)) (
    PARTITION p202401 VALUES LESS THAN (202402) COMMENT '2024年1月',
    PARTITION p202402 VALUES LESS THAN (202403) COMMENT '2024年2月',
    PARTITION p202403 VALUES LESS THAN (202404) COMMENT '2024年3月',
    PARTITION p202404 VALUES LESS THAN (202405) COMMENT '2024年4月',
    PARTITION p202405 VALUES LESS THAN (202406) COMMENT '2024年5月',
    PARTITION p202406 VALUES LESS THAN (202407) COMMENT '2024年6月',
    PARTITION p202407 VALUES LESS THAN (202408) COMMENT '2024年7月',
    PARTITION p202408 VALUES LESS THAN (202409) COMMENT '2024年8月',
    PARTITION p202409 VALUES LESS THAN (202410) COMMENT '2024年9月',
    PARTITION p202410 VALUES LESS THAN (202411) COMMENT '2024年10月',
    PARTITION p202411 VALUES LESS THAN (202412) COMMENT '2024年11月',
    PARTITION p202412 VALUES LESS THAN (202501) COMMENT '2024年12月',
    PARTITION p202501 VALUES LESS THAN (202502) COMMENT '2025年1月',
    PARTITION p202502 VALUES LESS THAN (202503) COMMENT '2025年2月',
    PARTITION p202503 VALUES LESS THAN (202504) COMMENT '2025年3月',
    PARTITION p202504 VALUES LESS THAN (202505) COMMENT '2025年4月',
    PARTITION p202505 VALUES LESS THAN (202506) COMMENT '2025年5月',
    PARTITION p202506 VALUES LESS THAN (202507) COMMENT '2025年6月',
    PARTITION p202507 VALUES LESS THAN (202508) COMMENT '2025年7月',
    PARTITION p202508 VALUES LESS THAN (202509) COMMENT '2025年8月',
    PARTITION p202509 VALUES LESS THAN (202510) COMMENT '2025年9月',
    PARTITION p202510 VALUES LESS THAN (202511) COMMENT '2025年10月',
    PARTITION p202511 VALUES LESS THAN (202512) COMMENT '2025年11月',
    PARTITION p202512 VALUES LESS THAN (202601) COMMENT '2025年12月',
    PARTITION pmax VALUES LESS THAN MAXVALUE COMMENT '未来分区'
);

-- ==============================================
-- 文件记录表分区（按年分区）
-- ==============================================

-- 创建分区文件记录表
DROP TABLE IF EXISTS file_records_partitioned;

CREATE TABLE file_records_partitioned (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(500) NOT NULL COMMENT '文件名',
    original_name VARCHAR(500) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(1000) NOT NULL COMMENT '文件路径',
    file_size BIGINT NOT NULL COMMENT '文件大小',
    file_type VARCHAR(50) COMMENT '文件类型',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    file_hash VARCHAR(64) COMMENT '文件哈希值',
    object_type VARCHAR(50) NOT NULL COMMENT '关联对象类型',
    object_id BIGINT NOT NULL COMMENT '关联对象ID',
    upload_user_id BIGINT NOT NULL COMMENT '上传用户ID',
    status TINYINT DEFAULT 1 COMMENT '状态:1-正常,0-已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_object (object_type, object_id, create_time),
    INDEX idx_file_type_time (file_type, create_time),
    INDEX idx_upload_user_time (upload_user_id, create_time),
    INDEX idx_file_hash (file_hash),
    INDEX idx_status_time (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='文件记录表(分区版)'
PARTITION BY RANGE (YEAR(create_time)) (
    PARTITION p2024 VALUES LESS THAN (2025) COMMENT '2024年',
    PARTITION p2025 VALUES LESS THAN (2026) COMMENT '2025年',
    PARTITION p2026 VALUES LESS THAN (2027) COMMENT '2026年',
    PARTITION p2027 VALUES LESS THAN (2028) COMMENT '2027年',
    PARTITION p2028 VALUES LESS THAN (2029) COMMENT '2028年',
    PARTITION pmax VALUES LESS THAN MAXVALUE COMMENT '未来分区'
);

-- ==============================================
-- 案件表按状态分区（可选）
-- ==============================================

-- 如果案件数据量非常大，可以考虑按状态分区
-- 但一般情况下，案件表不需要分区

-- ==============================================
-- 自动分区管理存储过程
-- ==============================================

DELIMITER //

-- 创建自动添加月度分区的存储过程
CREATE PROCEDURE AddMonthlyPartition(
    IN table_name VARCHAR(64),
    IN partition_column VARCHAR(64)
)
BEGIN
    DECLARE partition_name VARCHAR(32);
    DECLARE partition_value INT;
    DECLARE next_month_value INT;
    DECLARE sql_stmt TEXT;
    
    -- 获取下个月的分区值
    SET partition_value = YEAR(CURDATE()) * 100 + MONTH(CURDATE()) + 1;
    SET next_month_value = IF(MONTH(CURDATE()) = 12, 
                             (YEAR(CURDATE()) + 1) * 100 + 1, 
                             partition_value + 1);
    SET partition_name = CONCAT('p', partition_value);
    
    -- 检查分区是否已存在
    SET @partition_exists = 0;
    SELECT COUNT(*) INTO @partition_exists 
    FROM information_schema.PARTITIONS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = table_name 
      AND PARTITION_NAME = partition_name;
    
    -- 如果分区不存在，则创建
    IF @partition_exists = 0 THEN
        SET sql_stmt = CONCAT(
            'ALTER TABLE ', table_name, 
            ' ADD PARTITION (PARTITION ', partition_name,
            ' VALUES LESS THAN (', next_month_value, ')',
            ' COMMENT ''', DATE_FORMAT(STR_TO_DATE(partition_value, '%Y%m'), '%Y年%m月'), ''')'
        );
        
        SET @sql = sql_stmt;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        SELECT CONCAT('已创建分区: ', partition_name) AS result;
    ELSE
        SELECT CONCAT('分区已存在: ', partition_name) AS result;
    END IF;
END //

-- 创建清理旧分区的存储过程
CREATE PROCEDURE CleanOldPartitions(
    IN table_name VARCHAR(64),
    IN months_to_keep INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE partition_name VARCHAR(64);
    DECLARE partition_value INT;
    DECLARE cutoff_value INT;
    DECLARE sql_stmt TEXT;
    
    DECLARE partition_cursor CURSOR FOR
        SELECT PARTITION_NAME, 
               CAST(SUBSTRING(PARTITION_DESCRIPTION, 14, 6) AS UNSIGNED) as pvalue
        FROM information_schema.PARTITIONS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
          AND PARTITION_NAME IS NOT NULL
          AND PARTITION_NAME != 'pmax'
          AND PARTITION_DESCRIPTION LIKE 'VALUES LESS THAN%';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 计算保留数据的截止值
    SET cutoff_value = (YEAR(DATE_SUB(CURDATE(), INTERVAL months_to_keep MONTH)) * 100 + 
                       MONTH(DATE_SUB(CURDATE(), INTERVAL months_to_keep MONTH)));
    
    OPEN partition_cursor;
    
    read_loop: LOOP
        FETCH partition_cursor INTO partition_name, partition_value;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 如果分区值小于截止值，则删除分区
        IF partition_value < cutoff_value THEN
            SET sql_stmt = CONCAT('ALTER TABLE ', table_name, ' DROP PARTITION ', partition_name);
            
            SET @sql = sql_stmt;
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SELECT CONCAT('已删除分区: ', partition_name, ' (', partition_value, ')') AS result;
        END IF;
    END LOOP;
    
    CLOSE partition_cursor;
END //

DELIMITER ;

-- ==============================================
-- 分区维护事件调度
-- ==============================================

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 创建每月自动添加分区的事件
CREATE EVENT IF NOT EXISTS evt_add_monthly_partitions
ON SCHEDULE EVERY 1 MONTH
STARTS '2024-01-01 00:00:00'
DO BEGIN
    CALL AddMonthlyPartition('operation_logs_partitioned', 'operation_time');
    CALL AddMonthlyPartition('notifications_partitioned', 'send_time');
END;

-- 创建每月清理旧分区的事件（保留12个月数据）
CREATE EVENT IF NOT EXISTS evt_clean_old_partitions
ON SCHEDULE EVERY 1 MONTH
STARTS '2024-01-01 02:00:00'
DO BEGIN
    CALL CleanOldPartitions('operation_logs_partitioned', 12);
    CALL CleanOldPartitions('notifications_partitioned', 6);
END;

-- ==============================================
-- 分区查询示例
-- ==============================================

-- 查看分区信息
SELECT 
    TABLE_NAME,
    PARTITION_NAME,
    PARTITION_DESCRIPTION,
    TABLE_ROWS,
    DATA_LENGTH / 1024 / 1024 AS DATA_SIZE_MB,
    CREATE_TIME
FROM information_schema.PARTITIONS
WHERE TABLE_SCHEMA = DATABASE()
  AND PARTITION_NAME IS NOT NULL
ORDER BY TABLE_NAME, PARTITION_NAME;

-- 查询特定月份的操作日志（分区裁剪）
-- SELECT * FROM operation_logs_partitioned 
-- WHERE operation_time >= '2024-01-01' AND operation_time < '2024-02-01';

-- 查询特定用户的通知消息（分区裁剪）
-- SELECT * FROM notifications_partitioned 
-- WHERE receiver_id = 1 AND send_time >= '2024-01-01' AND send_time < '2024-02-01';