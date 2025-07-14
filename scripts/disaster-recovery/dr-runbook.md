# DLMP 容灾应急响应手册

## 概述

本手册提供了DLMP平台在各种灾难场景下的应急响应流程和恢复步骤。

## 应急响应团队

### 角色定义
- **主要负责人**: 系统架构师/技术总监
- **数据库专家**: DBA/数据库工程师
- **运维专家**: DevOps工程师/SRE
- **业务专家**: 产品经理/业务负责人
- **沟通协调员**: 项目经理/客服主管

### 联系方式
```
主要负责人: 张三 (13800138000, zhang.san@dlmp.com)
数据库专家: 李四 (13800138001, li.si@dlmp.com)
运维专家: 王五 (13800138002, wang.wu@dlmp.com)
业务专家: 赵六 (13800138003, zhao.liu@dlmp.com)
沟通协调员: 钱七 (13800138004, qian.qi@dlmp.com)
```

## 故障分级

### P0 - 紧急故障
- **定义**: 系统完全不可用，影响所有用户
- **响应时间**: 15分钟内
- **恢复目标**: 1小时内
- **示例**: 数据中心断电、核心数据库宕机

### P1 - 严重故障
- **定义**: 核心功能不可用，影响大部分用户
- **响应时间**: 30分钟内
- **恢复目标**: 4小时内
- **示例**: 主要微服务故障、网络中断

### P2 - 一般故障
- **定义**: 部分功能异常，影响少数用户
- **响应时间**: 2小时内
- **恢复目标**: 24小时内
- **示例**: 非核心服务异常、性能下降

### P3 - 轻微故障
- **定义**: 功能降级，用户体验影响较小
- **响应时间**: 4小时内
- **恢复目标**: 72小时内
- **示例**: 监控告警、日志异常

## 故障响应流程

### 1. 故障发现与报告
```mermaid
graph LR
    A[故障检测] --> B[确认故障]
    B --> C[故障分级]
    C --> D[组建应急团队]
    D --> E[启动应急响应]
```

#### 检测渠道
- 自动监控告警
- 用户反馈
- 运维巡检
- 业务方报告

#### 报告流程
1. 立即通知主要负责人
2. 在应急群组发布故障通知
3. 创建故障工单
4. 启动应急响应流程

### 2. 故障评估与决策
```bash
# 快速评估脚本
./scripts/disaster-recovery/quick-assessment.sh

# 评估内容:
# - 故障范围和影响面
# - 预计恢复时间
# - 需要的资源和人员
# - 可能的解决方案
```

### 3. 恢复执行
根据故障类型选择对应的恢复方案：

#### 数据库故障恢复
```bash
# 主从切换
./scripts/backup/mysql-backup.sh failover mysql-slave-1

# Point-in-time恢复
./scripts/backup/mysql-backup.sh restore "2024-01-01 12:00:00"
```

#### 应用服务恢复
```bash
# Kubernetes服务重启
kubectl rollout restart deployment/dlmp-backend -n dlmp-production

# 扩容服务
kubectl scale deployment dlmp-backend --replicas=5 -n dlmp-production
```

#### 基础设施恢复
```bash
# 节点故障处理
kubectl drain <node-name> --ignore-daemonsets
kubectl delete node <node-name>

# 存储故障处理
kubectl get pv,pvc -n dlmp-production
```

## 具体场景应急手册

### 场景1: MySQL主库故障

#### 故障现象
- 应用无法连接数据库
- 数据库连接超时
- 主库进程异常退出

#### 应急响应步骤

**步骤1: 快速评估**
```bash
# 检查主库状态
kubectl exec -it mysql-master-0 -n dlmp-production -- mysql -u root -p -e "SELECT 1;"

# 检查从库状态
kubectl exec -it mysql-slave-0 -n dlmp-production -- mysql -u root -p -e "SHOW SLAVE STATUS\G"
```

**步骤2: 主从切换**
```bash
# 停止应用连接
kubectl scale deployment dlmp-backend --replicas=0 -n dlmp-production

# 选择从库提升为主库
kubectl exec -it mysql-slave-0 -n dlmp-production -- mysql -u root -p -e "STOP SLAVE; RESET SLAVE ALL; SET GLOBAL read_only = OFF;"

# 更新应用配置
kubectl patch configmap dlmp-backend-config -n dlmp-production -p '{"data":{"database.host":"mysql-slave-0"}}'

# 重启应用
kubectl scale deployment dlmp-backend --replicas=3 -n dlmp-production
```

**步骤3: 验证恢复**
```bash
# 检查应用健康状态
kubectl get pods -n dlmp-production -l app=dlmp-backend

# 验证数据库连接
curl -f http://dlmp-backend:8080/actuator/health
```

### 场景2: Kubernetes集群故障

#### 故障现象
- Pod无法调度
- 节点不可达
- 存储访问异常

#### 应急响应步骤

**步骤1: 集群健康检查**
```bash
# 检查节点状态
kubectl get nodes -o wide

# 检查关键组件
kubectl get pods -n kube-system

# 检查存储状态
kubectl get pv,pvc --all-namespaces
```

**步骤2: 节点恢复**
```bash
# 驱逐故障节点
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 删除故障节点
kubectl delete node <node-name>

# 等待Pod重新调度
kubectl get pods -n dlmp-production -o wide
```

**步骤3: 服务恢复**
```bash
# 检查服务状态
kubectl get svc,endpoints -n dlmp-production

# 重启关键服务
kubectl rollout restart deployment/dlmp-backend -n dlmp-production
kubectl rollout restart deployment/dlmp-frontend -n dlmp-production
```

### 场景3: 数据中心灾难

#### 故障现象
- 整个数据中心不可访问
- 网络完全中断
- 多个系统同时故障

#### 应急响应步骤

**步骤1: 激活灾备中心**
```bash
# 切换DNS指向灾备中心
# 更新域名解析: dlmp.example.com -> 灾备IP

# 启动灾备环境
./scripts/disaster-recovery/activate-dr-site.sh
```

**步骤2: 数据恢复**
```bash
# 从备份恢复数据
./scripts/backup/mysql-backup.sh restore "$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')"

# 同步最新文件
aws s3 sync s3://dlmp-backup/latest/ /backup/restore/
```

**步骤3: 业务切换**
```bash
# 部署应用到灾备环境
kubectl apply -f k8s/ -n dlmp-disaster-recovery

# 验证服务可用性
./scripts/disaster-recovery/verify-dr-services.sh
```

## 恢复后处理

### 1. 系统验证
- 功能完整性测试
- 性能基准测试
- 数据完整性校验
- 安全性检查

### 2. 故障分析
- 根因分析报告
- 时间线重建
- 影响评估
- 改进建议

### 3. 预防措施
- 监控规则优化
- 告警阈值调整
- 备份策略改进
- 文档更新

## 沟通模板

### 故障通知模板
```
【故障通知】DLMP平台故障 - P{级别}

故障时间: {发生时间}
影响范围: {影响的功能和用户}
故障现象: {具体表现}
当前状态: {处理进展}
预计恢复: {预计恢复时间}

应急团队已启动响应流程，将持续跟进处理进展。
```

### 恢复通知模板
```
【恢复通知】DLMP平台服务已恢复

故障时间: {故障开始} - {恢复完成}
故障原因: {简要原因}
解决方案: {采取的措施}
后续安排: {预防措施}

感谢大家的耐心等待，如有问题请及时反馈。
```

## 联系方式

### 紧急联系电话
- 7x24技术支持: 400-xxx-xxxx
- 应急值班手机: 138-xxxx-xxxx

### 外部供应商
- 云服务商技术支持: xxx-xxxx-xxxx
- 网络运营商客服: xxx-xxxx-xxxx
- 硬件厂商技术支持: xxx-xxxx-xxxx

## 文档版本
- 版本: v1.0
- 更新时间: 2024-01-01
- 下次评审: 2024-04-01