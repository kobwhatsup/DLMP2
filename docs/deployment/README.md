# 个贷不良资产分散诉讼调解平台 - 部署指南

## 概述

本文档详细说明了个贷不良资产分散诉讼调解平台的部署流程，包括环境准备、基础设施搭建、微服务部署等完整步骤。

## 系统要求

### 硬件要求

- **CPU**: 4核心以上
- **内存**: 16GB以上推荐（最低8GB）
- **存储**: 100GB以上可用空间
- **网络**: 稳定的网络连接

### 软件环境

- **操作系统**: Linux (Ubuntu 20.04+/CentOS 7+) 或 macOS
- **Java**: JDK 17+
- **Maven**: 3.8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

## 快速开始

### 1. 克隆项目

```bash
git clone <项目地址>
cd DLMP2
```

### 2. 启动基础设施

```bash
# 启动所有基础设施服务（MySQL、Redis、Nacos等）
cd backend
./scripts/start-infrastructure.sh
```

### 3. 启动微服务

```bash
# 启动所有微服务
./scripts/start-services.sh start
```

### 4. 验证部署

访问以下地址验证服务是否正常运行：

- **API网关**: http://localhost:8080
- **API文档**: http://localhost:8080/doc.html
- **Nacos控制台**: http://localhost:8848/nacos (用户名/密码: nacos/nacos)
- **Grafana监控**: http://localhost:3000 (用户名/密码: admin/admin123456)

## 详细部署步骤

### 步骤1: 环境准备

#### 1.1 安装Java 17

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# CentOS/RHEL
sudo yum install java-17-openjdk-devel

# macOS (使用Homebrew)
brew install openjdk@17
```

验证安装：
```bash
java -version
javac -version
```

#### 1.2 安装Maven

```bash
# Ubuntu/Debian
sudo apt install maven

# CentOS/RHEL
sudo yum install maven

# macOS (使用Homebrew)
brew install maven
```

验证安装：
```bash
mvn -version
```

#### 1.3 安装Docker和Docker Compose

```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

验证安装：
```bash
docker --version
docker-compose --version
```

### 步骤2: 基础设施部署

基础设施包括：MySQL主从集群、Redis集群、Nacos、RocketMQ、Elasticsearch、MinIO、监控系统等。

#### 2.1 启动基础设施

```bash
cd backend
./scripts/start-infrastructure.sh
```

脚本会自动完成以下操作：
1. 检查Docker环境
2. 创建必要的数据目录
3. 启动MySQL主从集群并配置复制
4. 启动Redis集群
5. 启动Nacos服务注册中心
6. 启动RocketMQ消息队列
7. 启动Elasticsearch日志存储
8. 启动MinIO对象存储
9. 启动Prometheus和Grafana监控
10. 初始化数据库架构和基础数据

#### 2.2 验证基础设施

脚本执行完成后会显示各服务的状态。也可以手动检查：

```bash
# 检查Docker容器状态
docker ps

# 检查服务端口
netstat -tlnp | grep -E "(3306|6379|8848|9876|9200|9000|9090|3000)"
```

#### 2.3 访问管理界面

- **Nacos控制台**: http://localhost:8848/nacos
  - 用户名: nacos
  - 密码: nacos
  
- **Kibana日志查看**: http://localhost:5601

- **Grafana监控面板**: http://localhost:3000
  - 用户名: admin
  - 密码: admin123456

- **MinIO对象存储**: http://localhost:9001
  - 用户名: admin
  - 密码: admin123456

### 步骤3: 微服务部署

#### 3.1 编译项目

```bash
cd backend
mvn clean compile -DskipTests
```

#### 3.2 启动微服务

```bash
./scripts/start-services.sh start
```

脚本会按顺序启动以下服务：
1. **API网关** (端口8080) - 统一入口
2. **用户服务** (端口8081) - 用户管理和认证
3. **案件服务** (端口8082) - 案件管理
4. **智能分案服务** (端口8083) - 自动分案
5. **调解服务** (端口8084) - 调解流程管理
6. **诉讼服务** (端口8085) - 诉讼管理
7. **结算服务** (端口8086) - 费用结算
8. **通知服务** (端口8087) - 消息通知
9. **文件服务** (端口8088) - 文件管理

#### 3.3 验证微服务

```bash
# 检查服务状态
./scripts/start-services.sh status

# 查看特定服务日志
./scripts/start-services.sh logs gateway
./scripts/start-services.sh logs user-service
```

### 步骤4: 配置管理

#### 4.1 Nacos配置

```bash
# 发布配置到Nacos
./scripts/nacos-config.sh
```

#### 4.2 数据库配置

数据库连接配置位于各服务的`application.yml`文件中：

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/[database_name]?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=GMT%2B8
    username: dlmp_user
    password: dlmp123456
```

## 服务管理

### 启动服务

```bash
# 启动所有服务
./scripts/start-services.sh start

# 重启所有服务
./scripts/start-services.sh restart
```

### 停止服务

```bash
# 停止所有微服务
./scripts/start-services.sh stop

# 停止基础设施
cd docker
docker-compose down
```

### 查看日志

```bash
# 查看特定服务日志
./scripts/start-services.sh logs [service-name]

# 查看基础设施日志
docker-compose logs [service-name]
```

### 健康检查

```bash
# 检查微服务状态
./scripts/start-services.sh status

# 检查基础设施状态
docker-compose ps
```

## API接口

### 统一访问地址

所有API通过网关统一访问：`http://localhost:8080`

### 主要接口

- **用户认证**: `POST /user/auth/login`
- **用户注册**: `POST /user/auth/register`
- **案件查询**: `GET /case/cases`
- **创建案件**: `POST /case/cases`
- **分案操作**: `POST /case/cases/{id}/assign`

### API文档

访问 http://localhost:8080/doc.html 查看完整的API文档。

## 监控和运维

### 服务监控

- **Prometheus指标**: http://localhost:9090
- **Grafana面板**: http://localhost:3000

### 日志管理

- **应用日志**: `backend/logs/` 目录
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

### 性能监控

默认配置了以下监控指标：
- JVM内存使用
- HTTP请求响应时间
- 数据库连接池状态
- Redis连接状态
- 自定义业务指标

## 故障排查

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
lsof -i :8080
netstat -tlnp | grep 8080

# 杀死占用端口的进程
kill -9 <PID>
```

#### 2. 内存不足

```bash
# 检查内存使用
free -h
top

# 调整JVM内存参数
export MAVEN_OPTS="-Xmx2g -Xms1g"
```

#### 3. 数据库连接失败

```bash
# 检查MySQL状态
docker exec dlmp-mysql-master mysql -uroot -proot123456 -e "SELECT 1"

# 重启MySQL
docker-compose restart mysql-master
```

#### 4. 服务注册失败

```bash
# 检查Nacos状态
curl http://localhost:8848/nacos/v1/ns/operator/metrics

# 重启Nacos
docker-compose restart nacos
```

### 日志分析

```bash
# 查看错误日志
grep -i error backend/logs/*.log

# 查看特定时间段日志
grep "2025-07-12 14:" backend/logs/gateway.log
```

## 生产环境部署

### 环境配置

生产环境需要修改以下配置：

1. **数据库配置**: 修改数据库连接地址和密码
2. **Redis配置**: 配置Redis集群地址
3. **Nacos配置**: 修改Nacos集群地址
4. **日志配置**: 配置日志级别和输出路径
5. **安全配置**: 修改默认密码和密钥

### 高可用部署

1. **负载均衡**: 配置Nginx或HAProxy
2. **服务集群**: 每个微服务部署多个实例
3. **数据库集群**: 配置MySQL主从集群或分布式数据库
4. **缓存集群**: 配置Redis集群
5. **监控告警**: 配置Prometheus告警规则

### 安全加固

1. **网络安全**: 配置防火墙和VPN
2. **数据加密**: 启用数据传输和存储加密
3. **访问控制**: 配置详细的权限控制
4. **审计日志**: 启用完整的审计日志

## 更新和维护

### 版本更新

```bash
# 停止服务
./scripts/start-services.sh stop

# 拉取最新代码
git pull origin main

# 重新编译
mvn clean compile -DskipTests

# 启动服务
./scripts/start-services.sh start
```

### 数据备份

```bash
# 备份MySQL数据
docker exec dlmp-mysql-master mysqldump -uroot -proot123456 --all-databases > backup.sql

# 备份配置文件
tar -czf config-backup.tar.gz backend/config/ docker/
```

### 性能优化

1. **JVM调优**: 调整堆内存、垃圾回收器参数
2. **数据库优化**: 优化索引、查询语句
3. **缓存优化**: 调整缓存策略和过期时间
4. **连接池优化**: 调整数据库和Redis连接池参数

## 联系支持

如果在部署过程中遇到问题，请联系技术支持团队。

---

**部署指南版本**: 1.0.0  
**最后更新**: 2025-07-12  
**维护者**: Claude AI Assistant