#!/bin/bash

# 个贷不良资产分散诉讼调解平台 - 基础设施启动脚本
# 作者: Claude AI Assistant
# 创建时间: 2025-07-12

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未启动，请启动Docker服务"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建数据目录..."
    
    cd "$(dirname "$0")/../docker"
    
    # 创建MySQL数据目录
    mkdir -p mysql/master/data mysql/slave1/data mysql/logs
    
    # 创建Redis数据目录
    mkdir -p redis/node1/data redis/node2/data redis/node3/data
    
    # 创建Nacos数据目录
    mkdir -p nacos/logs nacos/data
    
    # 创建RocketMQ数据目录
    mkdir -p rocketmq/nameserver/logs rocketmq/nameserver/store
    mkdir -p rocketmq/broker/logs rocketmq/broker/store
    
    # 创建Elasticsearch数据目录
    mkdir -p elasticsearch/data elasticsearch/logs
    
    # 创建MinIO数据目录
    mkdir -p minio/data
    
    # 创建监控数据目录
    mkdir -p prometheus/data grafana/data
    
    # 设置权限
    chmod -R 777 mysql redis nacos rocketmq elasticsearch minio prometheus grafana
    
    log_success "数据目录创建完成"
}

# 启动基础设施
start_infrastructure() {
    log_info "启动基础设施服务..."
    
    cd "$(dirname "$0")/../docker"
    
    # 停止现有容器（如果存在）
    docker-compose down 2>/dev/null || true
    
    # 启动服务
    log_info "启动MySQL主从集群..."
    docker-compose up -d mysql-master mysql-slave1
    
    # 等待MySQL启动
    log_info "等待MySQL服务启动..."
    sleep 30
    
    # 配置MySQL主从复制
    configure_mysql_replication
    
    log_info "启动Redis集群..."
    docker-compose up -d redis-node1 redis-node2 redis-node3
    
    # 等待Redis启动
    sleep 10
    
    # 配置Redis集群
    configure_redis_cluster
    
    log_info "启动Nacos服务..."
    docker-compose up -d nacos
    
    log_info "启动RocketMQ服务..."
    docker-compose up -d rocketmq-nameserver rocketmq-broker
    
    log_info "启动Elasticsearch服务..."
    docker-compose up -d elasticsearch kibana
    
    log_info "启动MinIO对象存储..."
    docker-compose up -d minio
    
    log_info "启动监控服务..."
    docker-compose up -d prometheus grafana
    
    log_success "基础设施服务启动完成"
}

# 配置MySQL主从复制
configure_mysql_replication() {
    log_info "配置MySQL主从复制..."
    
    # 等待MySQL主库完全启动
    for i in {1..30}; do
        if docker exec dlmp-mysql-master mysql -uroot -proot123456 -e "SELECT 1" &>/dev/null; then
            break
        fi
        log_info "等待MySQL主库启动... ($i/30)"
        sleep 5
    done
    
    # 在主库创建复制用户
    docker exec dlmp-mysql-master mysql -uroot -proot123456 -e "
        CREATE USER IF NOT EXISTS 'replica'@'%' IDENTIFIED BY 'replica123456';
        GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
        FLUSH PRIVILEGES;
    " 2>/dev/null || log_warning "复制用户可能已存在"
    
    # 获取主库状态
    MASTER_STATUS=$(docker exec dlmp-mysql-master mysql -uroot -proot123456 -e "SHOW MASTER STATUS\G" | grep -E "(File|Position)")
    MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
    MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')
    
    log_info "主库日志文件: $MASTER_LOG_FILE, 位置: $MASTER_LOG_POS"
    
    # 等待从库启动
    for i in {1..30}; do
        if docker exec dlmp-mysql-slave1 mysql -uroot -proot123456 -e "SELECT 1" &>/dev/null; then
            break
        fi
        log_info "等待MySQL从库启动... ($i/30)"
        sleep 5
    done
    
    # 配置从库
    docker exec dlmp-mysql-slave1 mysql -uroot -proot123456 -e "
        STOP SLAVE;
        CHANGE MASTER TO
            MASTER_HOST='mysql-master',
            MASTER_PORT=3306,
            MASTER_USER='replica',
            MASTER_PASSWORD='replica123456',
            MASTER_LOG_FILE='$MASTER_LOG_FILE',
            MASTER_LOG_POS=$MASTER_LOG_POS;
        START SLAVE;
    " 2>/dev/null || log_warning "从库配置可能失败"
    
    # 检查从库状态
    sleep 5
    SLAVE_STATUS=$(docker exec dlmp-mysql-slave1 mysql -uroot -proot123456 -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running)")
    
    if echo "$SLAVE_STATUS" | grep -q "Yes.*Yes"; then
        log_success "MySQL主从复制配置成功"
    else
        log_warning "MySQL主从复制配置可能有问题，请检查日志"
    fi
}

# 配置Redis集群
configure_redis_cluster() {
    log_info "配置Redis集群..."
    
    # 等待所有Redis节点启动
    sleep 10
    
    # 创建Redis集群
    docker exec dlmp-redis-node1 redis-cli --cluster create \
        127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
        --cluster-replicas 0 --cluster-yes 2>/dev/null || log_warning "Redis集群可能已存在"
    
    # 检查集群状态
    if docker exec dlmp-redis-node1 redis-cli -p 7001 cluster nodes &>/dev/null; then
        log_success "Redis集群配置成功"
    else
        log_warning "Redis集群配置可能有问题"
    fi
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    cd "$(dirname "$0")/../docker"
    
    echo ""
    echo "=========================================="
    echo "           服务状态检查结果"
    echo "=========================================="
    
    services=(
        "dlmp-mysql-master:3306:MySQL主库"
        "dlmp-mysql-slave1:3306:MySQL从库"
        "dlmp-redis-node1:7001:Redis节点1"
        "dlmp-redis-node2:7002:Redis节点2"
        "dlmp-redis-node3:7003:Redis节点3"
        "dlmp-nacos:8848:Nacos服务"
        "dlmp-rocketmq-nameserver:9876:RocketMQ NameServer"
        "dlmp-rocketmq-broker:10911:RocketMQ Broker"
        "dlmp-elasticsearch:9200:Elasticsearch"
        "dlmp-kibana:5601:Kibana"
        "dlmp-minio:9000:MinIO"
        "dlmp-prometheus:9090:Prometheus"
        "dlmp-grafana:3000:Grafana"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r container port name <<< "$service"
        
        if docker ps | grep -q "$container"; then
            if nc -z localhost "$port" 2>/dev/null; then
                echo -e "✅ $name: ${GREEN}运行正常${NC} (端口: $port)"
            else
                echo -e "⚠️  $name: ${YELLOW}容器运行但端口未就绪${NC} (端口: $port)"
            fi
        else
            echo -e "❌ $name: ${RED}未运行${NC}"
        fi
    done
    
    echo ""
    echo "=========================================="
    echo "           管理界面访问地址"
    echo "=========================================="
    echo "🌐 Nacos控制台:     http://localhost:8848/nacos"
    echo "   用户名/密码:     nacos/nacos"
    echo ""
    echo "🔍 Kibana界面:      http://localhost:5601"
    echo ""
    echo "📊 Grafana监控:     http://localhost:3000"
    echo "   用户名/密码:     admin/admin123456"
    echo ""
    echo "📈 Prometheus:      http://localhost:9090"
    echo ""
    echo "💾 MinIO控制台:     http://localhost:9001"
    echo "   用户名/密码:     admin/admin123456"
    echo ""
    echo "=========================================="
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 等待MySQL完全启动
    for i in {1..60}; do
        if docker exec dlmp-mysql-master mysql -uroot -proot123456 -e "SELECT 1" &>/dev/null; then
            break
        fi
        log_info "等待MySQL服务完全启动... ($i/60)"
        sleep 5
    done
    
    # 执行数据库初始化脚本
    log_info "执行数据库架构脚本..."
    
    cd "$(dirname "$0")/.."
    
    # 创建数据库和表结构
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/01_init_database.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/02_user_tables.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/03_case_tables_enhanced.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/04_mediation_tables.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/05_litigation_tables.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/06_settlement_tables.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/schema/07_log_tables.sql
    
    # 插入基础数据
    log_info "插入基础数据..."
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/data/init_basic_data.sql
    docker exec -i dlmp-mysql-master mysql -uroot -proot123456 < sql/data/init_enhanced_data.sql
    
    log_success "数据库初始化完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  个贷不良资产分散诉讼调解平台基础设施启动"
    echo "=========================================="
    echo ""
    
    check_docker
    create_directories
    start_infrastructure
    
    log_info "等待所有服务完全启动..."
    sleep 30
    
    init_database
    check_services
    
    echo ""
    log_success "基础设施启动完成！"
    echo ""
    echo "接下来可以："
    echo "1. 启动后端微服务"
    echo "2. 启动前端应用"
    echo "3. 开始开发调试"
    echo ""
}

# 执行主函数
main "$@"