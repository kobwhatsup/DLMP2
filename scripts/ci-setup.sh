#!/bin/bash

# CI/CD环境设置脚本
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

# 检查必要的工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    local tools=("docker" "docker-compose" "node" "npm" "java" "curl" "git")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少以下工具: ${missing_tools[*]}"
        log_info "请先安装这些工具后再运行此脚本"
        exit 1
    fi
    
    log_success "所有依赖工具检查通过"
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 创建.env文件（如果不存在）
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# CI/CD环境配置
NODE_ENV=test
SPRING_PROFILES_ACTIVE=test

# 数据库配置
DB_HOST=localhost
DB_PORT=3307
DB_NAME=dlmp_test
DB_USER=dlmp_test
DB_PASSWORD=dlmp_test_pass

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6380

# 容器镜像仓库
CONTAINER_REGISTRY=registry.example.com
REGISTRY_USERNAME=
REGISTRY_PASSWORD=

# 通知配置
SLACK_WEBHOOK_URL=
NOTIFICATION_EMAIL=

# 监控配置
GRAFANA_URL=
GRAFANA_TOKEN=

# 备份配置
BACKUP_BUCKET=dlmp-backups
EOF
        log_success "创建了默认的.env文件"
    else
        log_info ".env文件已存在，跳过创建"
    fi
}

# 创建测试数据库初始化脚本
setup_test_data() {
    log_info "创建测试数据初始化脚本..."
    
    mkdir -p scripts
    
    cat > scripts/test-data.sql << 'EOF'
-- 测试数据初始化脚本
-- 创建测试用户
INSERT INTO users (id, username, password, real_name, phone, email, user_type, status, create_time) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8ioctKk7Z2kE1CbV6GclMExl2dVZi', '系统管理员', '13800138000', 'admin@dlmp.com', 3, 1, NOW()),
(2, 'mediator1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8ioctKk7Z2kE1CbV6GclMExl2dVZi', '调解员1', '13800138001', 'mediator1@dlmp.com', 2, 1, NOW()),
(3, 'client1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8ioctKk7Z2kE1CbV6GclMExl2dVZi', '客户1', '13800138002', 'client1@dlmp.com', 1, 1, NOW());

-- 创建测试案件
INSERT INTO cases (id, case_number, borrower_name, debtor_id_card, debt_amount, phone, status, create_time, create_user_id) VALUES
(1, 'TEST_CASE_001', '张三', '110101199001011234', 100000.00, '13800138003', 1, NOW(), 1),
(2, 'TEST_CASE_002', '李四', '110101199002022345', 200000.00, '13800138004', 2, NOW(), 1),
(3, 'TEST_CASE_003', '王五', '110101199003033456', 150000.00, '13800138005', 1, NOW(), 1);

-- 创建测试调解记录
INSERT INTO mediation_records (id, case_id, mediator_id, status, start_time, create_time) VALUES
(1, 1, 2, 1, NOW(), NOW()),
(2, 2, 2, 2, NOW(), NOW());
EOF
    
    log_success "测试数据脚本创建完成"
}

# 创建监控配置
setup_monitoring() {
    log_info "创建监控配置..."
    
    mkdir -p monitoring/grafana/{dashboards,datasources}
    
    # Prometheus配置
    cat > monitoring/prometheus-test.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'dlmp-backend'
    static_configs:
      - targets: ['backend-test:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s

  - job_name: 'dlmp-frontend'
    static_configs:
      - targets: ['frontend-test:80']
    scrape_interval: 30s

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-test:3306']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-test:6379']
EOF

    # Grafana数据源配置
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus-test:9090
    isDefault: true
EOF

    log_success "监控配置创建完成"
}

# 创建Nginx测试配置
setup_nginx_config() {
    log_info "创建Nginx测试配置..."
    
    mkdir -p docker
    
    cat > docker/nginx-test.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend-test:80;
    }
    
    upstream backend {
        server backend-test:8080;
    }
    
    server {
        listen 80;
        
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF
    
    log_success "Nginx测试配置创建完成"
}

# 创建Kubernetes配置
setup_k8s_configs() {
    log_info "创建Kubernetes配置..."
    
    mkdir -p k8s/helm/dlmp-frontend k8s/helm/dlmp-backend
    
    # Frontend Helm Chart
    cat > k8s/helm/dlmp-frontend/Chart.yaml << 'EOF'
apiVersion: v2
name: dlmp-frontend
description: DLMP Frontend Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"
EOF

    cat > k8s/helm/dlmp-frontend/values.yaml << 'EOF'
replicaCount: 1

image:
  repository: dlmp/dlmp-frontend
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: dlmp.local
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
EOF

    # Backend Helm Chart
    cat > k8s/helm/dlmp-backend/Chart.yaml << 'EOF'
apiVersion: v2
name: dlmp-backend
description: DLMP Backend Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"
EOF

    cat > k8s/helm/dlmp-backend/values.yaml << 'EOF'
replicaCount: 1

image:
  repository: dlmp/dlmp-backend
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: api.dlmp.local
      paths:
        - path: /
          pathType: Prefix

env:
  - name: SPRING_PROFILES_ACTIVE
    value: "kubernetes"
  - name: SPRING_DATASOURCE_URL
    valueFrom:
      secretKeyRef:
        name: dlmp-secrets
        key: database-url
  - name: SPRING_REDIS_HOST
    value: "redis"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
EOF

    log_success "Kubernetes配置创建完成"
}

# 创建CI/CD脚本
setup_ci_scripts() {
    log_info "创建CI/CD辅助脚本..."
    
    # 测试启动脚本
    cat > scripts/start-test-env.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 启动测试环境..."

# 清理旧的容器
docker-compose -f docker-compose.test.yml down -v

# 构建并启动服务
docker-compose -f docker-compose.test.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 检查服务健康状态..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:8080/actuator/health || exit 1

echo "✅ 测试环境启动成功"
echo "📊 监控面板: http://localhost:3001 (admin/test123)"
echo "📧 邮件测试: http://localhost:8025"
echo "💾 数据库管理: http://localhost:8081"
EOF

    chmod +x scripts/start-test-env.sh

    # 测试停止脚本
    cat > scripts/stop-test-env.sh << 'EOF'
#!/bin/bash
set -e

echo "🛑 停止测试环境..."

docker-compose -f docker-compose.test.yml down -v

echo "✅ 测试环境已停止"
EOF

    chmod +x scripts/stop-test-env.sh

    # 完整测试脚本
    cat > scripts/run-full-tests.sh << 'EOF'
#!/bin/bash
set -e

echo "🧪 运行完整测试套件..."

# 启动测试环境
./scripts/start-test-env.sh

# 等待服务完全启动
sleep 60

# 运行前端测试
echo "🎯 运行前端测试..."
cd frontend
npm test
npm run test:e2e
npm run test:performance
cd ..

# 运行后端测试
echo "🎯 运行后端测试..."
cd backend
./gradlew test
cd ..

# 停止测试环境
./scripts/stop-test-env.sh

echo "✅ 所有测试完成"
EOF

    chmod +x scripts/run-full-tests.sh

    log_success "CI/CD脚本创建完成"
}

# 验证配置
validate_setup() {
    log_info "验证配置..."
    
    local errors=0
    
    # 检查文件是否存在
    local required_files=(
        ".github/workflows/ci.yml"
        ".github/workflows/cd.yml"
        ".github/workflows/release.yml"
        "docker-compose.test.yml"
        "scripts/test-data.sql"
        "monitoring/prometheus-test.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少文件: $file"
            ((errors++))
        fi
    done
    
    # 检查Docker Compose配置
    if ! docker-compose -f docker-compose.test.yml config > /dev/null 2>&1; then
        log_error "docker-compose.test.yml 配置有误"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "配置验证通过"
    else
        log_error "发现 $errors 个配置错误"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 DLMP CI/CD 环境设置"
    echo "========================"
    
    check_dependencies
    setup_environment
    setup_test_data
    setup_monitoring
    setup_nginx_config
    setup_k8s_configs
    setup_ci_scripts
    validate_setup
    
    echo ""
    log_success "CI/CD 环境设置完成！"
    echo ""
    log_info "下一步："
    echo "  1. 配置GitHub Secrets (见文档)"
    echo "  2. 运行 './scripts/start-test-env.sh' 测试环境"
    echo "  3. 提交代码触发CI流水线"
    echo ""
    log_info "有用的命令："
    echo "  • 启动测试环境: ./scripts/start-test-env.sh"
    echo "  • 停止测试环境: ./scripts/stop-test-env.sh"
    echo "  • 运行完整测试: ./scripts/run-full-tests.sh"
}

# 运行主函数
main "$@"