#!/bin/bash

# DLMP 文件存储备份脚本
# 支持分层存储备份和异地同步

set -e

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/backup.conf"
LOG_FILE="/var/log/dlmp/file-backup.log"

# 默认配置
SOURCE_DIRS=("/data" "/uploads" "/logs")
BACKUP_DIR="${BACKUP_DIR:-/backup/files}"
S3_BUCKET="${S3_BUCKET:-dlmp-backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"
PARALLEL_UPLOADS="${PARALLEL_UPLOADS:-4}"

# 加载配置文件
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
}

# 计算目录大小
calculate_dir_size() {
    local dir="$1"
    if [ -d "$dir" ]; then
        du -sb "$dir" | cut -f1
    else
        echo "0"
    fi
}

# 增量备份
incremental_backup() {
    local source_dir="$1"
    local backup_name="$2"
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/daily/${backup_name}_${backup_date}"
    local last_backup_file="$BACKUP_DIR/daily/.last_${backup_name}.timestamp"
    
    log "开始增量备份: $source_dir -> $backup_path"
    
    # 获取上次备份时间
    local find_newer=""
    if [ -f "$last_backup_file" ]; then
        local last_backup=$(cat "$last_backup_file")
        find_newer="-newer $last_backup_file"
        log "上次备份时间: $last_backup"
    fi
    
    # 创建备份目录
    mkdir -p "$backup_path"
    
    # 查找变更的文件
    local changed_files=$(find "$source_dir" -type f $find_newer 2>/dev/null | wc -l)
    log "发现 $changed_files 个变更文件"
    
    if [ "$changed_files" -gt 0 ]; then
        # 创建文件列表
        find "$source_dir" -type f $find_newer > "$backup_path/changed_files.list" 2>/dev/null
        
        # 使用rsync进行增量备份
        rsync -av \
            --files-from="$backup_path/changed_files.list" \
            / \
            "$backup_path/data/" \
            --progress \
            --stats \
            > "$backup_path/rsync.log" 2>&1
        
        # 压缩备份
        log "压缩备份文件..."
        tar -czf "$backup_path.tar.gz" \
            -C "$BACKUP_DIR/daily" \
            "$(basename "$backup_path")" \
            --remove-files
        
        # 记录备份信息
        cat > "$backup_path.info" << EOF
backup_date=$backup_date
source_dir=$source_dir
backup_type=incremental
changed_files=$changed_files
backup_size=$(stat -c%s "$backup_path.tar.gz")
compressed_size=$(stat -c%s "$backup_path.tar.gz")
EOF
        
        # 更新时间戳
        touch "$last_backup_file"
        echo "$backup_date" > "$last_backup_file"
        
        log "增量备份完成: $backup_path.tar.gz"
        
        # 上传到云存储
        upload_to_s3 "$backup_path.tar.gz" "files/incremental/$backup_name/"
        upload_to_s3 "$backup_path.info" "files/incremental/$backup_name/"
        
    else
        log "无变更文件，跳过备份"
        rmdir "$backup_path" 2>/dev/null || true
    fi
}

# 全量备份
full_backup() {
    local source_dir="$1"
    local backup_name="$2"
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/weekly/${backup_name}_full_${backup_date}.tar.gz"
    
    log "开始全量备份: $source_dir -> $backup_path"
    
    # 计算源目录大小
    local source_size=$(calculate_dir_size "$source_dir")
    log "源目录大小: $(numfmt --to=iec $source_size)"
    
    # 创建全量备份
    tar -czf "$backup_path" \
        -C "$(dirname "$source_dir")" \
        "$(basename "$source_dir")" \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='cache/*' \
        --warning=no-file-changed
    
    # 记录备份信息
    local backup_size=$(stat -c%s "$backup_path")
    cat > "${backup_path}.info" << EOF
backup_date=$backup_date
source_dir=$source_dir
backup_type=full
source_size=$source_size
backup_size=$backup_size
compression_ratio=$(echo "scale=2; $backup_size * 100 / $source_size" | bc -l)%
EOF
    
    log "全量备份完成: $backup_path"
    log "备份大小: $(numfmt --to=iec $backup_size)"
    log "压缩比: $(echo "scale=2; $backup_size * 100 / $source_size" | bc -l)%"
    
    # 上传到云存储
    upload_to_s3 "$backup_path" "files/full/$backup_name/"
    upload_to_s3 "${backup_path}.info" "files/full/$backup_name/"
}

# 差异备份
differential_backup() {
    local source_dir="$1"
    local backup_name="$2"
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/monthly/${backup_name}_diff_${backup_date}"
    local last_full_backup=""
    
    # 查找最近的全量备份
    last_full_backup=$(find "$BACKUP_DIR/weekly" -name "${backup_name}_full_*.tar.gz" -type f | sort | tail -1)
    
    if [ -z "$last_full_backup" ]; then
        log "未找到全量备份，执行全量备份"
        full_backup "$source_dir" "$backup_name"
        return
    fi
    
    log "开始差异备份: $source_dir -> $backup_path"
    log "基于全量备份: $last_full_backup"
    
    # 获取全量备份的时间戳
    local full_backup_time=$(stat -c %Y "$last_full_backup")
    
    # 创建备份目录
    mkdir -p "$backup_path"
    
    # 查找自全量备份以来变更的文件
    find "$source_dir" -type f -newer "$last_full_backup" > "$backup_path/changed_files.list" 2>/dev/null
    
    local changed_files=$(cat "$backup_path/changed_files.list" | wc -l)
    log "发现 $changed_files 个变更文件"
    
    if [ "$changed_files" -gt 0 ]; then
        # 复制变更的文件
        while IFS= read -r file; do
            local relative_path="${file#$source_dir/}"
            local target_path="$backup_path/data/$relative_path"
            mkdir -p "$(dirname "$target_path")"
            cp "$file" "$target_path"
        done < "$backup_path/changed_files.list"
        
        # 压缩差异备份
        tar -czf "$backup_path.tar.gz" \
            -C "$BACKUP_DIR/monthly" \
            "$(basename "$backup_path")" \
            --remove-files
        
        # 记录备份信息
        cat > "$backup_path.info" << EOF
backup_date=$backup_date
source_dir=$source_dir
backup_type=differential
changed_files=$changed_files
backup_size=$(stat -c%s "$backup_path.tar.gz")
base_backup=$last_full_backup
base_backup_time=$(date -d @$full_backup_time '+%Y-%m-%d %H:%M:%S')
EOF
        
        log "差异备份完成: $backup_path.tar.gz"
        
        # 上传到云存储
        upload_to_s3 "$backup_path.tar.gz" "files/differential/$backup_name/"
        upload_to_s3 "$backup_path.info" "files/differential/$backup_name/"
        
    else
        log "无变更文件，跳过差异备份"
        rmdir "$backup_path" 2>/dev/null || true
    fi
}

# 同步到云存储
upload_to_s3() {
    local file_path="$1"
    local s3_path="$2"
    
    if command -v aws &> /dev/null; then
        log "上传文件到S3: s3://$S3_BUCKET/$s3_path$(basename "$file_path")"
        
        # 根据文件大小选择上传方式
        local file_size=$(stat -c%s "$file_path")
        
        if [ "$file_size" -gt 104857600 ]; then  # 100MB
            # 大文件使用多部分上传
            aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_path$(basename "$file_path")" \
                --storage-class STANDARD_IA \
                --server-side-encryption AES256 \
                --cli-write-timeout 0 \
                --cli-read-timeout 0
        else
            # 小文件直接上传
            aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_path$(basename "$file_path")" \
                --storage-class STANDARD_IA \
                --server-side-encryption AES256
        fi
        
        if [ $? -eq 0 ]; then
            log "文件上传成功"
        else
            log_error "文件上传失败"
        fi
    else
        log "AWS CLI未安装，跳过S3上传"
    fi
}

# 验证备份完整性
verify_backup() {
    local backup_file="$1"
    
    log "验证备份文件: $backup_file"
    
    # 检查文件存在性
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在"
        return 1
    fi
    
    # 检查文件大小
    local file_size=$(stat -c%s "$backup_file")
    if [ "$file_size" -lt 100 ]; then
        log_error "备份文件异常小: $file_size bytes"
        return 1
    fi
    
    # 验证tar文件完整性
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        log "备份文件验证通过"
        return 0
    else
        log_error "备份文件损坏"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "清理旧备份文件..."
    
    # 清理本地旧备份
    find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR/weekly" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/monthly" -name "*.tar.gz" -mtime +90 -delete
    
    # 清理信息文件
    find "$BACKUP_DIR" -name "*.info" -mtime +$RETENTION_DAYS -delete
    
    # 清理S3旧备份
    if command -v aws &> /dev/null; then
        # 设置生命周期策略而不是手动删除
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$S3_BUCKET" \
            --lifecycle-configuration file://<(cat << EOF
{
    "Rules": [
        {
            "ID": "DLMPFileBackupRetention",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "files/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
EOF
) 2>/dev/null || log "无法设置S3生命周期策略"
    fi
    
    log "旧备份清理完成"
}

# 恢复文件
restore_files() {
    local backup_file="$1"
    local restore_path="${2:-/tmp/restore}"
    
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件"
        exit 1
    fi
    
    log "开始文件恢复: $backup_file -> $restore_path"
    
    # 创建恢复目录
    mkdir -p "$restore_path"
    
    # 检查备份文件
    if [ ! -f "$backup_file" ]; then
        # 尝试从S3下载
        if [[ "$backup_file" == s3://* ]]; then
            log "从S3下载备份文件..."
            local local_backup="/tmp/$(basename "$backup_file")"
            aws s3 cp "$backup_file" "$local_backup"
            backup_file="$local_backup"
        else
            log_error "备份文件不存在: $backup_file"
            exit 1
        fi
    fi
    
    # 验证备份文件
    if ! verify_backup "$backup_file"; then
        log_error "备份文件验证失败"
        exit 1
    fi
    
    # 解压恢复
    tar -xzf "$backup_file" -C "$restore_path"
    
    log "文件恢复完成: $restore_path"
}

# 监控备份状态
monitor_backup_status() {
    local status_file="/tmp/dlmp_file_backup_status.json"
    
    # 统计备份信息
    local daily_backups=$(find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime -1 | wc -l)
    local weekly_backups=$(find "$BACKUP_DIR/weekly" -name "*.tar.gz" -mtime -7 | wc -l)
    local total_size=$(du -sb "$BACKUP_DIR" | cut -f1)
    
    # 生成状态JSON
    cat > "$status_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "daily_backups_24h": $daily_backups,
  "weekly_backups_7d": $weekly_backups,
  "total_backup_size": "$total_size",
  "backup_directory": "$BACKUP_DIR",
  "s3_bucket": "$S3_BUCKET",
  "retention_days": $RETENTION_DAYS
}
EOF
    
    echo "File Backup Status:"
    cat "$status_file"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $0 [选项] [命令]

命令:
  incremental             执行增量备份
  full                    执行全量备份
  differential            执行差异备份
  restore <backup> <path> 恢复文件
  cleanup                 清理旧备份
  verify <backup>         验证备份文件
  monitor                 监控备份状态

选项:
  -h, --help              显示帮助信息
  -c, --config FILE       指定配置文件
  -s, --source DIR        指定源目录
  -d, --destination DIR   指定备份目录

示例:
  $0 incremental                            # 增量备份所有配置目录
  $0 full                                   # 全量备份所有配置目录
  $0 restore /backup/files/data_20240101.tar.gz /tmp/restore
  $0 verify /backup/files/data_20240101.tar.gz
EOF
}

# 主函数
main() {
    case "${1:-incremental}" in
        "incremental")
            log "开始增量文件备份..."
            for i in "${!SOURCE_DIRS[@]}"; do
                local source_dir="${SOURCE_DIRS[$i]}"
                local backup_name="data$i"
                if [ -d "$source_dir" ]; then
                    incremental_backup "$source_dir" "$backup_name"
                else
                    log "源目录不存在: $source_dir"
                fi
            done
            cleanup_old_backups
            ;;
        "full")
            log "开始全量文件备份..."
            for i in "${!SOURCE_DIRS[@]}"; do
                local source_dir="${SOURCE_DIRS[$i]}"
                local backup_name="data$i"
                if [ -d "$source_dir" ]; then
                    full_backup "$source_dir" "$backup_name"
                else
                    log "源目录不存在: $source_dir"
                fi
            done
            ;;
        "differential")
            log "开始差异文件备份..."
            for i in "${!SOURCE_DIRS[@]}"; do
                local source_dir="${SOURCE_DIRS[$i]}"
                local backup_name="data$i"
                if [ -d "$source_dir" ]; then
                    differential_backup "$source_dir" "$backup_name"
                else
                    log "源目录不存在: $source_dir"
                fi
            done
            ;;
        "restore")
            restore_files "$2" "$3"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "monitor")
            monitor_backup_status
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