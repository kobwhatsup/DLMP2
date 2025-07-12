-- 日志管理相关表结构
-- 数据库: log_db
USE log_db;

-- 系统操作日志表（按月分表：t_operation_log_202401, t_operation_log_202402...）
CREATE TABLE t_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    trace_id VARCHAR(64) COMMENT '链路追踪ID',
    
    -- 操作信息
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_name VARCHAR(200) NOT NULL COMMENT '操作名称',
    operation_desc VARCHAR(500) COMMENT '操作描述',
    
    -- 业务信息
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id BIGINT COMMENT '业务对象ID',
    business_no VARCHAR(100) COMMENT '业务对象编号',
    
    -- 请求信息
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    request_body TEXT COMMENT '请求体',
    request_ip VARCHAR(50) COMMENT '请求IP',
    user_agent VARCHAR(500) COMMENT '用户代理',
    
    -- 响应信息
    response_status INT COMMENT '响应状态码',
    response_body TEXT COMMENT '响应内容',
    response_time BIGINT COMMENT '响应时间（毫秒）',
    
    -- 操作人信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    operator_type TINYINT COMMENT '操作人类型：1-用户，2-系统，3-定时任务',
    org_id BIGINT COMMENT '操作人机构ID',
    org_name VARCHAR(200) COMMENT '操作人机构名称',
    
    -- 操作结果
    operation_result TINYINT DEFAULT 1 COMMENT '操作结果：1-成功，0-失败',
    error_message TEXT COMMENT '错误信息',
    error_stack TEXT COMMENT '错误堆栈',
    
    -- 变更信息
    before_value TEXT COMMENT '变更前值',
    after_value TEXT COMMENT '变更后值',
    
    -- 风险等级
    risk_level TINYINT DEFAULT 2 COMMENT '风险等级：1-高，2-中，3-低',
    
    -- 时间戳
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_trace_id (trace_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_business_type (business_type),
    INDEX idx_business_id (business_id),
    INDEX idx_business_no (business_no),
    INDEX idx_operator_id (operator_id),
    INDEX idx_org_id (org_id),
    INDEX idx_operation_result (operation_result),
    INDEX idx_risk_level (risk_level),
    INDEX idx_operation_time (operation_time),
    INDEX idx_response_time (response_time)
) COMMENT '系统操作日志表';

-- 系统访问日志表（按日分表：t_access_log_20240101, t_access_log_20240102...）
CREATE TABLE t_access_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    session_id VARCHAR(64) COMMENT '会话ID',
    trace_id VARCHAR(64) COMMENT '链路追踪ID',
    
    -- 访问信息
    request_method VARCHAR(10) NOT NULL COMMENT '请求方法',
    request_url VARCHAR(500) NOT NULL COMMENT '请求URL',
    request_uri VARCHAR(300) COMMENT '请求URI',
    query_string VARCHAR(1000) COMMENT '查询字符串',
    
    -- 客户端信息
    client_ip VARCHAR(50) COMMENT '客户端IP',
    real_ip VARCHAR(50) COMMENT '真实IP',
    user_agent TEXT COMMENT '用户代理',
    referer VARCHAR(500) COMMENT '来源页面',
    
    -- 设备信息
    device_type VARCHAR(50) COMMENT '设备类型',
    browser VARCHAR(100) COMMENT '浏览器',
    browser_version VARCHAR(50) COMMENT '浏览器版本',
    os VARCHAR(100) COMMENT '操作系统',
    os_version VARCHAR(50) COMMENT '系统版本',
    
    -- 地理位置
    country VARCHAR(100) COMMENT '国家',
    province VARCHAR(100) COMMENT '省份',
    city VARCHAR(100) COMMENT '城市',
    isp VARCHAR(100) COMMENT '运营商',
    
    -- 用户信息
    user_id BIGINT COMMENT '用户ID',
    username VARCHAR(100) COMMENT '用户名',
    org_id BIGINT COMMENT '机构ID',
    
    -- 响应信息
    response_status INT COMMENT '响应状态码',
    response_size BIGINT COMMENT '响应大小（字节）',
    response_time BIGINT COMMENT '响应时间（毫秒）',
    
    -- 时间戳
    access_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    
    INDEX idx_session_id (session_id),
    INDEX idx_trace_id (trace_id),
    INDEX idx_client_ip (client_ip),
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_org_id (org_id),
    INDEX idx_response_status (response_status),
    INDEX idx_response_time (response_time),
    INDEX idx_access_time (access_time)
) COMMENT '系统访问日志表';

-- 系统错误日志表（按日分表：t_error_log_20240101, t_error_log_20240102...）
CREATE TABLE t_error_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '错误ID',
    error_id VARCHAR(64) NOT NULL COMMENT '错误唯一标识',
    trace_id VARCHAR(64) COMMENT '链路追踪ID',
    
    -- 错误信息
    error_type VARCHAR(50) NOT NULL COMMENT '错误类型',
    error_level TINYINT NOT NULL COMMENT '错误级别：1-严重，2-错误，3-警告，4-信息',
    error_title VARCHAR(200) COMMENT '错误标题',
    error_message TEXT COMMENT '错误消息',
    error_stack TEXT COMMENT '错误堆栈',
    error_cause TEXT COMMENT '错误原因',
    
    -- 服务信息
    service_name VARCHAR(100) COMMENT '服务名称',
    service_version VARCHAR(50) COMMENT '服务版本',
    service_host VARCHAR(100) COMMENT '服务主机',
    service_port INT COMMENT '服务端口',
    
    -- 方法信息
    class_name VARCHAR(200) COMMENT '类名',
    method_name VARCHAR(100) COMMENT '方法名',
    line_number INT COMMENT '行号',
    
    -- 请求信息
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    
    -- 用户信息
    user_id BIGINT COMMENT '用户ID',
    username VARCHAR(100) COMMENT '用户名',
    user_ip VARCHAR(50) COMMENT '用户IP',
    
    -- 业务信息
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id BIGINT COMMENT '业务ID',
    business_context TEXT COMMENT '业务上下文',
    
    -- 环境信息
    environment VARCHAR(50) COMMENT '环境（dev/test/prod）',
    jvm_memory_used BIGINT COMMENT 'JVM已用内存',
    jvm_memory_total BIGINT COMMENT 'JVM总内存',
    cpu_usage DECIMAL(5,2) COMMENT 'CPU使用率',
    
    -- 处理信息
    is_resolved TINYINT DEFAULT 0 COMMENT '是否已解决：1-是，0-否',
    resolve_time DATETIME COMMENT '解决时间',
    resolver VARCHAR(100) COMMENT '解决人',
    resolve_note TEXT COMMENT '解决说明',
    
    -- 时间戳
    occurred_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发生时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_error_id (error_id),
    INDEX idx_trace_id (trace_id),
    INDEX idx_error_type (error_type),
    INDEX idx_error_level (error_level),
    INDEX idx_service_name (service_name),
    INDEX idx_user_id (user_id),
    INDEX idx_business_type (business_type),
    INDEX idx_business_id (business_id),
    INDEX idx_is_resolved (is_resolved),
    INDEX idx_occurred_time (occurred_time)
) COMMENT '系统错误日志表';

-- 系统性能日志表（按小时分表：t_performance_log_2024010100, t_performance_log_2024010101...）
CREATE TABLE t_performance_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '性能日志ID',
    trace_id VARCHAR(64) COMMENT '链路追踪ID',
    span_id VARCHAR(64) COMMENT 'Span ID',
    
    -- 接口信息
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    interface_name VARCHAR(200) NOT NULL COMMENT '接口名称',
    method_name VARCHAR(100) COMMENT '方法名称',
    
    -- 性能指标
    execution_time BIGINT NOT NULL COMMENT '执行时间（毫秒）',
    cpu_time BIGINT COMMENT 'CPU时间（毫秒）',
    memory_used BIGINT COMMENT '内存使用（字节）',
    db_query_count INT DEFAULT 0 COMMENT '数据库查询次数',
    db_query_time BIGINT DEFAULT 0 COMMENT '数据库查询时间（毫秒）',
    cache_hit_count INT DEFAULT 0 COMMENT '缓存命中次数',
    cache_miss_count INT DEFAULT 0 COMMENT '缓存未命中次数',
    
    -- 请求信息
    request_size BIGINT COMMENT '请求大小（字节）',
    response_size BIGINT COMMENT '响应大小（字节）',
    concurrent_requests INT COMMENT '并发请求数',
    
    -- 用户信息
    user_id BIGINT COMMENT '用户ID',
    org_id BIGINT COMMENT '机构ID',
    
    -- 状态信息
    is_success TINYINT DEFAULT 1 COMMENT '是否成功：1-成功，0-失败',
    error_code VARCHAR(50) COMMENT '错误代码',
    
    -- 告警信息
    is_slow TINYINT DEFAULT 0 COMMENT '是否慢查询：1-是，0-否',
    slow_threshold BIGINT COMMENT '慢查询阈值（毫秒）',
    
    -- 时间戳
    start_time DATETIME COMMENT '开始时间',
    end_time DATETIME COMMENT '结束时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_trace_id (trace_id),
    INDEX idx_service_name (service_name),
    INDEX idx_interface_name (interface_name),
    INDEX idx_execution_time (execution_time),
    INDEX idx_user_id (user_id),
    INDEX idx_org_id (org_id),
    INDEX idx_is_success (is_success),
    INDEX idx_is_slow (is_slow),
    INDEX idx_start_time (start_time)
) COMMENT '系统性能日志表';

-- 业务流程日志表
CREATE TABLE t_business_flow_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '流程日志ID',
    flow_id VARCHAR(64) NOT NULL COMMENT '流程实例ID',
    flow_type VARCHAR(50) NOT NULL COMMENT '流程类型',
    flow_name VARCHAR(200) COMMENT '流程名称',
    
    -- 节点信息
    node_id VARCHAR(100) NOT NULL COMMENT '节点ID',
    node_name VARCHAR(200) COMMENT '节点名称',
    node_type VARCHAR(50) COMMENT '节点类型',
    
    -- 业务信息
    business_id BIGINT COMMENT '业务对象ID',
    business_no VARCHAR(100) COMMENT '业务编号',
    business_type VARCHAR(50) COMMENT '业务类型',
    
    -- 流程状态
    flow_status TINYINT NOT NULL COMMENT '流程状态：1-开始，2-进行中，3-完成，4-异常，5-终止',
    node_status TINYINT NOT NULL COMMENT '节点状态：1-开始，2-进行中，3-完成，4-跳过，5-失败',
    
    -- 执行信息
    executor_id BIGINT COMMENT '执行人ID',
    executor_name VARCHAR(100) COMMENT '执行人姓名',
    executor_type TINYINT COMMENT '执行人类型：1-用户，2-系统',
    
    -- 处理信息
    process_data TEXT COMMENT '处理数据（JSON格式）',
    process_result TEXT COMMENT '处理结果',
    error_message TEXT COMMENT '错误信息',
    
    -- 时间信息
    start_time DATETIME COMMENT '开始时间',
    end_time DATETIME COMMENT '结束时间',
    duration BIGINT COMMENT '持续时间（毫秒）',
    
    -- 备注信息
    remark VARCHAR(1000) COMMENT '备注',
    
    -- 时间戳
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_flow_id (flow_id),
    INDEX idx_flow_type (flow_type),
    INDEX idx_business_id (business_id),
    INDEX idx_business_no (business_no),
    INDEX idx_business_type (business_type),
    INDEX idx_flow_status (flow_status),
    INDEX idx_node_status (node_status),
    INDEX idx_executor_id (executor_id),
    INDEX idx_start_time (start_time)
) COMMENT '业务流程日志表';

-- 安全审计日志表（按月分表：t_security_audit_202401, t_security_audit_202402...）
CREATE TABLE t_security_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '审计ID',
    audit_id VARCHAR(64) NOT NULL COMMENT '审计唯一标识',
    
    -- 安全事件信息
    event_type VARCHAR(50) NOT NULL COMMENT '事件类型',
    event_level TINYINT NOT NULL COMMENT '事件级别：1-严重，2-高，3-中，4-低',
    event_category VARCHAR(50) COMMENT '事件分类',
    event_description TEXT COMMENT '事件描述',
    
    -- 用户信息
    user_id BIGINT COMMENT '用户ID',
    username VARCHAR(100) COMMENT '用户名',
    user_type TINYINT COMMENT '用户类型',
    org_id BIGINT COMMENT '机构ID',
    
    -- 访问信息
    source_ip VARCHAR(50) COMMENT '来源IP',
    target_ip VARCHAR(50) COMMENT '目标IP',
    user_agent TEXT COMMENT '用户代理',
    session_id VARCHAR(64) COMMENT '会话ID',
    
    -- 操作信息
    operation VARCHAR(200) COMMENT '操作行为',
    resource VARCHAR(500) COMMENT '访问资源',
    resource_type VARCHAR(50) COMMENT '资源类型',
    
    -- 结果信息
    result TINYINT NOT NULL COMMENT '结果：1-成功，0-失败，2-阻止',
    risk_score INT DEFAULT 0 COMMENT '风险评分（0-100）',
    
    -- 威胁信息
    threat_type VARCHAR(50) COMMENT '威胁类型',
    attack_signature VARCHAR(500) COMMENT '攻击特征',
    is_blocked TINYINT DEFAULT 0 COMMENT '是否被阻止：1-是，0-否',
    
    -- 响应信息
    response_action VARCHAR(100) COMMENT '响应动作',
    alert_sent TINYINT DEFAULT 0 COMMENT '是否发送告警：1-是，0-否',
    
    -- 地理位置
    country VARCHAR(100) COMMENT '国家',
    region VARCHAR(100) COMMENT '地区',
    city VARCHAR(100) COMMENT '城市',
    
    -- 设备信息
    device_id VARCHAR(100) COMMENT '设备ID',
    device_type VARCHAR(50) COMMENT '设备类型',
    fingerprint VARCHAR(200) COMMENT '设备指纹',
    
    -- 时间戳
    event_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '事件时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_audit_id (audit_id),
    INDEX idx_event_type (event_type),
    INDEX idx_event_level (event_level),
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_source_ip (source_ip),
    INDEX idx_result (result),
    INDEX idx_risk_score (risk_score),
    INDEX idx_threat_type (threat_type),
    INDEX idx_is_blocked (is_blocked),
    INDEX idx_event_time (event_time)
) COMMENT '安全审计日志表';

-- 数据变更审计表
CREATE TABLE t_data_change_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '审计ID',
    change_id VARCHAR(64) NOT NULL COMMENT '变更唯一标识',
    
    -- 变更对象信息
    table_name VARCHAR(100) NOT NULL COMMENT '表名',
    record_id BIGINT NOT NULL COMMENT '记录ID',
    primary_key_value VARCHAR(200) COMMENT '主键值',
    
    -- 变更类型
    change_type TINYINT NOT NULL COMMENT '变更类型：1-插入，2-更新，3-删除',
    change_description VARCHAR(500) COMMENT '变更描述',
    
    -- 变更内容
    before_data TEXT COMMENT '变更前数据（JSON格式）',
    after_data TEXT COMMENT '变更后数据（JSON格式）',
    changed_fields TEXT COMMENT '变更字段列表（JSON格式）',
    
    -- 业务信息
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id BIGINT COMMENT '业务ID',
    business_context TEXT COMMENT '业务上下文',
    
    -- 操作信息
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    operation_type VARCHAR(50) COMMENT '操作类型',
    client_ip VARCHAR(50) COMMENT '客户端IP',
    
    -- 系统信息
    service_name VARCHAR(100) COMMENT '服务名称',
    method_name VARCHAR(200) COMMENT '方法名称',
    request_id VARCHAR(64) COMMENT '请求ID',
    
    -- 敏感数据标识
    is_sensitive TINYINT DEFAULT 0 COMMENT '是否敏感数据：1-是，0-否',
    sensitive_fields TEXT COMMENT '敏感字段列表',
    data_classification TINYINT COMMENT '数据分类：1-公开，2-内部，3-机密，4-绝密',
    
    -- 时间戳
    change_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_change_id (change_id),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_change_type (change_type),
    INDEX idx_business_type (business_type),
    INDEX idx_business_id (business_id),
    INDEX idx_operator_id (operator_id),
    INDEX idx_is_sensitive (is_sensitive),
    INDEX idx_change_time (change_time)
) COMMENT '数据变更审计表';

-- 日志清理配置表
CREATE TABLE t_log_cleanup_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    table_name VARCHAR(100) NOT NULL UNIQUE COMMENT '表名',
    retention_days INT NOT NULL COMMENT '保留天数',
    cleanup_enabled TINYINT DEFAULT 1 COMMENT '是否启用清理：1-启用，0-禁用',
    cleanup_hour TINYINT DEFAULT 2 COMMENT '清理时间（小时，0-23）',
    batch_size INT DEFAULT 10000 COMMENT '批次大小',
    archive_enabled TINYINT DEFAULT 0 COMMENT '是否启用归档：1-启用，0-禁用',
    archive_path VARCHAR(500) COMMENT '归档路径',
    last_cleanup_time DATETIME COMMENT '最后清理时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_cleanup_enabled (cleanup_enabled),
    INDEX idx_last_cleanup_time (last_cleanup_time)
) COMMENT '日志清理配置表';