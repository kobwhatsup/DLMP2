#!/bin/bash

# 负载均衡器健康检查脚本
# 用于监控Nginx和HAProxy的运行状态

set -e

# 配置变量
NGINX_URL="http://localhost/health"
HAPROXY_URL="http://localhost:8404/stats"
UPSTREAM_SERVERS=(
    "http://dlmp-backend-1:8080/actuator/health"
    "http://dlmp-backend-2:8080/actuator/health"
    "http://dlmp-backend-3:8080/actuator/health"
    "http://dlmp-frontend-1:3000/health"
    "http://dlmp-frontend-2:3000/health"
)

LOG_FILE="/var/log/nginx/health-check.log"
ALERT_WEBHOOK=${ALERT_WEBHOOK:-""}
EMAIL_RECIPIENTS=${EMAIL_RECIPIENTS:-"admin@dlmp.com"}

# 日志函数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" | tee -a "$LOG_FILE"
}

# 检查服务状态
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout="${3:-10}"
    
    log_info "检查服务: $service_name ($url)"
    
    # 使用curl检查服务状态
    local response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}:%{time_connect}" \
                          --max-time "$timeout" \
                          --connect-timeout 5 \
                          "$url" 2>/dev/null || echo "000:0:0")
    
    local http_code=$(echo "$response" | cut -d: -f1)
    local total_time=$(echo "$response" | cut -d: -f2)
    local connect_time=$(echo "$response" | cut -d: -f3)
    
    if [ "$http_code" = "200" ]; then
        log_info "服务正常: $service_name (响应时间: ${total_time}s)"
        return 0
    else
        log_error "服务异常: $service_name (HTTP: $http_code, 连接时间: ${connect_time}s)"
        return 1
    fi
}

# 检查Nginx状态
check_nginx() {
    log_info "开始检查Nginx状态..."
    
    # 检查Nginx进程
    if ! pgrep nginx > /dev/null; then
        log_error "Nginx进程未运行"
        return 1
    fi
    
    # 检查Nginx配置
    if ! nginx -t > /dev/null 2>&1; then
        log_error "Nginx配置错误"
        return 1
    fi
    
    # 检查健康端点
    if check_service "Nginx" "$NGINX_URL"; then
        log_info "Nginx状态检查通过"
        return 0
    else
        log_error "Nginx健康检查失败"
        return 1
    fi
}

# 检查HAProxy状态
check_haproxy() {
    log_info "开始检查HAProxy状态..."
    
    # 检查HAProxy进程
    if ! pgrep haproxy > /dev/null; then
        log_warn "HAProxy进程未运行（可能未启用）"
        return 0
    fi
    
    # 检查HAProxy统计页面
    if check_service "HAProxy" "$HAPROXY_URL"; then
        log_info "HAProxy状态检查通过"
        return 0
    else
        log_error "HAProxy健康检查失败"
        return 1
    fi
}

# 检查上游服务器
check_upstream_servers() {
    log_info "开始检查上游服务器..."
    
    local failed_count=0
    local total_count=${#UPSTREAM_SERVERS[@]}
    
    for server in "${UPSTREAM_SERVERS[@]}"; do
        if ! check_service "Upstream" "$server" 15; then
            failed_count=$((failed_count + 1))
        fi
    done
    
    local success_rate=$(echo "scale=2; ($total_count - $failed_count) * 100 / $total_count" | bc)
    
    log_info "上游服务器检查完成: 成功率 ${success_rate}% ($((total_count - failed_count))/$total_count)"
    
    if [ "$failed_count" -gt $((total_count / 2)) ]; then
        log_error "超过一半的上游服务器异常"
        return 1
    elif [ "$failed_count" -gt 0 ]; then
        log_warn "部分上游服务器异常: $failed_count/$total_count"
        return 2
    else
        log_info "所有上游服务器正常"
        return 0
    fi
}

# 检查SSL证书
check_ssl_certificates() {
    log_info "开始检查SSL证书..."
    
    local cert_files=(
        "/etc/nginx/ssl/dlmp.crt"
        "/etc/nginx/ssl/dlmp.key"
    )
    
    for cert_file in "${cert_files[@]}"; do
        if [ ! -f "$cert_file" ]; then
            log_warn "证书文件不存在: $cert_file"
            continue
        fi
        
        if [[ "$cert_file" == *.crt ]]; then
            # 检查证书有效期
            local expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d= -f2)
            if [ -n "$expiry_date" ]; then
                local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_epoch=$(date +%s)
                local days_remaining=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [ "$days_remaining" -lt 30 ]; then
                    log_warn "SSL证书即将过期: $cert_file (剩余 ${days_remaining} 天)"
                elif [ "$days_remaining" -lt 7 ]; then
                    log_error "SSL证书即将过期: $cert_file (剩余 ${days_remaining} 天)"
                else
                    log_info "SSL证书有效: $cert_file (剩余 ${days_remaining} 天)"
                fi
            fi
        fi
    done
}

# 检查网络连接
check_network_connectivity() {
    log_info "开始检查网络连接..."
    
    # 检查DNS解析
    if nslookup google.com > /dev/null 2>&1; then
        log_info "DNS解析正常"
    else
        log_warn "DNS解析异常"
    fi
    
    # 检查外网连接
    if curl -s --max-time 10 http://www.google.com > /dev/null; then
        log_info "外网连接正常"
    else
        log_warn "外网连接异常"
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "开始检查系统资源..."
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    log_info "CPU使用率: ${cpu_usage}%"
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_warn "CPU使用率过高: ${cpu_usage}%"
    fi
    
    # 内存使用率
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    log_info "内存使用率: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        log_warn "内存使用率过高: ${memory_usage}%"
    fi
    
    # 磁盘使用率
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    log_info "磁盘使用率: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 85 ]; then
        log_warn "磁盘使用率过高: ${disk_usage}%"
    fi
    
    # 负载平均值
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    log_info "系统负载: $load_avg"
}

# 发送告警
send_alert() {
    local subject="$1"
    local message="$2"
    local severity="${3:-warning}"
    
    log_info "发送告警: $subject"
    
    # 构建告警消息
    local alert_message="时间: $(date '+%Y-%m-%d %H:%M:%S')
主机: $(hostname)
严重程度: $severity
主题: $subject
详情: $message"
    
    # 发送邮件告警
    if command -v mail >/dev/null 2>&1 && [ -n "$EMAIL_RECIPIENTS" ]; then
        echo "$alert_message" | mail -s "DLMP负载均衡器告警: $subject" "$EMAIL_RECIPIENTS"
        log_info "邮件告警已发送"
    fi
    
    # 发送Webhook告警
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
             -H "Content-Type: application/json" \
             -d "{\"subject\":\"$subject\",\"message\":\"$message\",\"severity\":\"$severity\",\"timestamp\":\"$(date -Iseconds)\",\"hostname\":\"$(hostname)\"}" \
             >/dev/null 2>&1
        log_info "Webhook告警已发送"
    fi
}

# 自动修复
auto_repair() {
    local service="$1"
    
    log_info "尝试自动修复: $service"
    
    case "$service" in
        "nginx")
            # 重启Nginx
            if nginx -s reload; then
                log_info "Nginx重载成功"
                return 0
            else
                log_error "Nginx重载失败，尝试重启"
                if systemctl restart nginx; then
                    log_info "Nginx重启成功"
                    return 0
                else
                    log_error "Nginx重启失败"
                    return 1
                fi
            fi
            ;;
        "haproxy")
            # 重启HAProxy
            if systemctl restart haproxy; then
                log_info "HAProxy重启成功"
                return 0
            else
                log_error "HAProxy重启失败"
                return 1
            fi
            ;;
        *)
            log_warn "不支持的自动修复服务: $service"
            return 1
            ;;
    esac
}

# 生成健康报告
generate_health_report() {
    local report_file="/var/log/nginx/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "DLMP负载均衡器健康报告"
        echo "========================="
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "主机名: $(hostname)"
        echo ""
        
        echo "服务状态:"
        echo "---------"
        check_nginx && echo "Nginx: 正常" || echo "Nginx: 异常"
        check_haproxy && echo "HAProxy: 正常" || echo "HAProxy: 异常"
        
        echo ""
        echo "上游服务器状态:"
        echo "---------------"
        check_upstream_servers
        
        echo ""
        echo "系统资源:"
        echo "---------"
        check_system_resources
        
        echo ""
        echo "证书状态:"
        echo "---------"
        check_ssl_certificates
        
    } > "$report_file"
    
    log_info "健康报告已生成: $report_file"
}

# 主函数
main() {
    case "${1:-check}" in
        "check")
            log_info "开始健康检查..."
            
            local failed_checks=0
            
            # 检查各项服务
            check_nginx || failed_checks=$((failed_checks + 1))
            check_haproxy || true  # HAProxy可选
            
            local upstream_status
            check_upstream_servers
            upstream_status=$?
            
            if [ $upstream_status -eq 1 ]; then
                failed_checks=$((failed_checks + 1))
                send_alert "上游服务器异常" "超过一半的上游服务器无法访问" "critical"
            elif [ $upstream_status -eq 2 ]; then
                send_alert "部分上游服务器异常" "部分上游服务器无法访问" "warning"
            fi
            
            check_ssl_certificates
            check_network_connectivity
            check_system_resources
            
            if [ $failed_checks -eq 0 ]; then
                log_info "所有健康检查通过"
                exit 0
            else
                log_error "健康检查失败，失败项目数: $failed_checks"
                exit 1
            fi
            ;;
        "repair")
            log_info "开始自动修复..."
            auto_repair "${2:-nginx}"
            ;;
        "report")
            generate_health_report
            ;;
        "monitor")
            log_info "启动持续监控..."
            while true; do
                main check
                sleep 60
            done
            ;;
        *)
            echo "用法: $0 {check|repair|report|monitor}"
            echo ""
            echo "命令说明:"
            echo "  check   - 执行健康检查"
            echo "  repair  - 自动修复服务"
            echo "  report  - 生成健康报告"
            echo "  monitor - 持续监控"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"