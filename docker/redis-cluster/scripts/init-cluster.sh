#!/bin/bash

# Redis集群初始化脚本
# 创建6节点Redis集群 (3主3从)

set -e

# 配置变量
REDIS_PASSWORD=${REDIS_PASSWORD:-redis123456}
REDIS_NODES="redis-node-1:6379 redis-node-2:6379 redis-node-3:6379 redis-node-4:6379 redis-node-5:6379 redis-node-6:6379"

# 日志函数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

# 等待Redis节点启动
wait_for_redis() {
    local host=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    log_info "等待Redis节点启动: $host:$port"
    
    while [ $attempt -le $max_attempts ]; do
        if redis-cli -h $host -p $port -a $REDIS_PASSWORD ping >/dev/null 2>&1; then
            log_info "Redis节点已启动: $host:$port"
            return 0
        fi
        
        log_info "等待Redis节点启动... ($attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "Redis节点启动超时: $host:$port"
    return 1
}

# 检查所有Redis节点是否已启动
check_all_nodes() {
    log_info "检查所有Redis节点状态..."
    
    for node in $REDIS_NODES; do
        host=$(echo $node | cut -d: -f1)
        port=$(echo $node | cut -d: -f2)
        
        if ! wait_for_redis $host $port; then
            log_error "Redis节点未启动: $node"
            return 1
        fi
    done
    
    log_info "所有Redis节点已启动"
    return 0
}

# 检查集群是否已存在
check_cluster_exists() {
    log_info "检查Redis集群是否已存在..."
    
    # 检查第一个节点的集群状态
    local first_node=$(echo $REDIS_NODES | awk '{print $1}')
    local host=$(echo $first_node | cut -d: -f1)
    local port=$(echo $first_node | cut -d: -f2)
    
    local cluster_info=$(redis-cli -h $host -p $port -a $REDIS_PASSWORD cluster info 2>/dev/null || echo "")
    
    if echo "$cluster_info" | grep -q "cluster_state:ok"; then
        log_info "Redis集群已存在且状态正常"
        return 0
    else
        log_info "Redis集群不存在或状态异常"
        return 1
    fi
}

# 创建Redis集群
create_cluster() {
    log_info "开始创建Redis集群..."
    
    # 构建集群创建命令
    local cluster_cmd="redis-cli --cluster create"
    
    for node in $REDIS_NODES; do
        cluster_cmd="$cluster_cmd $node"
    done
    
    cluster_cmd="$cluster_cmd --cluster-replicas 1 --cluster-yes"
    
    # 如果有密码，添加认证参数
    if [ -n "$REDIS_PASSWORD" ]; then
        cluster_cmd="$cluster_cmd -a $REDIS_PASSWORD"
    fi
    
    log_info "执行集群创建命令: $cluster_cmd"
    
    # 执行集群创建
    if eval $cluster_cmd; then
        log_info "Redis集群创建成功"
        return 0
    else
        log_error "Redis集群创建失败"
        return 1
    fi
}

# 验证集群状态
verify_cluster() {
    log_info "验证Redis集群状态..."
    
    local first_node=$(echo $REDIS_NODES | awk '{print $1}')
    local host=$(echo $first_node | cut -d: -f1)
    local port=$(echo $first_node | cut -d: -f2)
    
    # 检查集群信息
    log_info "集群信息:"
    redis-cli -h $host -p $port -a $REDIS_PASSWORD cluster info
    
    echo ""
    log_info "集群节点:"
    redis-cli -h $host -p $port -a $REDIS_PASSWORD cluster nodes
    
    # 测试集群功能
    log_info "测试集群功能..."
    
    # 设置测试数据
    redis-cli -h $host -p $port -a $REDIS_PASSWORD -c set test:key1 "value1"
    redis-cli -h $host -p $port -a $REDIS_PASSWORD -c set test:key2 "value2"
    redis-cli -h $host -p $port -a $REDIS_PASSWORD -c set test:key3 "value3"
    
    # 读取测试数据
    local value1=$(redis-cli -h $host -p $port -a $REDIS_PASSWORD -c get test:key1)
    local value2=$(redis-cli -h $host -p $port -a $REDIS_PASSWORD -c get test:key2)
    local value3=$(redis-cli -h $host -p $port -a $REDIS_PASSWORD -c get test:key3)
    
    if [ "$value1" = "value1" ] && [ "$value2" = "value2" ] && [ "$value3" = "value3" ]; then
        log_info "集群功能测试成功"
        
        # 清理测试数据
        redis-cli -h $host -p $port -a $REDIS_PASSWORD -c del test:key1 test:key2 test:key3
        
        return 0
    else
        log_error "集群功能测试失败"
        return 1
    fi
}

# 配置集群优化参数
optimize_cluster() {
    log_info "配置集群优化参数..."
    
    for node in $REDIS_NODES; do
        host=$(echo $node | cut -d: -f1)
        port=$(echo $node | cut -d: -f2)
        
        # 设置集群配置
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set cluster-node-timeout 15000
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set cluster-migration-barrier 1
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set cluster-require-full-coverage no
        
        # 性能优化配置
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set maxmemory-policy allkeys-lru
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set timeout 300
        redis-cli -h $host -p $port -a $REDIS_PASSWORD config set tcp-keepalive 300
        
        log_info "节点优化配置完成: $node"
    done
    
    log_info "集群优化配置完成"
}

# 主函数
main() {
    log_info "Redis集群初始化开始..."
    
    # 检查所有节点是否启动
    if ! check_all_nodes; then
        log_error "节点检查失败，退出初始化"
        exit 1
    fi
    
    # 检查集群是否已存在
    if check_cluster_exists; then
        log_info "集群已存在，跳过创建步骤"
    else
        # 创建集群
        if ! create_cluster; then
            log_error "集群创建失败，退出初始化"
            exit 1
        fi
        
        # 等待集群稳定
        log_info "等待集群稳定..."
        sleep 10
    fi
    
    # 验证集群状态
    if ! verify_cluster; then
        log_error "集群验证失败"
        exit 1
    fi
    
    # 优化集群配置
    optimize_cluster
    
    log_info "Redis集群初始化完成!"
    log_info ""
    log_info "集群连接信息:"
    log_info "节点地址: $REDIS_NODES"
    log_info "密码: $REDIS_PASSWORD"
    log_info ""
    log_info "使用示例:"
    log_info "redis-cli -c -h redis-node-1 -p 6379 -a $REDIS_PASSWORD"
    log_info ""
    log_info "管理界面: http://localhost:8081 (如果启用了redis-commander)"
    log_info "监控地址: http://localhost:9121/metrics (如果启用了redis-exporter)"
}

# 执行主函数
main "$@"