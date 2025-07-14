#!/bin/bash

# DLMP Backend 监控脚本
# 用于生产环境的应用和系统监控

set -e

# 配置变量
APP_NAME="dlmp-backend"
PID_FILE=${PID_FILE:-/var/run/dlmp.pid}
LOG_DIR=${LOG_DIR:-/var/log/dlmp}
MONITOR_LOG="$LOG_DIR/monitor.log"
ALERT_LOG="$LOG_DIR/alert.log"
METRICS_LOG="$LOG_DIR/metrics.log"

# 阈值配置
CPU_THRESHOLD=${CPU_THRESHOLD:-80}           # CPU使用率阈值 (%)
MEMORY_THRESHOLD=${MEMORY_THRESHOLD:-85}     # 内存使用率阈值 (%)
DISK_THRESHOLD=${DISK_THRESHOLD:-85}         # 磁盘使用率阈值 (%)
HEAP_THRESHOLD=${HEAP_THRESHOLD:-80}         # JVM堆内存使用率阈值 (%)
GC_TIME_THRESHOLD=${GC_TIME_THRESHOLD:-1000} # GC时间阈值 (ms)
RESPONSE_TIME_THRESHOLD=${RESPONSE_TIME_THRESHOLD:-3000} # 响应时间阈值 (ms)

# 通知配置
ALERT_EMAIL=${ALERT_EMAIL:-"admin@dlmp.com"}
WEBHOOK_URL=${WEBHOOK_URL:-""}

# 日志函数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" | tee -a "$MONITOR_LOG"
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" | tee -a "$MONITOR_LOG" | tee -a "$ALERT_LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" | tee -a "$MONITOR_LOG" | tee -a "$ALERT_LOG"
}

log_metric() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$METRICS_LOG"
}

# 创建监控目录
create_directories() {
    mkdir -p "$(dirname $MONITOR_LOG)"
    mkdir -p "$(dirname $ALERT_LOG)"
    mkdir -p "$(dirname $METRICS_LOG)"
}

# 检查应用是否运行
check_app_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo "running"
            return 0
        else
            echo "stopped"
            return 1
        fi
    else
        echo "stopped"
        return 1
    fi
}

# 监控应用状态
monitor_app_status() {
    local status=$(check_app_status)
    
    if [ "$status" = "running" ]; then
        log_metric "app_status:1"
        return 0
    else
        log_error "应用未运行"
        log_metric "app_status:0"
        send_alert "应用状态异常" "DLMP应用未运行，请立即检查"
        return 1
    fi
}

# 监控系统资源
monitor_system_resources() {
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        log_warn "CPU使用率过高: ${cpu_usage}% > ${CPU_THRESHOLD}%"
        send_alert "CPU使用率过高" "当前CPU使用率: ${cpu_usage}%"
    fi
    log_metric "cpu_usage:${cpu_usage}"
    
    # 内存使用率
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used_memory * 100 / $total_memory" | bc)
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        log_warn "内存使用率过高: ${memory_usage}% > ${MEMORY_THRESHOLD}%"
        send_alert "内存使用率过高" "当前内存使用率: ${memory_usage}%"
    fi
    log_metric "memory_usage:${memory_usage}"
    
    # 磁盘使用率
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        log_warn "磁盘使用率过高: ${disk_usage}% > ${DISK_THRESHOLD}%"
        send_alert "磁盘使用率过高" "当前磁盘使用率: ${disk_usage}%"
    fi
    log_metric "disk_usage:${disk_usage}"
    
    # 负载平均值
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "scale=2; $load_avg * 100 / $cpu_cores" | bc)
    
    if (( $(echo "$load_percentage > 100" | bc -l) )); then
        log_warn "系统负载过高: ${load_avg} (${load_percentage}%)"
        send_alert "系统负载过高" "当前系统负载: ${load_avg}"
    fi
    log_metric "load_avg:${load_avg}"
}

# 监控JVM性能
monitor_jvm_performance() {
    if [ ! -f "$PID_FILE" ]; then
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    
    if ! ps -p $pid > /dev/null 2>&1; then
        return 1
    fi
    
    # JVM堆内存使用情况
    local jstat_output=$(jstat -gc $pid | tail -1)
    if [ -n "$jstat_output" ]; then
        local heap_used=$(echo $jstat_output | awk '{print ($3 + $4 + $6 + $8)}')
        local heap_total=$(echo $jstat_output | awk '{print ($1 + $2 + $5 + $7)}')
        
        if [ "$heap_total" != "0" ]; then
            local heap_usage=$(echo "scale=2; $heap_used * 100 / $heap_total" | bc)
            
            if (( $(echo "$heap_usage > $HEAP_THRESHOLD" | bc -l) )); then
                log_warn "JVM堆内存使用率过高: ${heap_usage}% > ${HEAP_THRESHOLD}%"
                send_alert "JVM堆内存使用率过高" "当前堆内存使用率: ${heap_usage}%"
            fi
            log_metric "jvm_heap_usage:${heap_usage}"
        fi
    fi
    
    # GC性能监控
    local gc_output=$(jstat -gcutil $pid | tail -1)
    if [ -n "$gc_output" ]; then
        local young_gc_count=$(echo $gc_output | awk '{print $5}')
        local young_gc_time=$(echo $gc_output | awk '{print $6}')
        local old_gc_count=$(echo $gc_output | awk '{print $7}')
        local old_gc_time=$(echo $gc_output | awk '{print $8}')
        
        # 计算平均GC时间
        if [ "$young_gc_count" != "0" ]; then
            local avg_young_gc=$(echo "scale=2; $young_gc_time * 1000 / $young_gc_count" | bc)
            if (( $(echo "$avg_young_gc > $GC_TIME_THRESHOLD" | bc -l) )); then
                log_warn "Young GC平均时间过长: ${avg_young_gc}ms > ${GC_TIME_THRESHOLD}ms"
            fi
            log_metric "young_gc_avg_time:${avg_young_gc}"
        fi
        
        if [ "$old_gc_count" != "0" ]; then
            local avg_old_gc=$(echo "scale=2; $old_gc_time * 1000 / $old_gc_count" | bc)
            if (( $(echo "$avg_old_gc > $GC_TIME_THRESHOLD" | bc -l) )); then
                log_warn "Old GC平均时间过长: ${avg_old_gc}ms > ${GC_TIME_THRESHOLD}ms"
            fi
            log_metric "old_gc_avg_time:${avg_old_gc}"
        fi
        
        log_metric "young_gc_count:${young_gc_count}"
        log_metric "old_gc_count:${old_gc_count}"
    fi
    
    # 线程数监控
    local thread_count=$(ps -o nlwp -p $pid | tail -1 | tr -d ' ')
    log_metric "thread_count:${thread_count}"
    
    if [ "$thread_count" -gt 1000 ]; then
        log_warn "线程数过多: ${thread_count} > 1000"
        send_alert "线程数过多" "当前线程数: ${thread_count}"
    fi
}

# 监控应用健康状态
monitor_app_health() {
    local port=${SERVER_PORT:-8080}
    local health_url="http://localhost:${port}/actuator/health"
    
    # 检查健康端点
    local health_response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "$health_url" || echo "000:0")
    local http_code=$(echo $health_response | cut -d':' -f1)
    local response_time=$(echo $health_response | cut -d':' -f2)
    local response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    
    if [ "$http_code" = "200" ]; then
        log_metric "health_check:1"
        log_metric "response_time:${response_time_ms}"
        
        # 检查响应时间
        if [ "$response_time_ms" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
            log_warn "健康检查响应时间过长: ${response_time_ms}ms > ${RESPONSE_TIME_THRESHOLD}ms"
            send_alert "响应时间过长" "健康检查响应时间: ${response_time_ms}ms"
        fi
    else
        log_error "健康检查失败: HTTP $http_code"
        log_metric "health_check:0"
        send_alert "健康检查失败" "HTTP状态码: $http_code"
    fi
}

# 监控数据库连接
monitor_database() {
    local db_host=${DB_HOST:-"localhost"}
    local db_port=${DB_PORT:-3306}
    local db_user=${DB_USERNAME:-"dlmp"}
    local db_pass=${DB_PASSWORD:-"dlmp123456"}
    
    # 检查数据库连接
    if command -v mysql &> /dev/null; then
        if mysql -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_pass" -e "SELECT 1" &> /dev/null; then
            log_metric "database_connection:1"
        else
            log_error "数据库连接失败"
            log_metric "database_connection:0"
            send_alert "数据库连接异常" "无法连接到数据库服务器"
        fi
    fi
}

# 监控Redis连接
monitor_redis() {
    local redis_host=${REDIS_HOST:-"localhost"}
    local redis_port=${REDIS_PORT:-6379}
    
    # 检查Redis连接
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$redis_host" -p "$redis_port" ping &> /dev/null; then
            log_metric "redis_connection:1"
        else
            log_error "Redis连接失败"
            log_metric "redis_connection:0"
            send_alert "Redis连接异常" "无法连接到Redis服务器"
        fi
    fi
}

# 发送告警
send_alert() {
    local title="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log_error "告警: $title - $message"
    
    # 邮件告警
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "时间: $timestamp
标题: $title
内容: $message
主机: $(hostname)
应用: $APP_NAME" | mail -s "DLMP告警: $title" "$ALERT_EMAIL"
    fi
    
    # Webhook告警
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"title\":\"$title\",\"message\":\"$message\",\"timestamp\":\"$timestamp\",\"hostname\":\"$(hostname)\",\"application\":\"$APP_NAME\"}" \
             &> /dev/null || true
    fi
}

# 生成监控报告
generate_report() {
    local report_file="$LOG_DIR/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "DLMP Backend 监控报告"
        echo "======================"
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "主机名: $(hostname)"
        echo ""
        
        echo "应用状态:"
        echo "--------"
        local status=$(check_app_status)
        echo "状态: $status"
        if [ "$status" = "running" ]; then
            local pid=$(cat "$PID_FILE")
            echo "PID: $pid"
            echo "运行时间: $(ps -o etime= -p $pid | tr -d ' ')"
        fi
        echo ""
        
        echo "系统资源:"
        echo "--------"
        echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "内存使用率: $(free | awk 'NR==2{printf "%.2f%%", $3*100/$2}')"
        echo "磁盘使用率: $(df / | tail -1 | awk '{print $5}')"
        echo "系统负载: $(uptime | awk -F'load average:' '{print $2}')"
        echo ""
        
        echo "最近告警 (最近10条):"
        echo "-------------------"
        if [ -f "$ALERT_LOG" ]; then
            tail -10 "$ALERT_LOG"
        else
            echo "无告警记录"
        fi
        
    } > "$report_file"
    
    log_info "监控报告已生成: $report_file"
}

# 清理旧日志
cleanup_logs() {
    # 清理30天前的监控日志
    find "$LOG_DIR" -name "monitor_report_*.txt" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # 清理大于100MB的日志文件
    find "$LOG_DIR" -name "*.log" -size +100M -exec truncate -s 0 {} \; 2>/dev/null || true
    
    log_info "日志清理完成"
}

# 主监控函数
main_monitor() {
    create_directories
    
    log_info "开始监控检查..."
    
    # 监控各项指标
    monitor_app_status
    monitor_system_resources
    monitor_jvm_performance
    monitor_app_health
    monitor_database
    monitor_redis
    
    log_info "监控检查完成"
}

# 主函数
main() {
    case "$1" in
        start)
            log_info "启动持续监控..."
            while true; do
                main_monitor
                sleep 60  # 每分钟执行一次
            done
            ;;
        check)
            main_monitor
            ;;
        report)
            generate_report
            ;;
        cleanup)
            cleanup_logs
            ;;
        alert-test)
            send_alert "测试告警" "这是一条测试告警消息"
            ;;
        *)
            echo "用法: $0 {start|check|report|cleanup|alert-test}"
            echo ""
            echo "命令说明:"
            echo "  start      - 启动持续监控"
            echo "  check      - 执行一次监控检查"
            echo "  report     - 生成监控报告"
            echo "  cleanup    - 清理旧日志文件"
            echo "  alert-test - 测试告警功能"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"