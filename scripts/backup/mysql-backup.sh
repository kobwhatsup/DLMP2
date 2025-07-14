#!/bin/bash

# DLMP MySQL数据库备份脚本
# 支持全量备份、增量备份和Point-in-time恢复

set -e

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup.conf"
LOG_FILE="/var/log/dlmp/mysql-backup.log"

# 默认配置
DB_HOST="${DB_HOST:-mysql-master.dlmp-production.svc.cluster.local}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backup/mysql}"
S3_BUCKET="${S3_BUCKET:-dlmp-backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
RETENTION_WEEKS="${RETENTION_WEEKS:-12}"
RETENTION_MONTHS="${RETENTION_MONTHS:-12}"

# 加载配置文件
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"/{full,incremental,binlog}
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
}

# 检查MySQL连接
check_mysql_connection() {
    log "检查MySQL连接..."
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &>/dev/null; then
        log_error "无法连接到MySQL服务器"
        exit 1
    fi
    log "MySQL连接正常"
}

# 获取当前binlog位置
get_binlog_position() {
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -e "SHOW MASTER STATUS;" | tail -n 1
}

# 全量备份
full_backup() {
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/full/dlmp_full_${backup_date}.sql"
    local backup_info="$BACKUP_DIR/full/dlmp_full_${backup_date}.info"
    
    log "开始全量备份: $backup_file"
    
    # 记录备份开始位置
    get_binlog_position > "$backup_info"
    
    # 执行全量备份
    mysqldump \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --all-databases \
        --master-data=2 \
        --events \
        --hex-blob \
        --quick \
        --lock-tables=false \
        --flush-logs > "$backup_file"
    
    if [ $? -eq 0 ]; then
        # 压缩备份文件
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        # 记录备份结束位置
        get_binlog_position >> "$backup_info"
        echo "backup_file=$backup_file" >> "$backup_info"
        echo "backup_size=$(stat -c%s "$backup_file")" >> "$backup_info"
        echo "backup_date=$backup_date" >> "$backup_info"
        
        log "全量备份完成: $backup_file"
        
        # 上传到云存储
        upload_to_s3 "$backup_file" "full/$backup_date/"
        upload_to_s3 "$backup_info" "full/$backup_date/"
        
        # 验证备份
        verify_backup "$backup_file"
        
    else
        log_error "全量备份失败"
        exit 1
    fi
}

# 增量备份
incremental_backup() {
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local backup_dir="$BACKUP_DIR/incremental/$backup_date"
    local last_backup_info="$BACKUP_DIR/incremental/last_backup.info"
    
    mkdir -p "$backup_dir"
    
    log "开始增量备份: $backup_dir"
    
    # 获取上次备份的位置
    local start_position=""
    if [ -f "$last_backup_info" ]; then
        start_position=$(grep "end_position" "$last_backup_info" | cut -d'=' -f2)
    fi
    
    # 获取当前位置
    local current_position=$(get_binlog_position)
    
    if [ -z "$start_position" ]; then
        log "未找到上次备份位置，执行全量备份"
        full_backup
        return
    fi
    
    # 复制binlog文件
    local binlog_files=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        -e "SHOW BINARY LOGS;" | awk 'NR>1 {print $1}')
    
    for binlog_file in $binlog_files; do
        if [ ! -f "$BACKUP_DIR/binlog/$binlog_file" ]; then
            mysqlbinlog \
                --read-from-remote-server \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --user="$DB_USER" \
                --password="$DB_PASSWORD" \
                --raw \
                --result-file="$backup_dir/" \
                "$binlog_file"
        fi
    done
    
    # 记录备份信息
    echo "start_position=$start_position" > "$backup_dir/backup.info"
    echo "end_position=$current_position" >> "$backup_dir/backup.info"
    echo "backup_date=$backup_date" >> "$backup_dir/backup.info"
    
    # 更新最后备份信息
    echo "end_position=$current_position" > "$last_backup_info"
    echo "backup_date=$backup_date" >> "$last_backup_info"
    
    # 压缩备份目录
    tar -czf "$backup_dir.tar.gz" -C "$BACKUP_DIR/incremental" "$backup_date"
    rm -rf "$backup_dir"
    
    log "增量备份完成: $backup_dir.tar.gz"
    
    # 上传到云存储
    upload_to_s3 "$backup_dir.tar.gz" "incremental/$backup_date/"
}

# 上传到S3
upload_to_s3() {
    local file_path="$1"
    local s3_path="$2"
    
    if command -v aws &> /dev/null; then
        log "上传文件到S3: s3://$S3_BUCKET/$s3_path"
        aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_path" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256
        
        if [ $? -eq 0 ]; then
            log "文件上传成功"
        else
            log_error "文件上传失败"
        fi
    else
        log "AWS CLI未安装，跳过S3上传"
    fi
}

# 验证备份
verify_backup() {
    local backup_file="$1"
    
    log "验证备份文件: $backup_file"
    
    # 检查文件完整性
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    # 检查文件大小
    local file_size=$(stat -c%s "$backup_file")
    if [ "$file_size" -lt 1000 ]; then
        log_error "备份文件异常小: $file_size bytes"
        return 1
    fi
    
    # 检查SQL文件格式（如果是.gz文件则解压检查）
    if [[ "$backup_file" == *.gz ]]; then
        if ! zcat "$backup_file" | head -20 | grep -q "MySQL dump"; then
            log_error "备份文件格式错误"
            return 1
        fi
    else
        if ! head -20 "$backup_file" | grep -q "MySQL dump"; then
            log_error "备份文件格式错误"
            return 1
        fi
    fi
    
    log "备份文件验证通过"
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log "清理旧备份文件..."
    
    # 清理本地旧备份
    find "$BACKUP_DIR/full" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/incremental" -name "*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR/binlog" -name "*.log" -mtime +7 -delete
    
    # 清理S3旧备份
    if command -v aws &> /dev/null; then
        # 删除超过保留期的全量备份
        aws s3 ls "s3://$S3_BUCKET/full/" --recursive | \
        while read -r line; do
            date_str=$(echo $line | awk '{print $1" "$2}')
            file_path=$(echo $line | awk '{print $4}')
            file_date=$(date -d "$date_str" +%s)
            cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [ "$file_date" -lt "$cutoff_date" ]; then
                aws s3 rm "s3://$S3_BUCKET/$file_path"
                log "删除过期备份: $file_path"
            fi
        done
    fi
    
    log "旧备份清理完成"
}

# Point-in-time恢复
restore_point_in_time() {
    local target_time="$1"
    local restore_host="${2:-localhost}"
    
    if [ -z "$target_time" ]; then
        log_error "请指定恢复时间点 (格式: YYYY-MM-DD HH:MM:SS)"
        exit 1
    fi
    
    log "开始Point-in-time恢复到: $target_time"
    
    # 找到最近的全量备份
    local latest_full_backup=$(find "$BACKUP_DIR/full" -name "*.gz" -type f | sort | tail -1)
    if [ -z "$latest_full_backup" ]; then
        log_error "未找到全量备份文件"
        exit 1
    fi
    
    log "使用全量备份: $latest_full_backup"
    
    # 恢复全量备份
    log "恢复全量备份..."
    zcat "$latest_full_backup" | mysql -h "$restore_host" -u "$DB_USER" -p"$DB_PASSWORD"
    
    # 应用增量备份到指定时间点
    log "应用增量备份到时间点: $target_time"
    find "$BACKUP_DIR/binlog" -name "*.log" -type f | sort | \
    while read binlog_file; do
        mysqlbinlog "$binlog_file" --stop-datetime="$target_time" | \
        mysql -h "$restore_host" -u "$DB_USER" -p"$DB_PASSWORD"
    done
    
    log "Point-in-time恢复完成"
}

# 主从切换
failover_to_slave() {
    local slave_host="$1"
    
    if [ -z "$slave_host" ]; then
        log_error "请指定从服务器地址"
        exit 1
    fi
    
    log "开始主从切换到: $slave_host"
    
    # 停止从服务器复制
    mysql -h "$slave_host" -u "$DB_USER" -p"$DB_PASSWORD" \
        -e "STOP SLAVE;"
    
    # 重置从服务器状态
    mysql -h "$slave_host" -u "$DB_USER" -p"$DB_PASSWORD" \
        -e "RESET SLAVE ALL;"
    
    # 设置为只读关闭（变为主服务器）
    mysql -h "$slave_host" -u "$DB_USER" -p"$DB_PASSWORD" \
        -e "SET GLOBAL read_only = OFF;"
    
    log "主从切换完成，新主服务器: $slave_host"
}

# 监控备份状态
monitor_backup_status() {
    local status_file="/tmp/dlmp_backup_status.json"
    
    # 检查最近备份状态
    local last_full_backup=$(find "$BACKUP_DIR/full" -name "*.gz" -type f -mtime -1 | wc -l)
    local last_inc_backup=$(find "$BACKUP_DIR/incremental" -name "*.tar.gz" -type f -mtime -1 | wc -l)
    
    # 生成状态JSON
    cat > "$status_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "full_backup_24h": $last_full_backup,
  "incremental_backup_24h": $last_inc_backup,
  "backup_directory_size": "$(du -sh $BACKUP_DIR | cut -f1)",
  "mysql_replication_status": "$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep "Slave_IO_Running" | awk '{print $2}')",
  "last_backup_time": "$(stat -c %Y "$BACKUP_DIR/incremental/last_backup.info" 2>/dev/null || echo 0)"
}
EOF
    
    # 发送到监控系统
    if command -v curl &> /dev/null && [ -n "$MONITORING_WEBHOOK" ]; then
        curl -X POST -H "Content-Type: application/json" \
            -d @"$status_file" "$MONITORING_WEBHOOK"
    fi
    
    echo "Backup Status:"
    cat "$status_file"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $0 [选项] [命令]

命令:
  full                     执行全量备份
  incremental             执行增量备份
  restore <time>          Point-in-time恢复
  failover <slave_host>   主从切换
  cleanup                 清理旧备份
  monitor                 监控备份状态
  verify <backup_file>    验证备份文件

选项:
  -h, --help              显示帮助信息
  -c, --config FILE       指定配置文件
  -v, --verbose           详细输出

示例:
  $0 full                                    # 全量备份
  $0 incremental                            # 增量备份
  $0 restore "2024-01-01 12:00:00"         # 恢复到指定时间点
  $0 failover mysql-slave-1                # 主从切换
  $0 cleanup                               # 清理旧备份

配置文件示例 ($CONFIG_FILE):
  DB_HOST=mysql-master.dlmp-production.svc.cluster.local
  DB_USER=root
  DB_PASSWORD=your_password
  BACKUP_DIR=/backup/mysql
  S3_BUCKET=dlmp-backup
  RETENTION_DAYS=30
EOF
}

# 主函数
main() {
    case "${1:-help}" in
        "full")
            check_mysql_connection
            full_backup
            cleanup_old_backups
            ;;
        "incremental")
            check_mysql_connection
            incremental_backup
            ;;
        "restore")
            check_mysql_connection
            restore_point_in_time "$2" "$3"
            ;;
        "failover")
            check_mysql_connection
            failover_to_slave "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "monitor")
            monitor_backup_status
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"