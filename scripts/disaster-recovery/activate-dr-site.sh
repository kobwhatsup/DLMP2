#!/bin/bash

# DLMP 灾备中心激活脚本
# 自动化灾备环境启动和切换流程

set -e

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="/var/log/dlmp/dr-activation.log"

# 环境配置
PRIMARY_REGION="${PRIMARY_REGION:-ap-southeast-1}"
DR_REGION="${DR_REGION:-ap-northeast-1}"
DR_NAMESPACE="${DR_NAMESPACE:-dlmp-disaster-recovery}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

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

# 发送通知
send_notification() {
    local message="$1"
    local level="${2:-info}"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"level\":\"$level\",\"message\":\"$message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            2>/dev/null || true
    fi
}

# 检查先决条件
check_prerequisites() {
    log_info "检查灾备激活先决条件..."
    
    # 检查kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl未安装"
        exit 1
    fi
    
    # 检查AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI未安装"
        exit 1
    fi
    
    # 检查灾备集群连接
    if ! kubectl cluster-info --context="dr-cluster" &> /dev/null; then
        log_error "无法连接到灾备集群"
        exit 1
    fi
    
    # 检查必要的Secret
    local required_secrets=("dlmp-database-secret" "dlmp-redis-secret" "backup-s3-secret")
    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret "$secret" -n "$DR_NAMESPACE" --context="dr-cluster" &> /dev/null; then
            log_error "灾备集群缺少必要的Secret: $secret"
            exit 1
        fi
    done
    
    log_info "先决条件检查完成"
}

# 评估主站点状态
assess_primary_site() {
    log_info "评估主站点状态..."
    
    local primary_status="unknown"
    
    # 尝试连接主站点
    if kubectl cluster-info --context="primary-cluster" &> /dev/null; then
        if kubectl get pods -n dlmp-production --context="primary-cluster" &> /dev/null; then
            primary_status="available"
            log_info "主站点可达，建议评估是否真的需要灾备切换"
        else
            primary_status="partial"
            log_warn "主站点部分可用，建议进一步评估"
        fi
    else
        primary_status="unavailable"
        log_error "主站点不可达，确认需要灾备切换"
    fi
    
    echo "$primary_status"
}

# 准备灾备环境
prepare_dr_environment() {
    log_info "准备灾备环境..."
    
    # 切换到灾备集群上下文
    kubectl config use-context dr-cluster
    
    # 确保命名空间存在
    kubectl create namespace "$DR_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # 部署基础设施组件
    log_info "部署存储配置..."
    kubectl apply -f "$PROJECT_ROOT/k8s/storage.yaml" -n "$DR_NAMESPACE"
    
    log_info "部署配置和密钥..."
    kubectl apply -f "$PROJECT_ROOT/k8s/configmap.yaml" -n "$DR_NAMESPACE"
    kubectl apply -f "$PROJECT_ROOT/k8s/secret.yaml" -n "$DR_NAMESPACE"
    
    # 等待存储就绪
    log_info "等待存储就绪..."
    kubectl wait --for=condition=Ready pvc --all -n "$DR_NAMESPACE" --timeout=300s
    
    log_info "灾备环境准备完成"
}

# 恢复数据库
restore_database() {
    log_info "开始数据库恢复..."
    
    # 部署MySQL StatefulSet
    kubectl apply -f "$PROJECT_ROOT/k8s/statefulset.yaml" -n "$DR_NAMESPACE"
    
    # 等待MySQL启动
    log_info "等待MySQL服务启动..."
    kubectl wait --for=condition=Ready pod/mysql-master-0 -n "$DR_NAMESPACE" --timeout=600s
    
    # 从最新备份恢复数据
    log_info "从备份恢复数据库..."
    
    # 创建恢复Job
    cat << EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: database-restore-$(date +%s)
  namespace: $DR_NAMESPACE
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: restore
          image: mysql:8.0
          command: ["/bin/bash", "-c"]
          args:
            - |
              set -e
              # 下载最新备份
              aws s3 cp s3://dlmp-backup/latest/full/ /tmp/backup/ --recursive
              
              # 找到最新的备份文件
              BACKUP_FILE=\$(find /tmp/backup -name "*.sql.gz" -type f | sort | tail -1)
              
              if [ -n "\$BACKUP_FILE" ]; then
                echo "恢复备份文件: \$BACKUP_FILE"
                zcat "\$BACKUP_FILE" | mysql -h mysql-master -u root -p\$MYSQL_ROOT_PASSWORD
                echo "数据库恢复完成"
              else
                echo "未找到备份文件"
                exit 1
              fi
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: dlmp-database-secret
                  key: DB_ROOT_PASSWORD
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: backup-s3-secret
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: backup-s3-secret
                  key: secret-access-key
          volumeMounts:
            - name: temp-storage
              mountPath: /tmp
      volumes:
        - name: temp-storage
          emptyDir:
            sizeLimit: 10Gi
EOF
    
    # 等待恢复完成
    kubectl wait --for=condition=Complete job -l app=database-restore -n "$DR_NAMESPACE" --timeout=1800s
    
    log_info "数据库恢复完成"
}

# 部署应用服务
deploy_application_services() {
    log_info "部署应用服务..."
    
    # 部署Redis集群
    kubectl apply -f "$PROJECT_ROOT/k8s/statefulset.yaml" -n "$DR_NAMESPACE"
    
    # 等待Redis启动
    log_info "等待Redis集群启动..."
    for i in {0..5}; do
        kubectl wait --for=condition=Ready pod/redis-$i -n "$DR_NAMESPACE" --timeout=300s
    done
    
    # 初始化Redis集群
    kubectl wait --for=condition=Complete job/redis-cluster-init -n "$DR_NAMESPACE" --timeout=300s
    
    # 部署应用
    kubectl apply -f "$PROJECT_ROOT/k8s/deployment.yaml" -n "$DR_NAMESPACE"
    kubectl apply -f "$PROJECT_ROOT/k8s/service.yaml" -n "$DR_NAMESPACE"
    
    # 等待应用启动
    log_info "等待应用服务启动..."
    kubectl wait --for=condition=Available deployment/dlmp-backend -n "$DR_NAMESPACE" --timeout=600s
    kubectl wait --for=condition=Available deployment/dlmp-frontend -n "$DR_NAMESPACE" --timeout=300s
    
    log_info "应用服务部署完成"
}

# 配置网络切换
configure_network_switching() {
    log_info "配置网络切换..."
    
    # 获取LoadBalancer IP
    local external_ip=""
    local retry_count=0
    while [ -z "$external_ip" ] && [ $retry_count -lt 30 ]; do
        external_ip=$(kubectl get svc dlmp-external -n "$DR_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
        if [ -z "$external_ip" ] || [ "$external_ip" = "null" ]; then
            log_info "等待LoadBalancer IP分配... ($retry_count/30)"
            sleep 10
            retry_count=$((retry_count + 1))
        fi
    done
    
    if [ -n "$external_ip" ] && [ "$external_ip" != "null" ]; then
        log_info "LoadBalancer IP: $external_ip"
        
        # 记录IP用于DNS切换
        echo "DR_EXTERNAL_IP=$external_ip" > "/tmp/dr-network-info.env"
        
        log_warn "请手动更新DNS记录:"
        log_warn "  dlmp.example.com -> $external_ip"
        log_warn "  admin.dlmp.example.com -> $external_ip"
        
    else
        log_error "无法获取LoadBalancer IP"
        return 1
    fi
}

# 验证服务可用性
verify_services() {
    log_info "验证服务可用性..."
    
    # 获取服务端点
    local backend_ip=$(kubectl get svc dlmp-backend -n "$DR_NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    local frontend_ip=$(kubectl get svc dlmp-frontend -n "$DR_NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    # 创建验证Pod
    kubectl run verification-pod --rm -i --restart=Never --image=curlimages/curl -- sh -c "
        echo '验证后端服务...'
        curl -f http://$backend_ip:8080/actuator/health || exit 1
        
        echo '验证前端服务...'
        curl -f http://$frontend_ip:80/health || exit 1
        
        echo '验证数据库连接...'
        curl -f http://$backend_ip:8080/actuator/health/db || exit 1
        
        echo '所有服务验证通过'
    "
    
    if [ $? -eq 0 ]; then
        log_info "服务可用性验证通过"
        return 0
    else
        log_error "服务可用性验证失败"
        return 1
    fi
}

# 生成状态报告
generate_status_report() {
    local activation_time="$1"
    local report_file="/tmp/dr-activation-report.json"
    
    log_info "生成状态报告..."
    
    # 收集系统状态
    local pod_count=$(kubectl get pods -n "$DR_NAMESPACE" --no-headers | wc -l)
    local ready_pods=$(kubectl get pods -n "$DR_NAMESPACE" --no-headers | grep Running | wc -l)
    local service_count=$(kubectl get svc -n "$DR_NAMESPACE" --no-headers | wc -l)
    
    # 生成JSON报告
    cat > "$report_file" << EOF
{
  "activation_time": "$activation_time",
  "completion_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "dr_region": "$DR_REGION",
  "namespace": "$DR_NAMESPACE",
  "status": "active",
  "services": {
    "total_pods": $pod_count,
    "ready_pods": $ready_pods,
    "services": $service_count
  },
  "verification": {
    "database": "✓",
    "backend": "✓",
    "frontend": "✓",
    "redis": "✓"
  },
  "network": {
    "loadbalancer_ip": "$(kubectl get svc dlmp-external -n "$DR_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo 'pending')"
  },
  "next_steps": [
    "更新DNS记录指向灾备环境",
    "通知用户服务已切换到灾备中心",
    "持续监控灾备环境状态",
    "评估主站点恢复可能性"
  ]
}
EOF
    
    log_info "状态报告已生成: $report_file"
    cat "$report_file"
}

# 清理资源
cleanup_failed_activation() {
    log_warn "清理失败的灾备激活资源..."
    
    # 删除不完整的部署
    kubectl delete deployment --all -n "$DR_NAMESPACE" --ignore-not-found=true
    kubectl delete job --all -n "$DR_NAMESPACE" --ignore-not-found=true
    
    log_info "清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $0 [选项] [命令]

命令:
  activate    激活灾备环境 (默认)
  verify      验证灾备环境状态
  cleanup     清理灾备环境
  status      查看灾备状态

选项:
  -h, --help              显示帮助信息
  -n, --namespace NAME    指定命名空间 (默认: dlmp-disaster-recovery)
  -r, --region REGION     指定灾备区域 (默认: ap-northeast-1)
  -f, --force             强制激活，跳过主站点状态检查
  -v, --verbose           详细输出

示例:
  $0 activate                                # 激活灾备环境
  $0 verify                                  # 验证灾备状态
  $0 activate -n dlmp-dr -r us-west-2      # 指定命名空间和区域
  $0 cleanup                                # 清理灾备环境

注意:
  - 灾备激活是重要操作，请确保真的需要切换
  - 激活后需要手动更新DNS记录
  - 建议在激活前先评估主站点状态
EOF
}

# 主函数
main() {
    local command="${1:-activate}"
    local force_activation=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                DR_NAMESPACE="$2"
                shift 2
                ;;
            -r|--region)
                DR_REGION="$2"
                shift 2
                ;;
            -f|--force)
                force_activation=true
                shift
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            activate|verify|cleanup|status)
                command="$1"
                shift
                ;;
            *)
                echo "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    case "$command" in
        "activate")
            local activation_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
            
            log_info "开始灾备环境激活..."
            log_info "激活时间: $activation_time"
            log_info "目标区域: $DR_REGION"
            log_info "目标命名空间: $DR_NAMESPACE"
            
            send_notification "开始灾备环境激活" "warning"
            
            # 检查先决条件
            check_prerequisites
            
            # 评估主站点状态
            if [ "$force_activation" = false ]; then
                local primary_status=$(assess_primary_site)
                if [ "$primary_status" = "available" ]; then
                    log_warn "主站点仍然可用，建议重新评估是否需要灾备切换"
                    read -p "确定继续激活灾备环境？(yes/no): " -r
                    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                        log_info "灾备激活已取消"
                        exit 0
                    fi
                fi
            fi
            
            # 执行激活流程
            if prepare_dr_environment && \
               restore_database && \
               deploy_application_services && \
               configure_network_switching && \
               verify_services; then
                
                log_info "灾备环境激活成功！"
                generate_status_report "$activation_time"
                send_notification "灾备环境激活成功" "success"
                
            else
                log_error "灾备环境激活失败"
                cleanup_failed_activation
                send_notification "灾备环境激活失败" "error"
                exit 1
            fi
            ;;
            
        "verify")
            log_info "验证灾备环境状态..."
            verify_services
            ;;
            
        "cleanup")
            log_info "清理灾备环境..."
            kubectl delete namespace "$DR_NAMESPACE" --ignore-not-found=true
            log_info "灾备环境清理完成"
            ;;
            
        "status")
            log_info "灾备环境状态:"
            kubectl get all -n "$DR_NAMESPACE" 2>/dev/null || echo "灾备环境未激活"
            ;;
            
        *)
            echo "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"