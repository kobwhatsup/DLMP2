#!/bin/bash

# DLMP Kubernetes部署脚本
# 一键部署DLMP系统到Kubernetes集群

set -e

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$K8S_DIR")"

NAMESPACE_PROD="dlmp-production"
NAMESPACE_STAGING="dlmp-staging"
NAMESPACE_MONITORING="dlmp-monitoring"

LOG_FILE="/tmp/dlmp-k8s-deploy.log"
KUBECONFIG=${KUBECONFIG:-~/.kube/config}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查先决条件
check_prerequisites() {
    log_info "检查部署先决条件..."
    
    # 检查kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl未安装，请先安装kubectl"
        exit 1
    fi
    
    # 检查kubeconfig
    if [ ! -f "$KUBECONFIG" ]; then
        log_error "kubeconfig文件不存在: $KUBECONFIG"
        exit 1
    fi
    
    # 检查集群连接
    if ! kubectl cluster-info &> /dev/null; then
        log_error "无法连接到Kubernetes集群"
        exit 1
    fi
    
    # 检查集群版本
    local k8s_version=$(kubectl version --short 2>/dev/null | grep "Server Version" | awk '{print $3}' | sed 's/v//')
    local major_version=$(echo "$k8s_version" | cut -d. -f1)
    local minor_version=$(echo "$k8s_version" | cut -d. -f2)
    
    if [ "$major_version" -lt 1 ] || ([ "$major_version" -eq 1 ] && [ "$minor_version" -lt 20 ]); then
        log_warn "Kubernetes版本过低 ($k8s_version)，建议使用1.20+版本"
    fi
    
    # 检查必要的CRD
    local required_crds=(
        "servicemonitors.monitoring.coreos.com"
        "prometheusrules.monitoring.coreos.com"
        "volumesnapshots.snapshot.storage.k8s.io"
    )
    
    for crd in "${required_crds[@]}"; do
        if ! kubectl get crd "$crd" &> /dev/null; then
            log_warn "CRD $crd 不存在，某些功能可能不可用"
        fi
    done
    
    log_info "先决条件检查完成"
}

# 检查节点资源
check_node_resources() {
    log_info "检查集群节点资源..."
    
    local total_cpu=0
    local total_memory=0
    local node_count=0
    
    while IFS= read -r line; do
        local cpu=$(echo "$line" | awk '{print $2}' | sed 's/m//')
        local memory=$(echo "$line" | awk '{print $3}' | sed 's/Ki//')
        
        total_cpu=$((total_cpu + cpu))
        total_memory=$((total_memory + memory))
        node_count=$((node_count + 1))
    done < <(kubectl top nodes --no-headers 2>/dev/null || echo "1000m 4000000Ki")
    
    local memory_gb=$((total_memory / 1024 / 1024))
    
    log_info "集群资源概况:"
    log_info "  节点数量: $node_count"
    log_info "  总CPU: ${total_cpu}m"
    log_info "  总内存: ${memory_gb}Gi"
    
    # 检查资源是否足够
    if [ $total_cpu -lt 8000 ]; then
        log_warn "集群CPU资源可能不足 (建议至少8核)"
    fi
    
    if [ $memory_gb -lt 16 ]; then
        log_warn "集群内存资源可能不足 (建议至少16Gi)"
    fi
}

# 创建命名空间
create_namespaces() {
    log_info "创建命名空间..."
    
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    
    # 等待命名空间创建完成
    kubectl wait --for=condition=Active namespace/$NAMESPACE_PROD --timeout=60s
    kubectl wait --for=condition=Active namespace/$NAMESPACE_STAGING --timeout=60s
    kubectl wait --for=condition=Active namespace/$NAMESPACE_MONITORING --timeout=60s
    
    log_info "命名空间创建完成"
}

# 部署存储配置
deploy_storage() {
    log_info "部署存储配置..."
    
    kubectl apply -f "$K8S_DIR/storage.yaml"
    
    # 等待StorageClass创建
    kubectl wait --for=condition=Ready storageclass/fast-ssd --timeout=60s || true
    kubectl wait --for=condition=Ready storageclass/standard --timeout=60s || true
    
    log_info "存储配置部署完成"
}

# 部署配置和密钥
deploy_configs_and_secrets() {
    log_info "部署配置文件和密钥..."
    
    # 提示用户检查敏感信息
    log_warn "请确保已经更新了Secret中的敏感信息（密码、密钥等）"
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    kubectl apply -f "$K8S_DIR/secret.yaml"
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    
    log_info "配置文件和密钥部署完成"
}

# 部署有状态服务
deploy_stateful_services() {
    log_info "部署有状态服务（MySQL、Redis）..."
    
    kubectl apply -f "$K8S_DIR/statefulset.yaml"
    
    # 等待MySQL主服务启动
    log_info "等待MySQL主服务启动..."
    kubectl wait --for=condition=Ready pod/mysql-master-0 -n $NAMESPACE_PROD --timeout=300s
    
    # 等待Redis集群启动
    log_info "等待Redis集群启动..."
    for i in {0..5}; do
        kubectl wait --for=condition=Ready pod/redis-$i -n $NAMESPACE_PROD --timeout=300s
    done
    
    # 检查Redis集群初始化Job
    log_info "检查Redis集群初始化状态..."
    kubectl wait --for=condition=Complete job/redis-cluster-init -n $NAMESPACE_PROD --timeout=300s
    
    log_info "有状态服务部署完成"
}

# 部署应用服务
deploy_application_services() {
    log_info "部署应用服务..."
    
    kubectl apply -f "$K8S_DIR/deployment.yaml"
    kubectl apply -f "$K8S_DIR/service.yaml"
    
    # 等待后端应用启动
    log_info "等待后端应用启动..."
    kubectl wait --for=condition=Available deployment/dlmp-backend -n $NAMESPACE_PROD --timeout=300s
    
    # 等待前端应用启动
    log_info "等待前端应用启动..."
    kubectl wait --for=condition=Available deployment/dlmp-frontend -n $NAMESPACE_PROD --timeout=300s
    
    log_info "应用服务部署完成"
}

# 部署监控系统
deploy_monitoring() {
    log_info "部署监控系统..."
    
    # 检查是否安装了Prometheus Operator
    if kubectl get crd prometheuses.monitoring.coreos.com &> /dev/null; then
        log_info "检测到Prometheus Operator，部署ServiceMonitor..."
        kubectl apply -f "$K8S_DIR/service.yaml" | grep -E "(servicemonitor|podmonitor)" || true
    else
        log_warn "未检测到Prometheus Operator，跳过ServiceMonitor部署"
    fi
    
    # 部署监控相关的ConfigMap
    kubectl apply -f "$K8S_DIR/configmap.yaml" | grep -E "prometheus-config|filebeat-config" || true
    
    log_info "监控系统配置完成"
}

# 验证部署状态
verify_deployment() {
    log_info "验证部署状态..."
    
    local failed_checks=0
    
    # 检查Pod状态
    log_info "检查Pod状态..."
    local pods_not_ready=$(kubectl get pods -n $NAMESPACE_PROD --no-headers | grep -v Running | grep -v Completed | wc -l)
    if [ $pods_not_ready -gt 0 ]; then
        log_error "有 $pods_not_ready 个Pod未就绪"
        kubectl get pods -n $NAMESPACE_PROD | grep -v Running | grep -v Completed
        failed_checks=$((failed_checks + 1))
    else
        log_info "所有Pod已就绪"
    fi
    
    # 检查服务状态
    log_info "检查服务状态..."
    local services=$(kubectl get svc -n $NAMESPACE_PROD --no-headers | wc -l)
    log_info "发现 $services 个服务"
    
    # 检查存储状态
    log_info "检查存储状态..."
    local pvcs_not_bound=$(kubectl get pvc -n $NAMESPACE_PROD --no-headers | grep -v Bound | wc -l)
    if [ $pvcs_not_bound -gt 0 ]; then
        log_warn "有 $pvcs_not_bound 个PVC未绑定"
        kubectl get pvc -n $NAMESPACE_PROD | grep -v Bound
    else
        log_info "所有PVC已绑定"
    fi
    
    # 健康检查
    log_info "执行应用健康检查..."
    if kubectl get svc dlmp-backend -n $NAMESPACE_PROD &> /dev/null; then
        local backend_ip=$(kubectl get svc dlmp-backend -n $NAMESPACE_PROD -o jsonpath='{.spec.clusterIP}')
        if kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- curl -f "http://$backend_ip:8080/actuator/health" &> /dev/null; then
            log_info "后端应用健康检查通过"
        else
            log_error "后端应用健康检查失败"
            failed_checks=$((failed_checks + 1))
        fi
    fi
    
    if [ $failed_checks -eq 0 ]; then
        log_info "所有验证检查通过"
        return 0
    else
        log_error "有 $failed_checks 项检查失败"
        return 1
    fi
}

# 显示部署信息
show_deployment_info() {
    log_info "部署完成！访问信息如下："
    
    echo ""
    echo "==================== 应用访问信息 ===================="
    
    # 获取Ingress信息
    if kubectl get ingress dlmp-ingress -n $NAMESPACE_PROD &> /dev/null; then
        local hosts=$(kubectl get ingress dlmp-ingress -n $NAMESPACE_PROD -o jsonpath='{.spec.rules[*].host}' | tr ' ' '\n' | head -3)
        echo -e "${GREEN}应用访问地址:${NC}"
        for host in $hosts; do
            echo "  https://$host"
        done
    fi
    
    # 获取LoadBalancer信息
    if kubectl get svc dlmp-external -n $NAMESPACE_PROD &> /dev/null; then
        local external_ip=$(kubectl get svc dlmp-external -n $NAMESPACE_PROD -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ -n "$external_ip" ] && [ "$external_ip" != "null" ]; then
            echo -e "${GREEN}LoadBalancer IP:${NC} $external_ip"
        else
            log_warn "LoadBalancer IP尚未分配，请稍后检查"
        fi
    fi
    
    echo ""
    echo "==================== 服务状态检查 ===================="
    echo -e "${YELLOW}检查Pod状态:${NC}"
    echo "  kubectl get pods -n $NAMESPACE_PROD"
    
    echo -e "${YELLOW}检查服务状态:${NC}"
    echo "  kubectl get svc -n $NAMESPACE_PROD"
    
    echo -e "${YELLOW}查看应用日志:${NC}"
    echo "  kubectl logs -f deployment/dlmp-backend -n $NAMESPACE_PROD"
    echo "  kubectl logs -f deployment/dlmp-frontend -n $NAMESPACE_PROD"
    
    echo ""
    echo "==================== 管理命令 ===================="
    echo -e "${YELLOW}扩容应用:${NC}"
    echo "  kubectl scale deployment dlmp-backend --replicas=5 -n $NAMESPACE_PROD"
    
    echo -e "${YELLOW}更新应用:${NC}"
    echo "  kubectl set image deployment/dlmp-backend dlmp-backend=new-image:tag -n $NAMESPACE_PROD"
    
    echo -e "${YELLOW}回滚应用:${NC}"
    echo "  kubectl rollout undo deployment/dlmp-backend -n $NAMESPACE_PROD"
    
    echo -e "${YELLOW}暴露调试端口:${NC}"
    echo "  kubectl port-forward svc/dlmp-backend 8080:8080 -n $NAMESPACE_PROD"
    
    echo ""
    echo "==================== 监控访问 ===================="
    if kubectl get svc -n $NAMESPACE_MONITORING &> /dev/null; then
        echo -e "${GREEN}监控服务访问 (需要port-forward):${NC}"
        echo "  kubectl port-forward svc/grafana 3000:3000 -n $NAMESPACE_MONITORING"
        echo "  kubectl port-forward svc/prometheus 9090:9090 -n $NAMESPACE_MONITORING"
        echo "  kubectl port-forward svc/kibana 5601:5601 -n $NAMESPACE_MONITORING"
    fi
    
    echo ""
}

# 清理部署
cleanup_deployment() {
    log_warn "开始清理DLMP部署..."
    
    read -p "确定要删除所有DLMP资源吗？这个操作不可逆！(yes/no): " -r
    if [ "$REPLY" != "yes" ]; then
        log_info "清理操作已取消"
        return 0
    fi
    
    # 删除应用
    kubectl delete -f "$K8S_DIR/service.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/deployment.yaml" --ignore-not-found=true
    
    # 删除有状态服务
    kubectl delete -f "$K8S_DIR/statefulset.yaml" --ignore-not-found=true
    
    # 删除配置
    kubectl delete -f "$K8S_DIR/configmap.yaml" --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/secret.yaml" --ignore-not-found=true
    
    # 删除存储（可选）
    read -p "是否删除存储资源（PVC）？这将导致数据丢失！(yes/no): " -r
    if [ "$REPLY" = "yes" ]; then
        kubectl delete -f "$K8S_DIR/storage.yaml" --ignore-not-found=true
    fi
    
    # 删除命名空间
    read -p "是否删除命名空间？(yes/no): " -r
    if [ "$REPLY" = "yes" ]; then
        kubectl delete namespace $NAMESPACE_PROD --ignore-not-found=true
        kubectl delete namespace $NAMESPACE_STAGING --ignore-not-found=true
        kubectl delete namespace $NAMESPACE_MONITORING --ignore-not-found=true
    fi
    
    log_info "清理完成"
}

# 更新部署
update_deployment() {
    local component="$1"
    
    log_info "更新部署组件: $component"
    
    case "$component" in
        "app"|"application")
            kubectl apply -f "$K8S_DIR/deployment.yaml"
            kubectl rollout restart deployment/dlmp-backend -n $NAMESPACE_PROD
            kubectl rollout restart deployment/dlmp-frontend -n $NAMESPACE_PROD
            ;;
        "config")
            kubectl apply -f "$K8S_DIR/configmap.yaml"
            kubectl rollout restart deployment/dlmp-backend -n $NAMESPACE_PROD
            ;;
        "storage")
            kubectl apply -f "$K8S_DIR/storage.yaml"
            ;;
        "all")
            kubectl apply -f "$K8S_DIR/"
            ;;
        *)
            log_error "未知的组件: $component"
            echo "支持的组件: app, config, storage, all"
            exit 1
            ;;
    esac
    
    log_info "更新完成"
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "开始部署DLMP到Kubernetes集群..."
            log_info "日志文件: $LOG_FILE"
            
            check_prerequisites
            check_node_resources
            create_namespaces
            deploy_storage
            deploy_configs_and_secrets
            deploy_stateful_services
            deploy_application_services
            deploy_monitoring
            
            if verify_deployment; then
                show_deployment_info
                log_info "DLMP部署成功！"
            else
                log_error "部署验证失败，请检查日志"
                exit 1
            fi
            ;;
        "verify")
            verify_deployment
            ;;
        "cleanup")
            cleanup_deployment
            ;;
        "update")
            update_deployment "${2:-all}"
            ;;
        "status")
            log_info "DLMP集群状态:"
            kubectl get all -n $NAMESPACE_PROD
            echo ""
            kubectl get pvc -n $NAMESPACE_PROD
            ;;
        "logs")
            local component="${2:-backend}"
            kubectl logs -f deployment/dlmp-$component -n $NAMESPACE_PROD
            ;;
        "shell")
            local pod=$(kubectl get pods -n $NAMESPACE_PROD -l app=dlmp-backend -o jsonpath='{.items[0].metadata.name}')
            kubectl exec -it $pod -n $NAMESPACE_PROD -- /bin/bash
            ;;
        *)
            echo "用法: $0 {deploy|verify|cleanup|update|status|logs|shell}"
            echo ""
            echo "命令说明:"
            echo "  deploy  - 部署DLMP系统"
            echo "  verify  - 验证部署状态"
            echo "  cleanup - 清理部署"
            echo "  update  - 更新部署 [component]"
            echo "  status  - 查看集群状态"
            echo "  logs    - 查看应用日志 [component]"
            echo "  shell   - 进入应用容器"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"