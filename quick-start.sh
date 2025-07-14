#!/bin/bash

# DLMP项目快速启动脚本（开发预览模式）
# 用于快速预览前端页面，无需完整后端服务

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

# 检查Node.js环境
check_node() {
    log_info "检查Node.js环境..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装，请先安装npm"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js版本过低，需要Node.js 18+，当前版本: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js环境检查通过，版本: $(node -v)"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        log_info "首次运行，安装依赖包..."
        npm install
    else
        log_info "依赖包已存在，跳过安装"
    fi
    
    cd ..
    log_success "前端依赖安装完成"
}

# 创建开发模式配置
create_dev_config() {
    log_info "创建开发模式配置..."
    
    # 创建前端开发环境配置
    cat > frontend/.env.development << EOF
# 开发环境配置
VITE_APP_TITLE=个贷不良资产分散诉讼调解平台
VITE_API_BASE_URL=http://localhost:8080/api
VITE_UPLOAD_URL=http://localhost:8080/api/file/upload
VITE_WEBSOCKET_URL=ws://localhost:8080/ws

# 开发模式标识
VITE_DEV_MODE=true
VITE_MOCK_DATA=true

# 版本信息
VITE_APP_VERSION=1.0.0
VITE_BUILD_TIME=$(date '+%Y-%m-%d %H:%M:%S')
EOF

    log_success "开发配置创建完成"
}

# 启动前端开发服务器
start_frontend() {
    log_info "启动前端开发服务器..."
    
    cd frontend
    
    # 后台启动前端服务
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    cd ..
    
    # 等待前端服务启动
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 >/dev/null 2>&1; then
            log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
            return 0
        fi
        sleep 2
        if [ $((i % 5)) -eq 0 ]; then
            log_info "等待前端服务启动... ($i/30)"
        fi
    done
    
    log_error "前端服务启动失败或超时"
    return 1
}

# 启动简单后端Mock服务
start_mock_backend() {
    log_info "启动Mock后端服务..."
    
    # 创建简单的Express Mock服务
    mkdir -p mock-backend
    cd mock-backend
    
    if [ ! -f "package.json" ]; then
        # 初始化Mock后端项目
        cat > package.json << EOF
{
  "name": "dlmp-mock-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

        # 创建Mock服务器
        cat > server.js << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// 中间件
app.use(cors());
app.use(express.json());

// Mock数据
const mockUsers = [
  { id: 1, username: 'admin', name: '管理员', role: 'admin', status: 'active' },
  { id: 2, username: 'user1', name: '调解员1', role: 'mediator', status: 'active' }
];

const mockCases = [
  { id: 1, caseNo: 'CASE001', title: '个人贷款纠纷案件1', amount: 50000, status: 'pending', createTime: '2024-01-01' },
  { id: 2, caseNo: 'CASE002', title: '个人贷款纠纷案件2', amount: 80000, status: 'mediation', createTime: '2024-01-02' }
];

// API路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: mockUsers[0]
      }
    });
  } else {
    res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    });
  }
});

app.get('/api/user/profile', (req, res) => {
  res.json({
    code: 200,
    data: mockUsers[0]
  });
});

app.get('/api/user/list', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: mockUsers,
      total: mockUsers.length
    }
  });
});

app.get('/api/case/list', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: mockCases,
      total: mockCases.length
    }
  });
});

app.get('/api/case/:id', (req, res) => {
  const case_ = mockCases.find(c => c.id == req.params.id);
  if (case_) {
    res.json({
      code: 200,
      data: case_
    });
  } else {
    res.status(404).json({
      code: 404,
      message: '案件不存在'
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'Mock Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Mock Backend Server running on http://localhost:${PORT}`);
  console.log('Mock API endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/user/profile');
  console.log('  GET  /api/user/list');
  console.log('  GET  /api/case/list');
  console.log('  GET  /api/case/:id');
  console.log('  GET  /api/health');
});
EOF

        # 安装依赖
        npm install > /dev/null 2>&1
    fi
    
    # 启动Mock后端
    npm start > ../logs/mock-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/mock-backend.pid
    
    cd ..
    
    # 等待后端服务启动
    log_info "等待Mock后端服务启动..."
    for i in {1..20}; do
        if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
            log_success "Mock后端服务启动成功 (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 2
    done
    
    log_error "Mock后端服务启动失败"
    return 1
}

# 停止所有服务
stop_services() {
    log_info "停止所有服务..."
    
    # 停止前端服务
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            log_info "停止前端服务 (PID: $FRONTEND_PID)"
            kill $FRONTEND_PID
        fi
        rm -f logs/frontend.pid
    fi
    
    # 停止Mock后端服务
    if [ -f "logs/mock-backend.pid" ]; then
        BACKEND_PID=$(cat logs/mock-backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_info "停止Mock后端服务 (PID: $BACKEND_PID)"
            kill $BACKEND_PID
        fi
        rm -f logs/mock-backend.pid
    fi
    
    log_success "所有服务已停止"
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "=========================================="
    echo "           DLMP开发预览服务状态"
    echo "=========================================="
    
    # 检查前端服务
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null && curl -s http://localhost:5173 >/dev/null 2>&1; then
            echo -e "✅ 前端服务: ${GREEN}运行中${NC} (PID: $FRONTEND_PID, 端口: 5173)"
        else
            echo -e "❌ 前端服务: ${RED}异常${NC}"
        fi
    else
        echo -e "⭕ 前端服务: ${RED}未运行${NC}"
    fi
    
    # 检查Mock后端服务
    if [ -f "logs/mock-backend.pid" ]; then
        BACKEND_PID=$(cat logs/mock-backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null && curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
            echo -e "✅ Mock后端: ${GREEN}运行中${NC} (PID: $BACKEND_PID, 端口: 8080)"
        else
            echo -e "❌ Mock后端: ${RED}异常${NC}"
        fi
    else
        echo -e "⭕ Mock后端: ${RED}未运行${NC}"
    fi
    
    echo ""
    echo "=========================================="
    echo "           访问地址"
    echo "=========================================="
    echo "🌐 前端应用:     http://localhost:5173"
    echo "🔧 Mock API:     http://localhost:8080/api"
    echo ""
    echo "📝 测试账号:"
    echo "   用户名: admin"
    echo "   密码:   admin123"
    echo "=========================================="
}

# 显示日志
show_logs() {
    local service=${1:-frontend}
    local log_file="logs/${service}.log"
    
    if [ -f "$log_file" ]; then
        log_info "显示 $service 服务日志..."
        tail -f "$log_file"
    else
        log_error "日志文件不存在: $log_file"
    fi
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "    DLMP项目快速启动脚本（开发预览模式）"
    echo "=========================================="
    echo ""
    
    # 创建日志目录
    mkdir -p logs
    
    case "${1:-start}" in
        "start")
            check_node
            install_frontend_deps
            create_dev_config
            start_mock_backend
            start_frontend
            
            sleep 5
            check_status
            
            echo ""
            log_success "开发预览环境启动完成！"
            echo ""
            echo "🎉 现在可以访问:"
            echo "   前端应用: http://localhost:5173"
            echo "   Mock API: http://localhost:8080/api"
            echo ""
            echo "💡 使用说明:"
            echo "   1. 使用 admin/admin123 登录系统"
            echo "   2. 前端页面使用Mock数据，功能演示"
            echo "   3. 运行 './quick-start.sh logs frontend' 查看前端日志"
            echo "   4. 运行 './quick-start.sh stop' 停止所有服务"
            echo ""
            ;;
        "stop")
            stop_services
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [command] [options]"
            echo ""
            echo "命令:"
            echo "  start    启动开发预览环境 (默认)"
            echo "  stop     停止所有服务"
            echo "  status   检查服务状态"
            echo "  logs     查看服务日志 [frontend|mock-backend]"
            echo "  help     显示帮助信息"
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