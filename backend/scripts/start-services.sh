#!/bin/bash

# 微服务启动脚本
# 作者: Claude AI Assistant
# 创建时间: 2025-07-12

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 项目根目录
PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT"

# Maven可执行文件
MAVEN_CMD="mvn"

# 服务列表和端口
declare -A SERVICES
SERVICES[gateway]=8080
SERVICES[user-service]=8081
SERVICES[case-service]=8082
SERVICES[assignment-service]=8083
SERVICES[mediation-service]=8084
SERVICES[litigation-service]=8085
SERVICES[settlement-service]=8086
SERVICES[notification-service]=8087
SERVICES[file-service]=8088

# 检查Java环境
check_java() {
    log_info "检查Java环境..."
    
    if ! command -v java &> /dev/null; then
        log_error "Java未安装，请先安装Java 17+"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        log_error "Java版本过低，需要Java 17+，当前版本: $JAVA_VERSION"
        exit 1
    fi
    
    log_success "Java环境检查通过，版本: $(java -version 2>&1 | head -n 1)"
}

# 检查Maven环境
check_maven() {
    log_info "检查Maven环境..."
    
    if ! command -v mvn &> /dev/null; then
        log_error "Maven未安装，请先安装Maven"
        exit 1
    fi
    
    log_success "Maven环境检查通过，版本: $(mvn -version | head -n 1)"
}

# 检查基础设施
check_infrastructure() {
    log_info "检查基础设施状态..."
    
    # 检查MySQL
    if ! nc -z localhost 3306 2>/dev/null; then
        log_warning "MySQL未启动，请先启动基础设施"
        log_info "运行命令: ./scripts/start-infrastructure.sh"
        exit 1
    fi
    
    # 检查Redis
    if ! nc -z localhost 6379 2>/dev/null; then
        log_warning "Redis未启动，请先启动基础设施"
        exit 1
    fi
    
    # 检查Nacos
    if ! nc -z localhost 8848 2>/dev/null; then
        log_warning "Nacos未启动，请先启动基础设施"
        exit 1
    fi
    
    log_success "基础设施状态检查通过"
}

# 编译项目
compile_project() {
    log_info "编译项目..."
    
    $MAVEN_CMD clean compile -DskipTests
    
    if [ $? -eq 0 ]; then
        log_success "项目编译成功"
    else
        log_error "项目编译失败"
        exit 1
    fi
}

# 启动单个服务
start_service() {
    local service_name=$1
    local service_port=${SERVICES[$service_name]}
    
    log_info "启动服务: $service_name (端口: $service_port)"
    
    # 检查端口是否被占用
    if nc -z localhost $service_port 2>/dev/null; then
        log_warning "端口 $service_port 已被占用，跳过启动 $service_name"
        return 0
    fi
    
    # 确定服务路径
    if [ "$service_name" = "gateway" ]; then
        SERVICE_PATH="gateway"
    else
        SERVICE_PATH="services/$service_name"
    fi
    
    # 启动服务
    cd "$SERVICE_PATH"
    
    nohup $MAVEN_CMD spring-boot:run -Dspring-boot.run.profiles=dev > "../logs/${service_name}.log" 2>&1 &
    
    local pid=$!
    echo $pid > "../logs/${service_name}.pid"
    
    cd "$PROJECT_ROOT"
    
    # 等待服务启动
    local retry_count=0
    local max_retries=30
    
    while [ $retry_count -lt $max_retries ]; do
        if nc -z localhost $service_port 2>/dev/null; then
            log_success "$service_name 启动成功 (PID: $pid, 端口: $service_port)"
            return 0
        fi
        
        sleep 2
        retry_count=$((retry_count + 1))
        
        if [ $((retry_count % 5)) -eq 0 ]; then
            log_info "等待 $service_name 启动... ($retry_count/$max_retries)"
        fi
    done
    
    log_error "$service_name 启动失败或超时"
    return 1
}

# 启动所有服务
start_all_services() {
    log_info "开始启动所有微服务..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 首先启动网关
    start_service "gateway"
    sleep 5
    
    # 启动核心服务
    for service in "user-service" "case-service"; do
        start_service "$service"
        sleep 3
    done
    
    # 启动业务服务
    for service in "assignment-service" "mediation-service" "litigation-service" "settlement-service"; do
        start_service "$service"
        sleep 2
    done
    
    # 启动支持服务
    for service in "notification-service" "file-service"; do
        start_service "$service"
        sleep 2
    done
}

# 停止所有服务
stop_all_services() {
    log_info "停止所有微服务..."
    
    for service in "${!SERVICES[@]}"; do
        local pid_file="logs/${service}.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                log_info "停止服务: $service (PID: $pid)"
                kill $pid
                rm -f "$pid_file"
            else
                log_warning "服务 $service 进程不存在"
                rm -f "$pid_file"
            fi
        else
            log_warning "未找到服务 $service 的PID文件"
        fi
    done
    
    log_success "所有服务已停止"
}

# 检查服务状态
check_services_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "=========================================="
    echo "           微服务状态检查"
    echo "=========================================="
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        local pid_file="logs/${service}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null && nc -z localhost $port 2>/dev/null; then
                echo -e "✅ $service: ${GREEN}运行中${NC} (PID: $pid, 端口: $port)"
            else
                echo -e "❌ $service: ${RED}进程异常${NC}"
            fi
        else
            if nc -z localhost $port 2>/dev/null; then
                echo -e "⚠️  $service: ${YELLOW}端口占用但无PID记录${NC} (端口: $port)"
            else
                echo -e "⭕ $service: ${RED}未运行${NC}"
            fi
        fi
    done
    
    echo ""
    echo "=========================================="
    echo "           服务访问地址"
    echo "=========================================="
    echo "🌐 API网关:        http://localhost:8080"
    echo "👤 用户服务:        http://localhost:8081"
    echo "📁 案件服务:        http://localhost:8082"
    echo "🎯 智能分案服务:    http://localhost:8083"
    echo "🤝 调解服务:        http://localhost:8084"
    echo "⚖️  诉讼服务:        http://localhost:8085"
    echo "💰 结算服务:        http://localhost:8086"
    echo "📢 通知服务:        http://localhost:8087"
    echo "📎 文件服务:        http://localhost:8088"
    echo ""
    echo "📚 API文档:        http://localhost:8080/doc.html"
    echo "=========================================="
}

# 显示日志
show_logs() {
    local service_name=${1:-"gateway"}
    local log_file="logs/${service_name}.log"
    
    if [ -f "$log_file" ]; then
        log_info "显示 $service_name 服务日志..."
        tail -f "$log_file"
    else
        log_error "日志文件不存在: $log_file"
        exit 1
    fi
}

# 主函数
main() {
    case "${1:-start}" in
        "start")
            echo ""
            echo "=========================================="
            echo "        启动个贷不良资产诉讼调解平台"
            echo "=========================================="
            echo ""
            
            check_java
            check_maven
            check_infrastructure
            compile_project
            start_all_services
            
            log_info "等待所有服务完全启动..."
            sleep 10
            
            check_services_status
            
            echo ""
            log_success "所有微服务启动完成！"
            echo ""
            ;;
        "stop")
            stop_all_services
            ;;
        "restart")
            stop_all_services
            sleep 5
            main "start"
            ;;
        "status")
            check_services_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [command] [options]"
            echo ""
            echo "命令:"
            echo "  start    启动所有微服务 (默认)"
            echo "  stop     停止所有微服务"
            echo "  restart  重启所有微服务"
            echo "  status   检查服务状态"
            echo "  logs     查看服务日志"
            echo "  help     显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0 start          # 启动所有服务"
            echo "  $0 stop           # 停止所有服务"
            echo "  $0 logs gateway   # 查看网关日志"
            echo ""
            ;;
        *)
            log_error "未知命令: $1"
            echo "运行 '$0 help' 查看帮助信息"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"