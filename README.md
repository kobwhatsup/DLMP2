# 个贷不良资产分散诉讼调解平台

## 项目概述

分散诉调平台是一个专为个贷不良资产处置设计的B端作业系统，通过整合银行、消费金融公司、小贷公司、资产管理公司、律所等案源端客户与调解中心，实现案件智能分配、高效调解、司法确认及诉讼全流程管理，从而提升不良资产处置效率，降低处置成本。

## 核心功能

### 业务流程
- **案件委托与导入**：支持批量导入案件信息及相关材料
- **智能分案**：基于地域、金额、机构能力等规则自动分配案件
- **调解管理**：15-30天调解周期，支持调解协议生成和司法确认
- **诉讼管理**：立案准备、审判跟踪、执行推进全流程管理
- **结算管理**：按业务类型进行数据统计和财务结算

### 功能模块
- **用户管理**：多角色权限管理（RBAC）
- **案件管理**：案件导入、查询、状态管理、督办
- **智能分案**：分案规则配置、自动匹配、结果管理
- **调解管理**：调解流程、文书管理、调解员管理
- **诉讼管理**：诉讼材料准备、立案跟踪、执行管理
- **结算管理**：费用计算、结算凭证生成、支付管理
- **系统管理**：日志管理、消息通知、统计报表

## 用户角色

- **案源端客户**：银行、消费金融公司、小贷公司、资产管理公司、律所
- **调解中心**：平台入驻的调解机构
- **平台运营方**：杭州矩阵智能公司
- **法院**：特邀调解组织入驻的法院
- **债务人**：案件当事人

## 技术架构

### 总体架构
- **架构模式**：微服务架构
- **部署方式**：云原生部署，支持容器化
- **数据处理**：年处理1000万案件，支持10万+并发用户

### 前端技术栈
- **框架**：React 18 + TypeScript
- **UI组件**：Ant Design 5.x
- **状态管理**：Zustand
- **路由管理**：React Router 6
- **构建工具**：Vite
- **测试框架**：Vitest + Testing Library

### 后端技术栈
- **开发语言**：Java 17 LTS
- **核心框架**：Spring Boot 3.2.x + Spring Cloud 2023.x
- **数据访问**：Spring Data JPA + MyBatis-Plus
- **服务注册**：Nacos
- **API网关**：Spring Cloud Gateway
- **熔断器**：Resilience4j

### 数据存储
- **关系型数据库**：MySQL 8.0（主从复制、读写分离、分库分表）
- **缓存系统**：Redis 7.0（集群模式）+ Caffeine（本地缓存）
- **对象存储**：分层存储架构（热/温/冷存储）
- **搜索引擎**：Elasticsearch 8.x
- **消息队列**：RocketMQ

### 基础设施
- **监控系统**：Prometheus + Grafana
- **日志系统**：ELK Stack
- **链路追踪**：SkyWalking
- **容器化**：Docker + Kubernetes

## 性能指标

- **并发用户数**：支持超过10万人同时在线操作
- **响应时间**：核心业务操作3秒内，复杂查询5秒内
- **处理能力**：年处理案件量超过1000万件
- **系统可用性**：99.9%以上
- **存储容量**：支持PB级数据存储，年新增约1PB

## 安全要求

- **数据安全**：敏感数据加密存储和传输
- **访问控制**：基于RBAC的严格权限管理
- **防护能力**：防SQL注入、XSS攻击、DDoS攻击
- **审计追踪**：完整的操作日志记录
- **合规性**：符合国家数据隐私保护法规

## 项目结构

```
DLMP2/
├── docs/                           # 文档目录
│   ├── architecture/              # 架构文档
│   ├── api/                      # API文档
│   └── deployment/               # 部署文档
├── frontend/                      # 前端项目
│   ├── src/
│   │   ├── components/           # 组件
│   │   ├── pages/               # 页面
│   │   ├── services/            # 服务层
│   │   ├── stores/              # 状态管理
│   │   └── utils/               # 工具函数
│   ├── public/                  # 静态资源
│   └── package.json
├── backend/                       # 后端项目
│   ├── gateway/                  # API网关
│   ├── services/                 # 微服务
│   │   ├── user-service/        # 用户服务
│   │   ├── case-service/        # 案件服务
│   │   ├── assignment-service/   # 分案服务
│   │   ├── mediation-service/   # 调解服务
│   │   ├── litigation-service/  # 诉讼服务
│   │   ├── settlement-service/  # 结算服务
│   │   ├── notification-service/ # 通知服务
│   │   └── file-service/        # 文件服务
│   └── common/                   # 公共模块
├── scripts/                       # 脚本文件
├── docker/                       # Docker配置
└── k8s/                          # Kubernetes配置
```

## 开发规范

### 代码规范
- **前端**：遵循ESLint + Prettier规范
- **后端**：遵循阿里巴巴Java开发手册
- **数据库**：遵循数据库设计规范
- **接口**：遵循RESTful API设计规范

### 分支管理
- **主分支**：master（生产环境）
- **开发分支**：develop（开发环境）
- **功能分支**：feature/xxx（功能开发）
- **修复分支**：hotfix/xxx（紧急修复）

### 提交规范
```
feat: 新功能
fix: 修复问题
docs: 修改文档
style: 修改代码格式
refactor: 代码重构
test: 增加测试
chore: 构建过程或辅助工具的变动
```

## 快速开始

### 环境要求
- **前端**：Node.js 18+, npm 9+
- **后端**：Java 17+, Maven 3.8+
- **数据库**：MySQL 8.0+, Redis 7.0+
- **其他**：Docker, Kubernetes（可选）

### 本地开发
1. 克隆项目
```bash
git clone <repository-url>
cd DLMP2
```

2. 启动后端服务
```bash
cd backend
# 启动基础设施（MySQL, Redis, Nacos等）
docker-compose up -d
# 启动各个微服务
./start-services.sh
```

3. 启动前端项目
```bash
cd frontend
npm install
npm run dev
```

## 部署说明

详细部署说明请参考 [部署文档](docs/deployment/README.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者：杭州矩阵智能公司
- 邮箱：[联系邮箱]
- 文档：[在线文档地址]

---

最后更新时间：2024年12月