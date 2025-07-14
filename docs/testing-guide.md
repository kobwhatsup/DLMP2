# 测试指南

本指南提供DLMP项目的完整测试策略、工具使用和最佳实践。

## 📋 目录

- [测试策略](#测试策略)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [E2E测试](#e2e测试)
- [性能测试](#性能测试)
- [测试环境](#测试环境)
- [最佳实践](#最佳实践)

## 🎯 测试策略

### 测试金字塔

```
        /\
       /  \
      / UI \
     /______\
    /        \
   /   API    \
  /__________\
 /            \
/     UNIT     \
/______________ \
```

- **单元测试 (70%)**: 快速、隔离、高覆盖率
- **集成测试 (20%)**: API接口、服务交互
- **E2E测试 (10%)**: 用户场景、关键流程

### 测试类型覆盖

| 测试类型 | 工具 | 覆盖范围 | 执行频率 |
|---------|------|---------|---------|
| 单元测试 | Vitest + JUnit | 函数、组件、类 | 每次提交 |
| 集成测试 | Playwright + TestContainers | API、数据库 | 每次提交 |
| E2E测试 | Playwright | 用户流程 | 每日/发布前 |
| 性能测试 | Lighthouse + K6 | 页面性能、API性能 | 每周/发布前 |
| 安全测试 | OWASP ZAP + Trivy | 漏洞扫描 | 每次构建 |

## 🧪 单元测试

### 前端单元测试

#### 工具配置
- **框架**: Vitest
- **渲染**: React Testing Library
- **Mock**: Vi (内置)
- **覆盖率**: V8

#### 测试结构
```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import Button from '../Button'

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

#### 工具函数测试
```typescript
// src/utils/__tests__/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPhone } from '../format'

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('¥1,234.56')
      expect(formatCurrency(0)).toBe('¥0.00')
      expect(formatCurrency(-1000)).toBe('-¥1,000.00')
    })

    it('should handle edge cases', () => {
      expect(formatCurrency(null)).toBe('-')
      expect(formatCurrency(undefined)).toBe('-')
      expect(formatCurrency(NaN)).toBe('-')
    })
  })
})
```

#### Service层测试
```typescript
// src/services/__tests__/userService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../userService'
import { mockApiResponse } from '@/test/test-utils'

vi.mock('@/utils/request')

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user list successfully', async () => {
    const mockUsers = [{ id: 1, name: 'John' }]
    vi.mocked(request.get).mockResolvedValue(mockApiResponse(mockUsers))

    const result = await userService.getUserList({ page: 1, size: 10 })
    
    expect(request.get).toHaveBeenCalledWith('/api/users', {
      params: { page: 1, size: 10 }
    })
    expect(result.data).toEqual(mockUsers)
  })
})
```

### 后端单元测试

#### 工具配置
- **框架**: JUnit 5
- **Mock**: Mockito
- **断言**: AssertJ
- **覆盖率**: JaCoCo

#### Controller测试
```java
// UserControllerTest.java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void shouldGetUserSuccessfully() throws Exception {
        // Given
        User user = new User(1L, "test@example.com", "Test User");
        when(userService.findById(1L)).thenReturn(user);

        // When & Then
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpected(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void shouldCreateUserSuccessfully() throws Exception {
        // Given
        User newUser = new User(null, "new@example.com", "New User");
        User savedUser = new User(2L, "new@example.com", "New User");
        when(userService.create(any(User.class))).thenReturn(savedUser);

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2));
    }
}
```

#### Service测试
```java
// UserServiceTest.java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldFindUserById() {
        // Given
        User expectedUser = new User(1L, "test@example.com", "Test User");
        when(userRepository.findById(1L)).thenReturn(Optional.of(expectedUser));

        // When
        User actualUser = userService.findById(1L);

        // Then
        assertThat(actualUser).isEqualTo(expectedUser);
        verify(userRepository).findById(1L);
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.findById(999L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User with id 999 not found");
    }
}
```

### 运行单元测试

```bash
# 前端单元测试
cd frontend
npm test                    # 运行所有测试
npm run test:watch         # 监听模式
npm run test:coverage      # 生成覆盖率报告
npm run test:ui            # 可视化界面

# 后端单元测试
cd backend
./gradlew test             # 运行所有测试
./gradlew test --continuous # 监听模式
./gradlew jacocoTestReport # 生成覆盖率报告
```

## 🔗 集成测试

### API集成测试

#### 前端API测试
```typescript
// src/api/__tests__/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { userService } from '@/services/userService'

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json({
      code: 200,
      data: [
        { id: 1, username: 'admin', realName: '管理员' },
        { id: 2, username: 'user', realName: '普通用户' }
      ]
    })
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('User API Integration', () => {
  it('should fetch users from API', async () => {
    const response = await userService.getUserList({ page: 1, size: 10 })
    
    expect(response.code).toBe(200)
    expect(response.data).toHaveLength(2)
    expect(response.data[0].username).toBe('admin')
  })
})
```

#### 后端集成测试
```java
// UserIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class UserIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldCreateAndRetrieveUser() {
        // Given
        User newUser = new User("test@example.com", "Test User");

        // When - Create user
        ResponseEntity<User> createResponse = restTemplate.postForEntity(
                "/api/users", newUser, User.class);

        // Then
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().getId()).isNotNull();

        // When - Retrieve user
        Long userId = createResponse.getBody().getId();
        ResponseEntity<User> getResponse = restTemplate.getForEntity(
                "/api/users/" + userId, User.class);

        // Then
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().getEmail()).isEqualTo("test@example.com");
    }
}
```

### 数据库集成测试

#### 使用TestContainers
```java
// DatabaseIntegrationTest.java
@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldPersistAndRetrieveUser() {
        // Given
        User user = new User("test@example.com", "Test User");

        // When
        User savedUser = userRepository.save(user);
        Optional<User> retrievedUser = userRepository.findById(savedUser.getId());

        // Then
        assertThat(retrievedUser).isPresent();
        assertThat(retrievedUser.get().getEmail()).isEqualTo("test@example.com");
    }
}
```

## 🎭 E2E测试

### Playwright配置

#### 测试配置
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
```

### 页面对象模型

```typescript
// src/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.locator('[data-testid="username-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.errorMessage = page.locator('.ant-message-error')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent()
  }
}
```

### E2E测试用例

```typescript
// src/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('Authentication', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('successful login flow', async ({ page }) => {
    await loginPage.login('admin', 'admin123')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('.user-info')).toContainText('管理员')
  })

  test('failed login with invalid credentials', async () => {
    await loginPage.login('invalid', 'wrong')
    
    const errorMessage = await loginPage.getErrorMessage()
    expect(errorMessage).toContain('用户名或密码错误')
  })

  test('complete user workflow', async ({ page }) => {
    // 登录
    await loginPage.login('admin', 'admin123')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // 导航到用户管理
    await page.click('[data-testid="menu-users"]')
    await expect(page).toHaveURL(/.*\/users/)

    // 创建新用户
    await page.click('[data-testid="create-user-btn"]')
    await page.fill('[data-testid="username-input"]', 'newuser')
    await page.fill('[data-testid="email-input"]', 'new@example.com')
    await page.click('[data-testid="submit-btn"]')

    // 验证用户创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible()
    await expect(page.locator('table')).toContainText('newuser')
  })
})
```

### 运行E2E测试

```bash
# 安装浏览器
npx playwright install

# 运行所有测试
npm run test:e2e

# 运行特定测试
npx playwright test auth.spec.ts

# 调试模式
npm run test:e2e:debug

# 可视化模式
npm run test:e2e:ui

# 生成报告
npx playwright show-report
```

## 📊 性能测试

### Lighthouse性能测试

```javascript
// src/tests/performance/lighthouse.js
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

async function runPerformanceTest(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port
  }

  const runnerResult = await lighthouse(url, options)
  await chrome.kill()

  const score = runnerResult.lhr.categories.performance.score * 100
  console.log(`Performance Score: ${score}`)
  
  return score
}

// 运行测试
runPerformanceTest('http://localhost:5173')
```

### API负载测试

```javascript
// src/tests/performance/loadtest.js
const autocannon = require('autocannon')

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:8080',
    connections: 100,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/api/users'
      },
      {
        method: 'GET', 
        path: '/api/cases'
      }
    ]
  })

  console.log('Load Test Results:')
  console.log(`Requests: ${result.requests.total}`)
  console.log(`Throughput: ${result.throughput.average} req/sec`)
  console.log(`Latency: ${result.latency.average}ms`)
}

runLoadTest()
```

### Bundle分析

```bash
# 分析打包文件大小
npm run analyze:bundle

# 生成分析报告
npm run build
npx webpack-bundle-analyzer dist/static/js/*.js
```

## 🏗️ 测试环境

### 本地测试环境

#### Docker Compose启动
```bash
# 启动完整测试环境
docker-compose -f docker-compose.test.yml up -d

# 等待服务启动
sleep 30

# 运行健康检查
curl -f http://localhost:3000/health
curl -f http://localhost:8080/actuator/health
```

#### 环境服务
- **前端**: http://localhost:3000
- **后端**: http://localhost:8080  
- **数据库**: localhost:3307
- **缓存**: localhost:6380
- **监控**: http://localhost:3001

### CI/CD测试环境

#### GitHub Actions配置
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: dlmp_test
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run test:coverage
          npm run test:e2e
          npm run test:performance
```

### 测试数据管理

#### 测试数据生成
```typescript
// src/test/fixtures/users.ts
export const createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  realName: '测试用户',
  userType: 1,
  status: 1,
  ...overrides
})

export const createTestCase = (overrides = {}) => ({
  id: 1,
  caseNumber: 'TEST_001',
  borrowerName: '张三',
  debtAmount: 100000,
  status: 1,
  ...overrides
})
```

#### 数据清理
```sql
-- scripts/cleanup-test-data.sql
DELETE FROM mediation_records WHERE case_id IN (SELECT id FROM cases WHERE case_number LIKE 'TEST_%');
DELETE FROM cases WHERE case_number LIKE 'TEST_%';
DELETE FROM users WHERE username LIKE 'test%';
```

## 📋 最佳实践

### 测试编写原则

#### AAA模式
```typescript
describe('User Service', () => {
  it('should create user successfully', async () => {
    // Arrange (准备)
    const userData = { username: 'test', email: 'test@example.com' }
    const expectedUser = { id: 1, ...userData }
    mockUserRepository.save.mockResolvedValue(expectedUser)

    // Act (执行)
    const result = await userService.create(userData)

    // Assert (断言)
    expect(result).toEqual(expectedUser)
    expect(mockUserRepository.save).toHaveBeenCalledWith(userData)
  })
})
```

#### 测试命名规范
```typescript
// ❌ 不好的命名
it('test user creation')

// ✅ 好的命名  
it('should create user when valid data provided')
it('should throw validation error when email is invalid')
it('should return existing user when username already exists')
```

### Mock策略

#### 外部依赖Mock
```typescript
// Mock API调用
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})
```

#### 时间Mock
```typescript
import MockDate from 'mockdate'

beforeEach(() => {
  MockDate.set('2024-01-01')
})

afterEach(() => {
  MockDate.reset()
})
```

### 测试覆盖率

#### 覆盖率目标
- **行覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 80%
- **语句覆盖率**: ≥ 80%

#### 覆盖率配置
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### 持续集成

#### 测试分层执行
```bash
# 快速反馈 (< 2分钟)
npm run test:unit

# 中等反馈 (< 10分钟)  
npm run test:integration

# 完整验证 (< 30分钟)
npm run test:e2e
npm run test:performance
```

#### 失败重试策略
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined
})
```

### 调试技巧

#### 前端调试
```bash
# 调试单个测试
npm test -- --run --reporter=verbose Button.test.tsx

# 浏览器调试
npm run test:ui

# 覆盖率调试
npm run test:coverage -- --reporter=html
```

#### E2E调试
```bash
# 可视化调试
npx playwright test --debug

# 录制测试
npx playwright codegen http://localhost:5173

# 查看trace
npx playwright show-trace trace.zip
```

## 📚 工具文档

- [Vitest文档](https://vitest.dev/)
- [Playwright文档](https://playwright.dev/)
- [Testing Library文档](https://testing-library.com/)
- [JUnit 5文档](https://junit.org/junit5/docs/current/user-guide/)
- [Testcontainers文档](https://www.testcontainers.org/)

---

📝 **注意**: 测试是保证代码质量的重要手段，请遵循测试最佳实践，编写高质量的测试用例。