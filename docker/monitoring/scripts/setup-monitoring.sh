#!/bin/bash

# DLMP监控系统部署脚本
# 一键部署完整的监控和日志系统

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$MONITORING_DIR")")"

LOG_FILE="/tmp/dlmp-monitoring-setup.log"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin123456}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@dlmp.example.com}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    local missing_deps=()
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    # 检查jq
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重新运行脚本"
        exit 1
    fi
    
    log_info "所有依赖检查通过"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    local required_ports=(
        "3001:Grafana"
        "9090:Prometheus" 
        "9093:AlertManager"
        "5601:Kibana"
        "9200:Elasticsearch"
        "5044:Logstash"
        "16686:Jaeger"
        "9100:Node Exporter"
        "8080:cAdvisor"
    )
    
    local port_conflicts=()
    
    for port_info in "${required_ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local service=$(echo "$port_info" | cut -d: -f2)
        
        if netstat -tuln 2>/dev/null | grep ":$port " >/dev/null || \
           ss -tuln 2>/dev/null | grep ":$port " >/dev/null; then
            port_conflicts+=("$port ($service)")
        fi
    done
    
    if [ ${#port_conflicts[@]} -ne 0 ]; then
        log_warn "以下端口已被占用: ${port_conflicts[*]}"
        log_warn "请确保这些端口可用或修改docker-compose.yml中的端口映射"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_info "所有需要的端口都可用"
    fi
}

# 创建必要的目录和文件
create_directories() {
    log_info "创建监控系统目录结构..."
    
    local directories=(
        "$MONITORING_DIR/prometheus/rules"
        "$MONITORING_DIR/grafana/provisioning/dashboards"
        "$MONITORING_DIR/grafana/provisioning/datasources"
        "$MONITORING_DIR/grafana/dashboards"
        "$MONITORING_DIR/alertmanager/templates"
        "$MONITORING_DIR/elasticsearch"
        "$MONITORING_DIR/kibana"
        "$MONITORING_DIR/logstash/config"
        "$MONITORING_DIR/logstash/templates"
        "$MONITORING_DIR/filebeat"
        "$MONITORING_DIR/loki"
        "$MONITORING_DIR/promtail"
        "$MONITORING_DIR/blackbox"
        "$MONITORING_DIR/data/prometheus"
        "$MONITORING_DIR/data/grafana"
        "$MONITORING_DIR/data/elasticsearch"
        "$MONITORING_DIR/data/alertmanager"
        "$MONITORING_DIR/logs"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_debug "创建目录: $dir"
    done
    
    # 设置适当的权限
    chmod -R 755 "$MONITORING_DIR"
    
    # Elasticsearch需要特殊权限
    chmod 777 "$MONITORING_DIR/data/elasticsearch"
    
    log_info "目录结构创建完成"
}

# 生成配置文件
generate_configs() {
    log_info "生成配置文件..."
    
    # 生成Grafana仪表板配置
    cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboards.yml" << EOF
apiVersion: 1

providers:
  - name: 'DLMP Dashboards'
    orgId: 1
    folder: 'DLMP'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # 生成Loki配置
    cat > "$MONITORING_DIR/loki/loki.yml" << EOF
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
EOF

    # 生成Promtail配置
    cat > "$MONITORING_DIR/promtail/promtail.yml" << EOF
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: container-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          expressions:
            tag: attrs.tag
          source: attrs
      - regex:
          expression: '^(?P<container_name>(?:[^/]+/){2}(?P<container_name_short>[^-]+))'
          source: tag
      - timestamp:
          format: RFC3339Nano
          source: time
      - labels:
          stream:
          container_name:
          container_name_short:
      - output:
          source: output
EOF

    # 生成BlackBox配置
    cat > "$MONITORING_DIR/blackbox/blackbox.yml" << EOF
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2"]
      valid_status_codes: []
      method: GET
      preferred_ip_protocol: "ip4"
      
  http_post_2xx:
    prober: http
    timeout: 5s
    http:
      method: POST
      headers:
        Content-Type: application/json
        
  tcp_connect:
    prober: tcp
    timeout: 5s
    
  icmp:
    prober: icmp
    timeout: 5s
    icmp:
      preferred_ip_protocol: "ip4"
EOF

    log_info "配置文件生成完成"
}

# 设置系统参数
setup_system() {
    log_info "配置系统参数..."
    
    # 增加文件描述符限制
    echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # 增加内存映射限制 (Elasticsearch需要)
    echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # 创建监控用户和组
    if ! getent group monitoring >/dev/null; then
        sudo groupadd monitoring
    fi
    
    if ! getent passwd monitoring >/dev/null; then
        sudo useradd -r -g monitoring -s /bin/false monitoring
    fi
    
    log_info "系统参数配置完成"
}

# 启动监控服务
start_services() {
    log_info "启动监控服务..."
    
    cd "$MONITORING_DIR"
    
    # 启动核心服务
    log_info "启动Prometheus和Grafana..."
    docker-compose up -d prometheus grafana postgres
    
    # 等待服务启动
    sleep 30
    
    # 启动日志服务
    log_info "启动Elasticsearch和Kibana..."
    docker-compose up -d elasticsearch
    sleep 60  # Elasticsearch需要更长时间启动
    
    docker-compose up -d kibana logstash
    sleep 30
    
    # 启动其他监控服务
    log_info "启动其他监控服务..."
    docker-compose up -d alertmanager jaeger loki promtail
    docker-compose up -d node-exporter cadvisor blackbox-exporter
    
    # 启动日志收集
    log_info "启动日志收集服务..."
    docker-compose up -d filebeat
    
    log_info "所有服务启动完成"
}

# 验证服务状态
verify_services() {
    log_info "验证服务状态..."
    
    local services=(
        "prometheus:9090:/api/v1/status/config"
        "grafana:3001:/api/health"
        "alertmanager:9093:/-/healthy"
        "elasticsearch:9200:/_cluster/health"
        "kibana:5601:/api/status"
        "jaeger:16686:/"
        "loki:3100:/ready"
    )
    
    local failed_services=()
    
    for service_info in "${services[@]}"; do
        local service=$(echo "$service_info" | cut -d: -f1)
        local port=$(echo "$service_info" | cut -d: -f2)
        local path=$(echo "$service_info" | cut -d: -f3)
        local url="http://localhost:$port$path"
        
        log_debug "检查服务: $service ($url)"
        
        local retry_count=0
        local max_retries=12  # 2分钟超时
        
        while [ $retry_count -lt $max_retries ]; do
            if curl -s -f "$url" >/dev/null 2>&1; then
                log_info "✓ $service 服务正常"
                break
            fi
            
            retry_count=$((retry_count + 1))
            if [ $retry_count -eq $max_retries ]; then
                failed_services+=("$service")
                log_error "✗ $service 服务启动失败或无响应"
            else
                sleep 10
            fi
        done
    done
    
    if [ ${#failed_services[@]} -ne 0 ]; then
        log_error "以下服务启动失败: ${failed_services[*]}"
        log_info "请检查Docker日志: docker-compose logs <service_name>"
        return 1
    fi
    
    log_info "所有服务验证通过"
    return 0
}

# 配置Grafana
setup_grafana() {
    log_info "配置Grafana..."
    
    # 等待Grafana完全启动
    local grafana_url="http://localhost:3001"
    local retry_count=0
    
    while [ $retry_count -lt 30 ]; do
        if curl -s "$grafana_url/api/health" >/dev/null 2>&1; then
            break
        fi
        sleep 5
        retry_count=$((retry_count + 1))
    done
    
    # 创建API密钥
    local api_key_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"name":"setup-key","role":"Admin"}' \
        "http://admin:$GRAFANA_ADMIN_PASSWORD@localhost:3001/api/auth/keys")
    
    if echo "$api_key_response" | jq -e '.key' >/dev/null 2>&1; then
        local api_key=$(echo "$api_key_response" | jq -r '.key')
        log_info "Grafana API密钥创建成功"
        
        # 导入仪表板
        import_grafana_dashboards "$api_key"
    else
        log_warn "无法创建Grafana API密钥，请手动配置仪表板"
    fi
}

# 导入Grafana仪表板
import_grafana_dashboards() {
    local api_key="$1"
    
    log_info "导入Grafana仪表板..."
    
    # 下载并导入常用仪表板
    local dashboards=(
        "1860:Node Exporter Full"
        "893:Docker and System Monitoring"
        "11159:Spring Boot 2.1 System Monitor"
        "4701:JVM Micrometer"
        "7249:MySQL Overview"
        "763:Redis Dashboard"
        "9628:PostgreSQL Database"
        "7642:Nginx Ingress Controller"
    )
    
    for dashboard_info in "${dashboards[@]}"; do
        local dashboard_id=$(echo "$dashboard_info" | cut -d: -f1)
        local dashboard_name=$(echo "$dashboard_info" | cut -d: -f2)
        
        log_debug "导入仪表板: $dashboard_name (ID: $dashboard_id)"
        
        # 从Grafana.com下载仪表板
        local dashboard_json=$(curl -s "https://grafana.com/api/dashboards/$dashboard_id/revisions/latest/download")
        
        if [ -n "$dashboard_json" ] && echo "$dashboard_json" | jq -e '.' >/dev/null 2>&1; then
            # 导入仪表板
            local import_payload=$(echo "$dashboard_json" | jq '{dashboard: ., overwrite: true, inputs: []}')
            
            curl -s -X POST \
                -H "Authorization: Bearer $api_key" \
                -H "Content-Type: application/json" \
                -d "$import_payload" \
                "http://localhost:3001/api/dashboards/import" >/dev/null
                
            log_info "✓ 导入仪表板: $dashboard_name"
        else
            log_warn "✗ 无法下载仪表板: $dashboard_name"
        fi
    done
}

# 配置告警
setup_alerting() {
    log_info "配置告警规则..."
    
    # 验证Prometheus规则
    if docker-compose exec -T prometheus promtool check rules /etc/prometheus/rules/*.yml; then
        log_info "Prometheus告警规则验证通过"
    else
        log_warn "Prometheus告警规则验证失败，请检查规则文件"
    fi
    
    # 重载Prometheus配置
    curl -s -X POST "http://localhost:9090/-/reload" >/dev/null
    log_info "Prometheus配置已重载"
    
    # 验证AlertManager配置
    if docker-compose exec -T alertmanager amtool check-config /etc/alertmanager/alertmanager.yml; then
        log_info "AlertManager配置验证通过"
    else
        log_warn "AlertManager配置验证失败，请检查配置文件"
    fi
}

# 显示访问信息
show_access_info() {
    log_info "部署完成！访问信息如下："
    
    echo ""
    echo "==================== 监控服务访问地址 ===================="
    echo -e "${GREEN}Grafana (监控仪表板):${NC}     http://localhost:3001"
    echo -e "  用户名: admin"
    echo -e "  密码: $GRAFANA_ADMIN_PASSWORD"
    echo ""
    echo -e "${GREEN}Prometheus (指标收集):${NC}    http://localhost:9090"
    echo -e "${GREEN}AlertManager (告警管理):${NC}  http://localhost:9093"
    echo ""
    echo "==================== 日志服务访问地址 ===================="
    echo -e "${GREEN}Kibana (日志分析):${NC}        http://localhost:5601"
    echo -e "${GREEN}Elasticsearch (日志存储):${NC} http://localhost:9200"
    echo ""
    echo "==================== 链路追踪服务 ===================="
    echo -e "${GREEN}Jaeger (链路追踪):${NC}        http://localhost:16686"
    echo ""
    echo "==================== 系统监控 ===================="
    echo -e "${GREEN}Node Exporter (系统指标):${NC} http://localhost:9100"
    echo -e "${GREEN}cAdvisor (容器指标):${NC}      http://localhost:8080"
    echo ""
    echo "==================== 管理命令 ===================="
    echo -e "${YELLOW}查看服务状态:${NC}    cd $MONITORING_DIR && docker-compose ps"
    echo -e "${YELLOW}查看服务日志:${NC}    cd $MONITORING_DIR && docker-compose logs <service>"
    echo -e "${YELLOW}重启服务:${NC}        cd $MONITORING_DIR && docker-compose restart <service>"
    echo -e "${YELLOW}停止所有服务:${NC}    cd $MONITORING_DIR && docker-compose down"
    echo ""
}

# 主函数
main() {
    log_info "开始部署DLMP监控系统..."
    log_info "日志文件: $LOG_FILE"
    
    # 检查运行环境
    check_dependencies
    check_ports
    
    # 准备环境
    create_directories
    generate_configs
    setup_system
    
    # 部署服务
    start_services
    
    # 验证部署
    if verify_services; then
        setup_grafana
        setup_alerting
        show_access_info
        log_info "DLMP监控系统部署成功！"
    else
        log_error "部署过程中出现错误，请查看日志文件: $LOG_FILE"
        exit 1
    fi
}

# 命令行参数处理
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "verify")
        verify_services
        ;;
    "stop")
        log_info "停止监控服务..."
        cd "$MONITORING_DIR"
        docker-compose down
        log_info "监控服务已停止"
        ;;
    "restart")
        log_info "重启监控服务..."
        cd "$MONITORING_DIR"
        docker-compose restart
        log_info "监控服务已重启"
        ;;
    "status")
        cd "$MONITORING_DIR"
        docker-compose ps
        ;;
    "logs")
        cd "$MONITORING_DIR"
        docker-compose logs -f "${2:-}"
        ;;
    *)
        echo "用法: $0 {deploy|verify|stop|restart|status|logs [service]}"
        echo ""
        echo "命令说明:"
        echo "  deploy  - 部署监控系统"
        echo "  verify  - 验证服务状态"
        echo "  stop    - 停止所有服务"
        echo "  restart - 重启所有服务"
        echo "  status  - 查看服务状态"
        echo "  logs    - 查看服务日志"
        exit 1
        ;;
esac