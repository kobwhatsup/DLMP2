# 开发指南

## 1. 开发环境搭建

### 1.1 环境要求
```yaml
基础环境:
  - 操作系统: macOS/Linux/Windows
  - Java: OpenJDK 17 LTS
  - Node.js: 18.x LTS
  - Maven: 3.8+
  - Git: 2.30+

开发工具:
  - IDE: IntelliJ IDEA Ultimate / VSCode
  - 数据库工具: DBeaver / Navicat
  - API测试: Postman / Apifox
  - 容器: Docker Desktop

数据库环境:
  - MySQL: 8.0+
  - Redis: 7.0+
  - Elasticsearch: 8.x
```

### 1.2 本地环境安装

#### 1.2.1 Java环境
```bash
# 使用SDKMAN管理Java版本（推荐）
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 17.0.9-tem
sdk use java 17.0.9-tem

# 验证安装
java -version
javac -version
```

#### 1.2.2 Node.js环境
```bash
# 使用nvm管理Node.js版本（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node -v
npm -v

# 配置npm镜像源
npm config set registry https://registry.npmmirror.com
```

#### 1.2.3 Docker环境
```bash
# 安装Docker Desktop
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Windows: https://docs.docker.com/desktop/install/windows-install/
# Linux: https://docs.docker.com/engine/install/

# 验证安装
docker --version
docker-compose --version
```

### 1.3 项目克隆和初始化
```bash
# 克隆项目
git clone <repository-url>
cd DLMP2

# 初始化git hooks
npm install -g husky
husky install

# 创建开发分支
git checkout -b develop
```

## 2. 项目结构详解

### 2.1 整体目录结构
```
DLMP2/
├── docs/                           # 项目文档
│   ├── architecture/              # 架构设计文档
│   ├── api/                      # API接口文档
│   ├── development/              # 开发指南
│   └── deployment/               # 部署文档
├── frontend/                      # 前端项目
│   ├── public/                   # 静态资源
│   ├── src/                      # 源代码
│   ├── tests/                    # 测试文件
│   ├── .env.example             # 环境变量示例
│   ├── package.json             # 项目配置
│   ├── tsconfig.json            # TypeScript配置
│   └── vite.config.ts           # Vite配置
├── backend/                       # 后端项目
│   ├── gateway/                  # API网关
│   ├── services/                 # 微服务
│   ├── common/                   # 公共模块
│   ├── scripts/                  # 脚本文件
│   └── pom.xml                   # Maven根配置
├── docker/                       # Docker配置
│   ├── docker-compose.yml       # 本地开发环境
│   ├── docker-compose.prod.yml  # 生产环境
│   └── dockerfiles/             # 各服务Dockerfile
├── k8s/                          # Kubernetes配置
├── scripts/                      # 构建和部署脚本
├── .gitignore                   # Git忽略文件
├── README.md                    # 项目说明
└── CLAUDE.md                    # Claude开发记录
```

### 2.2 前端项目结构
```
frontend/
├── public/
│   ├── index.html               # HTML模板
│   ├── favicon.ico             # 网站图标
│   └── assets/                 # 静态资源
├── src/
│   ├── components/             # 可复用组件
│   │   ├── common/            # 通用组件
│   │   ├── business/          # 业务组件
│   │   └── layouts/           # 布局组件
│   ├── pages/                 # 页面组件
│   │   ├── dashboard/         # 仪表板
│   │   ├── cases/            # 案件管理
│   │   ├── mediation/        # 调解管理
│   │   ├── litigation/       # 诉讼管理
│   │   ├── settlement/       # 结算管理
│   │   └── system/           # 系统管理
│   ├── services/              # API服务层
│   │   ├── api/              # API接口定义
│   │   ├── request/          # 请求拦截器
│   │   └── types/            # 类型定义
│   ├── stores/                # 状态管理
│   │   ├── auth.ts           # 认证状态
│   │   ├── case.ts           # 案件状态
│   │   └── global.ts         # 全局状态
│   ├── utils/                 # 工具函数
│   │   ├── request.ts        # 请求工具
│   │   ├── storage.ts        # 存储工具
│   │   ├── date.ts           # 日期工具
│   │   └── validation.ts     # 验证工具
│   ├── hooks/                 # 自定义Hook
│   ├── constants/             # 常量定义
│   ├── styles/                # 样式文件
│   ├── assets/                # 资源文件
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 应用入口
│   └── vite-env.d.ts         # 类型声明
├── tests/                     # 测试文件
│   ├── __mocks__/            # Mock文件
│   ├── components/           # 组件测试
│   ├── pages/                # 页面测试
│   └── utils/                # 工具测试
├── .env.example              # 环境变量示例
├── .eslintrc.json           # ESLint配置
├── .prettierrc              # Prettier配置
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
└── vite.config.ts           # Vite配置
```

### 2.3 后端项目结构
```
backend/
├── gateway/                      # API网关
│   ├── src/main/java/           # 源代码
│   ├── src/main/resources/      # 配置文件
│   ├── src/test/java/          # 测试代码
│   └── pom.xml                 # Maven配置
├── services/                     # 微服务
│   ├── user-service/           # 用户服务
│   │   ├── src/main/java/
│   │   │   └── com/matrix/lawsuit/user/
│   │   │       ├── controller/ # 控制器
│   │   │       ├── service/    # 服务层
│   │   │       ├── mapper/     # 数据访问层
│   │   │       ├── entity/     # 实体类
│   │   │       ├── dto/        # 数据传输对象
│   │   │       ├── config/     # 配置类
│   │   │       └── UserServiceApplication.java
│   │   ├── src/main/resources/
│   │   │   ├── application.yml # 应用配置
│   │   │   ├── bootstrap.yml   # 启动配置
│   │   │   └── mapper/         # MyBatis映射文件
│   │   └── pom.xml
│   ├── case-service/           # 案件服务
│   ├── assignment-service/     # 分案服务
│   ├── mediation-service/      # 调解服务
│   ├── litigation-service/     # 诉讼服务
│   ├── settlement-service/     # 结算服务
│   ├── notification-service/   # 通知服务
│   └── file-service/          # 文件服务
├── common/                      # 公共模块
│   ├── common-core/           # 核心模块
│   │   ├── src/main/java/
│   │   │   └── com/matrix/lawsuit/common/
│   │   │       ├── base/      # 基础类
│   │   │       ├── utils/     # 工具类
│   │   │       ├── constants/ # 常量类
│   │   │       ├── exception/ # 异常类
│   │   │       └── response/  # 响应类
│   │   └── pom.xml
│   ├── common-security/       # 安全模块
│   ├── common-redis/          # Redis模块
│   ├── common-log/            # 日志模块
│   └── common-swagger/        # 接口文档模块
├── scripts/                     # 脚本文件
│   ├── start-services.sh      # 启动脚本
│   ├── stop-services.sh       # 停止脚本
│   └── build.sh               # 构建脚本
└── pom.xml                      # Maven根配置
```

## 3. 开发规范

### 3.1 代码规范

#### 3.1.1 Java代码规范
```java
// 包命名规范
com.matrix.lawsuit.{service}.{module}.{layer}

// 类命名规范
public class UserController {         // 控制器
public class UserService {           // 服务类
public class UserServiceImpl {       // 服务实现类
public class UserMapper {            // 数据访问层
public class UserEntity {            // 实体类
public class UserDTO {               // 数据传输对象
public class UserVO {                // 视图对象

// 方法命名规范
public List<User> listUsers() {      // 查询列表
public User getUserById(Long id) {   // 根据ID查询
public void saveUser(User user) {    // 保存
public void updateUser(User user) {  // 更新
public void deleteUser(Long id) {    // 删除

// 常量命名规范
public static final String USER_CACHE_KEY = "user:cache:";
public static final int DEFAULT_PAGE_SIZE = 20;
```

#### 3.1.2 TypeScript代码规范
```typescript
// 接口命名规范
interface UserInfo {
  id: number;
  username: string;
  email: string;
}

// 类型命名规范
type UserRole = 'admin' | 'user' | 'mediation';
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

// 组件命名规范
const UserList: React.FC = () => { /* */ };
const UserDetail: React.FC<UserDetailProps> = ({ userId }) => { /* */ };

// Hook命名规范
const useUserList = () => { /* */ };
const useUserDetail = (id: number) => { /* */ };

// 常量命名规范
export const API_ENDPOINTS = {
  USER_LIST: '/api/user/list',
  USER_DETAIL: '/api/user/detail',
} as const;
```

### 3.2 Git规范

#### 3.2.1 分支管理
```bash
# 主要分支
master          # 生产环境分支
develop         # 开发环境分支

# 功能分支
feature/user-management     # 用户管理功能
feature/case-import        # 案件导入功能
feature/mediation-flow     # 调解流程功能

# 修复分支
hotfix/login-issue         # 登录问题修复
hotfix/performance-fix     # 性能问题修复

# 发布分支
release/v1.0.0            # 版本发布分支
```

#### 3.2.2 提交规范
```bash
# 提交类型
feat: 新功能
fix: 修复问题
docs: 修改文档
style: 修改代码格式（不影响功能）
refactor: 代码重构
test: 增加测试
chore: 构建过程或辅助工具的变动
perf: 性能优化
ci: CI配置修改

# 提交格式
<type>(<scope>): <subject>

<body>

<footer>

# 示例
feat(user): 添加用户管理功能

- 实现用户列表查询
- 实现用户详情查看
- 实现用户创建和编辑

Closes #123
```

### 3.3 API设计规范

#### 3.3.1 RESTful API规范
```yaml
# URL设计
GET    /api/users              # 获取用户列表
GET    /api/users/{id}         # 获取用户详情
POST   /api/users              # 创建用户
PUT    /api/users/{id}         # 更新用户
DELETE /api/users/{id}         # 删除用户

# 查询参数
GET /api/cases?page=1&size=20&status=1&keyword=张三

# 响应格式
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "size": 20
  },
  "timestamp": "2024-12-01T10:00:00Z"
}

# 错误响应
{
  "code": 400,
  "message": "参数验证失败",
  "data": null,
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ],
  "timestamp": "2024-12-01T10:00:00Z"
}
```

#### 3.3.2 状态码规范
```yaml
成功响应:
  200: 请求成功
  201: 创建成功
  204: 删除成功

客户端错误:
  400: 请求参数错误
  401: 未认证
  403: 无权限
  404: 资源不存在
  409: 资源冲突
  422: 参数验证失败

服务端错误:
  500: 服务器内部错误
  502: 网关错误
  503: 服务不可用
```

## 4. 本地开发流程

### 4.1 启动基础设施
```bash
# 进入项目目录
cd DLMP2

# 启动基础设施（MySQL、Redis、Nacos等）
cd docker
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f mysql
```

### 4.2 启动后端服务
```bash
# 方式1：使用脚本启动所有服务
cd backend
./scripts/start-services.sh

# 方式2：单独启动服务
cd backend/gateway
mvn spring-boot:run

cd backend/services/user-service
mvn spring-boot:run

# 方式3：使用IDE启动
# 在IntelliJ IDEA中导入项目，运行各个服务的Application类
```

### 4.3 启动前端项目
```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev

# 项目将在 http://localhost:5173 启动
```

### 4.4 验证环境
```bash
# 检查后端服务
curl http://localhost:8080/api/health

# 检查API网关
curl http://localhost:8080/api/user/health

# 检查前端应用
curl http://localhost:5173
```

## 5. 开发调试

### 5.1 前端调试

#### 5.1.1 浏览器调试
```typescript
// 使用console调试
console.log('用户信息:', userInfo);
console.table(userList);
console.error('错误信息:', error);

// 使用debugger断点
const handleSubmit = (values: any) => {
  debugger; // 浏览器会在此处暂停
  console.log('表单数据:', values);
};

// 使用React Developer Tools
// 安装浏览器扩展：React Developer Tools
```

#### 5.1.2 VSCode调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### 5.2 后端调试

#### 5.2.1 IntelliJ IDEA调试
```java
// 在代码中设置断点
@RestController
public class UserController {
    
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        // 在此行设置断点
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}

// 使用Debug模式启动应用
// 在IDE中点击Debug按钮而不是Run按钮
```

#### 5.2.2 日志调试
```java
// 使用SLF4J日志
@Slf4j
@Service
public class UserService {
    
    public User getUserById(Long id) {
        log.debug("查询用户，ID: {}", id);
        
        User user = userMapper.selectById(id);
        if (user == null) {
            log.warn("用户不存在，ID: {}", id);
            throw new UserNotFoundException("用户不存在");
        }
        
        log.info("查询用户成功，用户名: {}", user.getUsername());
        return user;
    }
}

// 配置日志级别（application.yml）
logging:
  level:
    com.matrix.lawsuit: DEBUG
    org.springframework.web: DEBUG
```

### 5.3 数据库调试

#### 5.3.1 SQL日志
```yaml
# application.yml
logging:
  level:
    org.apache.ibatis.logging.jdbc: DEBUG

# 或者使用p6spy（推荐）
spring:
  datasource:
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
    url: jdbc:p6spy:mysql://localhost:3306/lawsuit_platform
```

#### 5.3.2 数据库工具
```bash
# 使用MySQL命令行
mysql -h localhost -u root -p lawsuit_platform

# 查看表结构
DESCRIBE t_user;

# 查看SQL执行计划
EXPLAIN SELECT * FROM t_case WHERE debtor_name = '张三';

# 查看慢查询
SHOW FULL PROCESSLIST;
```

## 6. 测试开发

### 6.1 前端测试

#### 6.1.1 单元测试
```typescript
// components/__tests__/UserList.test.tsx
import { render, screen } from '@testing-library/react';
import { UserList } from '../UserList';

describe('UserList组件', () => {
  test('应该渲染用户列表', () => {
    const users = [
      { id: 1, username: 'test1', email: 'test1@example.com' },
      { id: 2, username: 'test2', email: 'test2@example.com' },
    ];

    render(<UserList users={users} />);

    expect(screen.getByText('test1')).toBeInTheDocument();
    expect(screen.getByText('test2')).toBeInTheDocument();
  });
});

// 运行测试
npm run test
```

#### 6.1.2 E2E测试
```typescript
// tests/e2e/user.spec.ts
import { test, expect } from '@playwright/test';

test('用户登录流程', async ({ page }) => {
  // 访问登录页面
  await page.goto('/login');

  // 填写登录表单
  await page.fill('[data-testid=username]', 'testuser');
  await page.fill('[data-testid=password]', 'password123');
  
  // 点击登录按钮
  await page.click('[data-testid=login-button]');

  // 验证登录成功
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid=user-avatar]')).toBeVisible();
});

// 运行E2E测试
npm run test:e2e
```

### 6.2 后端测试

#### 6.2.1 单元测试
```java
// UserServiceTest.java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserMapper userMapper;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    @DisplayName("根据ID查询用户 - 成功")
    void getUserById_Success() {
        // Given
        Long userId = 1L;
        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);
        userEntity.setUsername("testuser");
        
        when(userMapper.selectById(userId)).thenReturn(userEntity);
        
        // When
        User result = userService.getUserById(userId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(userId);
        assertThat(result.getUsername()).isEqualTo("testuser");
    }
    
    @Test
    @DisplayName("根据ID查询用户 - 用户不存在")
    void getUserById_UserNotFound() {
        // Given
        Long userId = 999L;
        when(userMapper.selectById(userId)).thenReturn(null);
        
        // When & Then
        assertThatThrownBy(() -> userService.getUserById(userId))
            .isInstanceOf(UserNotFoundException.class)
            .hasMessage("用户不存在");
    }
}

// 运行测试
mvn test
```

#### 6.2.2 集成测试
```java
// UserControllerIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    @DisplayName("获取用户列表 - 集成测试")
    void getUserList_Integration() {
        // Given
        String url = "/api/users";
        
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"code\":200");
    }
}
```

## 7. 性能优化指南

### 7.1 前端性能优化

#### 7.1.1 代码分割
```typescript
// 路由级别代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// 组件级别代码分割
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// 使用Suspense包装
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/users" element={<UserManagement />} />
  </Routes>
</Suspense>
```

#### 7.1.2 性能监控
```typescript
// 使用Performance API
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

performanceObserver.observe({ entryTypes: ['navigation', 'paint'] });

// 使用React Developer Tools Profiler
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log(`Component ${id} took ${actualDuration}ms to render`);
};

<Profiler id="UserList" onRender={onRenderCallback}>
  <UserList />
</Profiler>
```

### 7.2 后端性能优化

#### 7.2.1 数据库优化
```sql
-- 创建合适的索引
CREATE INDEX idx_case_debtor_name ON t_case(debtor_name);
CREATE INDEX idx_case_status_created ON t_case(case_status, created_time);

-- 分析查询性能
EXPLAIN SELECT * FROM t_case 
WHERE debtor_name LIKE '%张三%' 
AND case_status = 1 
ORDER BY created_time DESC;

-- 优化查询语句
-- 避免SELECT *，指定具体字段
SELECT id, case_no, debtor_name, debt_amount 
FROM t_case 
WHERE case_status = 1;
```

#### 7.2.2 缓存优化
```java
// 合理使用缓存
@Service
public class CaseService {
    
    @Cacheable(value = "case", key = "#id", condition = "#id != null")
    public CaseInfo getCaseById(Long id) {
        return caseMapper.selectById(id);
    }
    
    @CacheEvict(value = "case", key = "#caseInfo.id")
    public void updateCase(CaseInfo caseInfo) {
        caseMapper.updateById(caseInfo);
    }
    
    // 预热缓存
    @PostConstruct
    public void warmupCache() {
        List<CaseInfo> hotCases = caseMapper.selectHotCases();
        hotCases.forEach(case -> {
            cacheManager.getCache("case").put(case.getId(), case);
        });
    }
}
```

## 8. 故障排查指南

### 8.1 常见问题

#### 8.1.1 前端问题
```typescript
// 问题1：组件未渲染
// 检查：组件是否正确导入，路由是否配置正确
import { UserList } from './components/UserList'; // 检查路径

// 问题2：API请求失败
// 检查：网络请求、CORS配置、API地址
const response = await fetch('/api/users');
if (!response.ok) {
  console.error('API请求失败:', response.status, response.statusText);
}

// 问题3：状态更新不生效
// 检查：状态是否正确更新，组件是否重新渲染
const [users, setUsers] = useState([]);
// 确保使用新对象而不是修改原对象
setUsers([...users, newUser]); // 正确
// setUsers(users.push(newUser)); // 错误
```

#### 8.1.2 后端问题
```java
// 问题1：服务启动失败
// 检查：端口是否被占用、配置是否正确、依赖是否冲突
// 查看启动日志，定位具体错误

// 问题2：数据库连接失败
// 检查：数据库是否启动、连接配置是否正确、网络是否通畅
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/lawsuit_platform?useSSL=false&serverTimezone=UTC
    username: root
    password: password

// 问题3：接口返回500错误
// 检查：后端日志、数据库查询、业务逻辑
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("系统异常", e);
        return ResponseEntity.status(500)
            .body(new ErrorResponse(500, "系统内部错误"));
    }
}
```

### 8.2 日志分析

#### 8.2.1 查看应用日志
```bash
# 查看前端控制台日志
# 在浏览器开发者工具中查看Console

# 查看后端应用日志
tail -f logs/application.log

# 查看特定服务日志
docker logs -f user-service

# 查看错误日志
grep "ERROR" logs/application.log | tail -20
```

#### 8.2.2 分析性能问题
```bash
# 查看JVM内存使用情况
jstat -gc <pid>

# 查看线程堆栈
jstack <pid>

# 查看堆内存转储
jmap -dump:format=b,file=heapdump.hprof <pid>

# 分析数据库慢查询
mysql> SHOW FULL PROCESSLIST;
mysql> SELECT * FROM information_schema.processlist WHERE TIME > 10;
```

---

本开发指南将根据项目进展持续更新，请关注最新版本。如有问题，请及时反馈给项目维护团队。