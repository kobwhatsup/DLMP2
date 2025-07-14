#!/bin/bash

# DLMP Backend 启动脚本
# 包含JVM调优、性能监控、健康检查等功能

set -e

# 应用配置
APP_NAME="dlmp-backend"
APP_VERSION="1.0.0"
JAR_FILE="dlmp-backend.jar"

# 环境配置
PROFILE=${SPRING_PROFILES_ACTIVE:-production}
LOG_DIR=${LOG_DIR:-/var/log/dlmp}
DATA_DIR=${DATA_DIR:-/data/dlmp}
PID_FILE=${PID_FILE:-/var/run/dlmp.pid}

# JVM配置
JAVA_OPTS=""

# 基础JVM参数
JAVA_OPTS="$JAVA_OPTS -server"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
JAVA_OPTS="$JAVA_OPTS -Duser.timezone=Asia/Shanghai"
JAVA_OPTS="$JAVA_OPTS -Djava.net.preferIPv4Stack=true"

# 内存配置
if [ -z "$HEAP_SIZE" ]; then
    # 根据容器内存自动设置堆大小
    TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $TOTAL_MEMORY -gt 8192 ]; then
        HEAP_SIZE="4g"
    elif [ $TOTAL_MEMORY -gt 4096 ]; then
        HEAP_SIZE="2g"
    elif [ $TOTAL_MEMORY -gt 2048 ]; then
        HEAP_SIZE="1g"
    else
        HEAP_SIZE="512m"
    fi
fi

JAVA_OPTS="$JAVA_OPTS -Xms$HEAP_SIZE"
JAVA_OPTS="$JAVA_OPTS -Xmx$HEAP_SIZE"

# 新生代配置
JAVA_OPTS="$JAVA_OPTS -XX:NewRatio=3"
JAVA_OPTS="$JAVA_OPTS -XX:SurvivorRatio=8"

# 元空间配置
JAVA_OPTS="$JAVA_OPTS -XX:MetaspaceSize=256m"
JAVA_OPTS="$JAVA_OPTS -XX:MaxMetaspaceSize=512m"

# 垃圾收集器配置 - G1GC
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
JAVA_OPTS="$JAVA_OPTS -XX:G1HeapRegionSize=16m"
JAVA_OPTS="$JAVA_OPTS -XX:G1ReservePercent=25"
JAVA_OPTS="$JAVA_OPTS -XX:InitiatingHeapOccupancyPercent=30"

# 字符串优化
JAVA_OPTS="$JAVA_OPTS -XX:+UseStringDeduplication"
JAVA_OPTS="$JAVA_OPTS -XX:+OptimizeStringConcat"

# 压缩指针
JAVA_OPTS="$JAVA_OPTS -XX:+UseCompressedOops"
JAVA_OPTS="$JAVA_OPTS -XX:+UseCompressedClassPointers"

# JIT编译优化
JAVA_OPTS="$JAVA_OPTS -XX:+TieredCompilation"
JAVA_OPTS="$JAVA_OPTS -XX:+UseCodeCacheFlushing"
JAVA_OPTS="$JAVA_OPTS -XX:ReservedCodeCacheSize=256m"

# 性能优化
JAVA_OPTS="$JAVA_OPTS -XX:+UseFastAccessorMethods"
JAVA_OPTS="$JAVA_OPTS -XX:+AggressiveOpts"
JAVA_OPTS="$JAVA_OPTS -XX:+UseBiasedLocking"

# GC日志配置
GC_LOG_FILE="$LOG_DIR/gc.log"
JAVA_OPTS="$JAVA_OPTS -Xloggc:$GC_LOG_FILE"
JAVA_OPTS="$JAVA_OPTS -XX:+PrintGC"
JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCDetails"
JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCTimeStamps"
JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCDateStamps"
JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCApplicationStoppedTime"
JAVA_OPTS="$JAVA_OPTS -XX:+UseGCLogFileRotation"
JAVA_OPTS="$JAVA_OPTS -XX:NumberOfGCLogFiles=10"
JAVA_OPTS="$JAVA_OPTS -XX:GCLogFileSize=100M"

# JFR性能分析（Java 11+）
if [ "$ENABLE_JFR" = "true" ]; then
    JFR_FILE="$LOG_DIR/app-$(date +%Y%m%d-%H%M%S).jfr"
    JAVA_OPTS="$JAVA_OPTS -XX:+FlightRecorder"
    JAVA_OPTS="$JAVA_OPTS -XX:StartFlightRecording=duration=1h,filename=$JFR_FILE"
fi

# JMX监控配置
if [ "$ENABLE_JMX" = "true" ]; then
    JMX_PORT=${JMX_PORT:-9999}
    JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote"
    JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote.port=$JMX_PORT"
    JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote.authenticate=false"
    JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote.ssl=false"
    JAVA_OPTS="$JAVA_OPTS -Dcom.sun.management.jmxremote.local.only=false"
    JAVA_OPTS="$JAVA_OPTS -Djava.rmi.server.hostname=$(hostname -i)"
fi

# 远程调试配置
if [ "$ENABLE_DEBUG" = "true" ]; then
    DEBUG_PORT=${DEBUG_PORT:-5005}
    JAVA_OPTS="$JAVA_OPTS -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:$DEBUG_PORT"
fi

# 内存分析配置
if [ "$ENABLE_HEAP_DUMP" = "true" ]; then
    JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError"
    JAVA_OPTS="$JAVA_OPTS -XX:HeapDumpPath=$LOG_DIR/heapdump.hprof"
fi

# 应用特定参数
JAVA_OPTS="$JAVA_OPTS -Dspring.profiles.active=$PROFILE"
JAVA_OPTS="$JAVA_OPTS -Dlogging.file.path=$LOG_DIR"

# 函数定义
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

# 检查Java环境
check_java() {
    if [ -z "$JAVA_HOME" ]; then
        JAVA_CMD="java"
    else
        JAVA_CMD="$JAVA_HOME/bin/java"
    fi

    if ! command -v $JAVA_CMD &> /dev/null; then
        log_error "Java not found. Please install Java 17 or later."
        exit 1
    fi

    JAVA_VERSION=$($JAVA_CMD -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        log_error "Java version $JAVA_VERSION is not supported. Please use Java 17 or later."
        exit 1
    fi

    log_info "Using Java: $($JAVA_CMD -version 2>&1 | head -1)"
}

# 创建必要目录
create_directories() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$(dirname $PID_FILE)"
    
    log_info "Created directories: $LOG_DIR, $DATA_DIR"
}

# 检查端口占用
check_port() {
    local port=${SERVER_PORT:-8080}
    if netstat -tuln | grep ":$port " > /dev/null; then
        log_error "Port $port is already in use"
        exit 1
    fi
}

# 启动前检查
pre_start_check() {
    # 检查JAR文件
    if [ ! -f "$JAR_FILE" ]; then
        log_error "JAR file not found: $JAR_FILE"
        exit 1
    fi

    # 检查配置文件
    if [ ! -f "application-$PROFILE.yml" ] && [ ! -f "application-$PROFILE.properties" ]; then
        log_error "Configuration file not found for profile: $PROFILE"
        exit 1
    fi

    # 检查数据库连接
    if [ "$CHECK_DB" = "true" ]; then
        log_info "Checking database connection..."
        # 这里可以添加数据库连接检查逻辑
    fi

    # 检查Redis连接
    if [ "$CHECK_REDIS" = "true" ]; then
        log_info "Checking Redis connection..."
        # 这里可以添加Redis连接检查逻辑
    fi
}

# 启动应用
start_app() {
    log_info "Starting $APP_NAME version $APP_VERSION with profile: $PROFILE"
    log_info "JVM Options: $JAVA_OPTS"
    log_info "Heap Size: $HEAP_SIZE"
    
    # 启动应用
    nohup $JAVA_CMD $JAVA_OPTS -jar "$JAR_FILE" > "$LOG_DIR/startup.log" 2>&1 &
    
    local pid=$!
    echo $pid > "$PID_FILE"
    
    log_info "Application started with PID: $pid"
    
    # 等待应用启动
    wait_for_startup
}

# 等待应用启动
wait_for_startup() {
    local port=${SERVER_PORT:-8080}
    local max_wait=${STARTUP_TIMEOUT:-120}
    local wait_time=0
    
    log_info "Waiting for application to start on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            log_info "Application started successfully in ${wait_time}s"
            return 0
        fi
        
        sleep 5
        wait_time=$((wait_time + 5))
        
        if [ $((wait_time % 30)) -eq 0 ]; then
            log_info "Still waiting for startup... (${wait_time}s/${max_wait}s)"
        fi
    done
    
    log_error "Application failed to start within ${max_wait}s"
    return 1
}

# 停止应用
stop_app() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "Stopping application with PID: $pid"
            
            # 优雅停止
            kill -TERM $pid
            
            # 等待停止
            local wait_time=0
            while [ $wait_time -lt 30 ] && ps -p $pid > /dev/null 2>&1; do
                sleep 1
                wait_time=$((wait_time + 1))
            done
            
            # 强制停止
            if ps -p $pid > /dev/null 2>&1; then
                log_info "Force stopping application"
                kill -KILL $pid
            fi
            
            rm -f "$PID_FILE"
            log_info "Application stopped"
        else
            log_info "Application is not running"
            rm -f "$PID_FILE"
        fi
    else
        log_info "PID file not found"
    fi
}

# 重启应用
restart_app() {
    log_info "Restarting application..."
    stop_app
    sleep 5
    start_app
}

# 检查应用状态
status_app() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "Application is running with PID: $pid"
            
            # 检查健康状态
            local port=${SERVER_PORT:-8080}
            if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
                log_info "Application is healthy"
            else
                log_info "Application is running but not healthy"
            fi
        else
            log_info "Application is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        log_info "Application is not running"
    fi
}

# 主函数
main() {
    case "$1" in
        start)
            check_java
            create_directories
            check_port
            pre_start_check
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        status)
            status_app
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status}"
            exit 1
            ;;
    esac
}

# 信号处理
trap 'log_info "Received signal, stopping application..."; stop_app; exit 0' TERM INT

# 执行主函数
main "$@"