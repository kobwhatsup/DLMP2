# 个贷不良资产分散诉讼调解平台 - 前端项目

## 项目简介

基于 React 18 + TypeScript + Vite + Ant Design 构建的现代化前端应用，为个贷不良资产处置提供完整的可视化操作界面。

## 技术栈

- **框架**: React 18.2.0
- **语言**: TypeScript 5.2.2
- **构建工具**: Vite 5.0.8
- **UI组件库**: Ant Design 5.12.7
- **路由管理**: React Router 6.20.1
- **状态管理**: Zustand 4.4.7
- **HTTP客户端**: Axios 1.6.2
- **工具库**: Lodash-es, Dayjs, Ahooks
- **测试框架**: Vitest + Testing Library

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Layout/         # 布局组件
│   └── Common/         # 通用组件
├── pages/              # 页面组件
│   ├── Login/          # 登录页面
│   ├── Dashboard/      # 工作台
│   ├── User/           # 用户管理
│   ├── Case/           # 案件管理
│   ├── Assignment/     # 智能分案
│   ├── Mediation/      # 调解管理
│   ├── Litigation/     # 诉讼管理
│   ├── Settlement/     # 结算管理
│   ├── Notification/   # 消息中心
│   ├── File/           # 文件管理
│   └── System/         # 系统设置
├── services/           # API服务
├── stores/             # 状态管理
├── router/             # 路由配置
├── utils/              # 工具函数
├── types/              # 类型定义
├── styles/             # 样式文件
└── test/               # 测试工具
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+ 或 pnpm 8+

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 开发规范

### 代码规范

项目使用 ESLint + Prettier 确保代码质量和风格一致性：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format
```

### 类型检查

```bash
# TypeScript 类型检查
npm run type-check
```

### 测试

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 测试 UI 界面
npm run test:ui
```

## 功能特性

### 🔐 用户认证
- JWT Token 认证
- 路由守卫
- 权限控制

### 📊 数据管理
- 分页表格
- 高级搜索
- 数据导入导出

### 🎨 UI/UX
- 响应式设计
- 主题定制
- 暗色模式支持

### 🚀 性能优化
- 路由懒加载
- 组件懒加载
- 状态持久化

### 🧪 测试覆盖
- 单元测试
- 组件测试
- 工具函数测试

## 环境变量

项目支持多环境配置：

- `.env` - 基础配置
- `.env.development` - 开发环境
- `.env.production` - 生产环境

主要环境变量：

```bash
# 应用标题
VITE_APP_TITLE=个贷不良资产分散诉讼调解平台

# API地址
VITE_API_BASE_URL=http://localhost:8080

# 功能开关
VITE_MOCK_ENABLED=false
VITE_CONSOLE_LOG_ENABLED=true
```

## API集成

### 请求拦截器
- 自动添加 JWT Token
- 统一错误处理
- 请求/响应日志

### 服务层
- `authService` - 认证服务
- `userService` - 用户管理
- `caseService` - 案件管理

## 状态管理

使用 Zustand 进行状态管理：

- `authStore` - 用户认证状态
- `appStore` - 应用全局状态
- `caseStore` - 案件管理状态

## 路由配置

### 路由结构
- `/login` - 登录页面
- `/dashboard` - 工作台
- `/case/*` - 案件管理
- `/user/*` - 用户管理
- 其他业务模块...

### 权限控制
- 基于用户角色的菜单显示
- 路由级权限验证

## 组件库

### 布局组件
- `Layout` - 主布局
- `Header` - 顶部导航
- `Sidebar` - 侧边菜单
- `Breadcrumb` - 面包屑导航

### 业务组件
- `PageHeader` - 页面标题
- `SearchForm` - 搜索表单
- `StatusTag` - 状态标签

## 部署说明

### 构建配置
- 生产环境自动压缩
- 静态资源优化
- 代码分割

### 部署步骤
1. 配置生产环境变量
2. 执行构建命令
3. 将 `dist` 目录部署到 Web 服务器

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

---

**开发团队**: 杭州矩阵智能公司  
**最后更新**: 2025-07-12