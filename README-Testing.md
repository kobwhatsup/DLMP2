# 🧪 DLMP 测试运行指南

快速开始测试DLMP项目的完整指南。

## 🚀 快速开始

### 环境准备

```bash
# 克隆项目
git clone https://github.com/your-org/dlmp.git
cd dlmp

# 安装依赖
cd frontend && npm install
cd ../backend && ./gradlew build

# 设置测试环境
./scripts/ci-setup.sh
```

### 运行所有测试

```bash
# 启动测试环境
./scripts/start-test-env.sh

# 运行完整测试套件
./scripts/run-full-tests.sh

# 清理环境
./scripts/stop-test-env.sh
```

## 📋 测试命令速查

### 前端测试

```bash
cd frontend

# 单元测试
npm test                    # 运行所有单元测试
npm run test:watch         # 监听模式
npm run test:coverage      # 覆盖率报告
npm run test:ui            # 可视化界面

# E2E测试
npm run test:e2e           # 运行E2E测试
npm run test:e2e:debug     # 调试模式
npm run test:e2e:ui        # 可视化调试

# 性能测试
npm run test:performance   # Lighthouse性能测试
npm run test:load          # 轻量负载测试
npm run test:load:heavy    # 重度负载测试
npm run analyze:bundle     # Bundle分析
```

### 后端测试

```bash
cd backend

# 单元测试
./gradlew test             # 运行所有测试
./gradlew test --continuous # 监听模式
./gradlew jacocoTestReport # 覆盖率报告

# 集成测试
./gradlew integrationTest  # 运行集成测试

# 特定测试
./gradlew test --tests UserServiceTest
./gradlew test --tests "*Controller*"
```

## 🔧 开发测试工作流

### 本地开发

```bash
# 1. 启动开发环境
cd frontend && npm run dev &
cd backend && ./gradlew bootRun &

# 2. 监听测试
cd frontend && npm run test:watch &
cd backend && ./gradlew test --continuous &

# 3. 代码修改后自动运行测试
# 测试会自动重新执行
```

### 提交前检查

```bash
# 代码质量检查
cd frontend
npm run lint               # ESLint检查
npm run format -- --check # Prettier检查
npm run type-check        # TypeScript检查

# 运行快速测试
npm run test              # 单元测试
npm run test:e2e -- --grep "critical" # 关键E2E测试

cd ../backend
./gradlew check           # 代码质量+测试
```

## 🎯 测试类型详解

### 1. 单元测试 ⚡

**目的**: 测试单个函数、组件或类的功能

```bash
# 前端组件测试
npm test Button.test.tsx

# 工具函数测试  
npm test utils/format.test.ts

# 后端Service测试
./gradlew test --tests UserServiceTest
```

**覆盖率要求**: ≥ 80%

### 2. 集成测试 🔗

**目的**: 测试不同模块间的交互

```bash
# API集成测试
npm test api/integration.test.ts

# 数据库集成测试
./gradlew test --tests "*IntegrationTest"
```

**关注点**: API接口、数据库交互、外部服务

### 3. E2E测试 🎭

**目的**: 模拟真实用户操作流程

```bash
# 关键业务流程
npm run test:e2e auth.spec.ts       # 登录流程
npm run test:e2e case.spec.ts       # 案件管理
npm run test:e2e navigation.spec.ts # 导航功能
```

**关注点**: 用户体验、业务流程完整性

### 4. 性能测试 📊

**目的**: 验证系统性能指标

```bash
# 页面性能
npm run test:performance

# API负载测试
npm run test:load:api

# 压力测试
npm run test:load:heavy
```

**性能目标**:
- 页面加载: < 3秒
- API响应: < 500ms
- 并发用户: > 1000

## 🔍 测试调试技巧

### 前端调试

```bash
# 1. 浏览器调试
npm run test:ui

# 2. 单个测试调试
npm test -- --run Button.test.tsx

# 3. E2E录制
npx playwright codegen http://localhost:5173

# 4. 查看测试报告
open coverage/index.html
```

### 后端调试

```bash
# 1. 详细测试输出
./gradlew test --info

# 2. 调试模式
./gradlew test --debug-jvm

# 3. 查看测试报告
open build/reports/tests/test/index.html

# 4. 覆盖率报告
open build/reports/jacoco/test/html/index.html
```

## 📊 测试报告

### 覆盖率报告

```bash
# 生成覆盖率报告
cd frontend && npm run test:coverage
cd backend && ./gradlew jacocoTestReport

# 查看报告
open frontend/coverage/index.html
open backend/build/reports/jacoco/test/html/index.html
```

### E2E测试报告

```bash
# 生成E2E报告
npm run test:e2e

# 查看报告
npx playwright show-report
```

### 性能测试报告

```bash
# 生成性能报告
npm run test:performance

# 查看报告
open test-results/performance/performance-summary.html
```

## 🐛 常见问题解决

### 测试失败排查

#### 1. 单元测试失败
```bash
# 检查依赖
npm install
./gradlew build

# 清理缓存
npm run test -- --clearCache
./gradlew clean test
```

#### 2. E2E测试失败
```bash
# 安装浏览器
npx playwright install

# 检查服务状态
curl -f http://localhost:5173/health
curl -f http://localhost:8080/actuator/health

# 调试模式运行
npm run test:e2e:debug
```

#### 3. 性能测试超时
```bash
# 检查系统资源
top
free -h

# 调整测试参数
export TEST_TIMEOUT=60000
npm run test:performance
```

### 环境问题

#### 1. 端口冲突
```bash
# 查看端口占用
lsof -i :3000
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 重启环境
./scripts/stop-test-env.sh
./scripts/start-test-env.sh
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker ps | grep mysql
docker logs dlmp-mysql-test

# 重置数据库
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d mysql-test
```

#### 3. 内存不足
```bash
# 检查内存使用
docker stats

# 清理Docker
docker system prune -a

# 调整内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📝 测试最佳实践

### 1. 编写好的测试

```typescript
// ✅ 好的测试
describe('UserService.create', () => {
  it('should create user when valid data provided', async () => {
    // Arrange
    const userData = { username: 'test', email: 'test@example.com' }
    
    // Act
    const result = await userService.create(userData)
    
    // Assert
    expect(result.id).toBeDefined()
    expect(result.username).toBe('test')
  })
})

// ❌ 不好的测试
it('test user creation', () => {
  // 没有明确的测试目标
  // 没有适当的断言
})
```

### 2. 测试数据管理

```typescript
// 使用工厂函数
const createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  ...overrides
})

// 测试隔离
beforeEach(() => {
  // 重置mock
  vi.clearAllMocks()
  // 清理测试数据
  cleanup()
})
```

### 3. Mock策略

```typescript
// Mock外部依赖
vi.mock('@/utils/request')
vi.mock('@/stores/auth')

// 部分Mock
vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual('@/utils/api')
  return {
    ...actual,
    request: vi.fn()
  }
})
```

## 🔄 CI/CD集成

### GitHub Actions

测试会在以下情况自动运行:
- 推送到main/develop分支
- 创建Pull Request
- 发布新版本

### 本地CI模拟

```bash
# 模拟CI环境
export CI=true
export NODE_ENV=test

# 运行CI测试流程
npm run lint
npm run type-check
npm run test:coverage
npm run test:e2e
npm run test:performance
```

## 📚 相关文档

- [详细测试指南](./docs/testing-guide.md)
- [CI/CD流水线指南](./docs/ci-cd-guide.md)
- [开发环境搭建](./docs/development/README.md)
- [故障排除指南](./docs/troubleshooting.md)

## 🤝 贡献指南

1. 新功能必须包含对应测试
2. 测试覆盖率不能低于80%
3. 所有E2E测试必须通过
4. 性能测试不能有明显回退

## 📞 获取帮助

- 技术问题: 创建Issue
- 文档问题: 提交PR
- 紧急问题: 联系团队

---

🎯 **记住**: 好的测试是好代码的保证！