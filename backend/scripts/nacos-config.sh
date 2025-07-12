#!/bin/bash

# Nacos配置管理脚本
# 作者: Claude AI Assistant
# 创建时间: 2025-07-12

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Nacos服务器配置
NACOS_SERVER="http://localhost:8848"
NACOS_USERNAME="nacos"
NACOS_PASSWORD="nacos"
NACOS_NAMESPACE="dev"
NACOS_GROUP="DLMP_GROUP"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取Nacos访问token
get_nacos_token() {
    local response=$(curl -s -X POST \
        "${NACOS_SERVER}/nacos/v1/auth/login" \
        -d "username=${NACOS_USERNAME}&password=${NACOS_PASSWORD}")
    
    if [[ $response == *"accessToken"* ]]; then
        echo $response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
    else
        log_error "获取Nacos访问token失败"
        exit 1
    fi
}

# 发布配置到Nacos
publish_config() {
    local dataId=$1
    local content=$2
    local token=$3
    
    log_info "发布配置: $dataId"
    
    curl -s -X POST \
        "${NACOS_SERVER}/nacos/v1/cs/configs" \
        -d "dataId=${dataId}" \
        -d "group=${NACOS_GROUP}" \
        -d "content=${content}" \
        -d "type=yaml" \
        -d "tenant=${NACOS_NAMESPACE}" \
        -H "Authorization: Bearer ${token}" > /dev/null
    
    if [ $? -eq 0 ]; then
        log_info "配置 $dataId 发布成功"
    else
        log_error "配置 $dataId 发布失败"
    fi
}

# 主函数
main() {
    log_info "开始配置Nacos配置中心..."
    
    # 获取访问token
    log_info "获取Nacos访问token..."
    TOKEN=$(get_nacos_token)
    
    if [ -z "$TOKEN" ]; then
        log_error "无法获取Nacos访问token"
        exit 1
    fi
    
    log_info "成功获取访问token"
    
    # 发布网关配置
    log_info "发布API网关配置..."
    GATEWAY_CONFIG="spring:
  cloud:
    gateway:
      routes:
        # 用户服务路由
        - id: user-service
          uri: lb://dlmp-user-service
          predicates:
            - Path=/user/**
          filters:
            - StripPrefix=1
        # 案件管理服务路由
        - id: case-service
          uri: lb://dlmp-case-service
          predicates:
            - Path=/case/**
          filters:
            - StripPrefix=1
        # 智能分案服务路由
        - id: assignment-service
          uri: lb://dlmp-assignment-service
          predicates:
            - Path=/assignment/**
          filters:
            - StripPrefix=1
        # 调解管理服务路由
        - id: mediation-service
          uri: lb://dlmp-mediation-service
          predicates:
            - Path=/mediation/**
          filters:
            - StripPrefix=1
        # 诉讼管理服务路由
        - id: litigation-service
          uri: lb://dlmp-litigation-service
          predicates:
            - Path=/litigation/**
          filters:
            - StripPrefix=1
        # 结算管理服务路由
        - id: settlement-service
          uri: lb://dlmp-settlement-service
          predicates:
            - Path=/settlement/**
          filters:
            - StripPrefix=1
        # 通知服务路由
        - id: notification-service
          uri: lb://dlmp-notification-service
          predicates:
            - Path=/notification/**
          filters:
            - StripPrefix=1
        # 文件管理服务路由
        - id: file-service
          uri: lb://dlmp-file-service
          predicates:
            - Path=/file/**
          filters:
            - StripPrefix=1"
    
    publish_config "dlmp-gateway-dev.yml" "$GATEWAY_CONFIG" "$TOKEN"
    
    # 发布Redis配置
    log_info "发布Redis公共配置..."
    REDIS_CONFIG="spring:
  redis:
    host: localhost
    port: 6379
    timeout: 10000ms
    lettuce:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0"
    
    publish_config "dlmp-redis-common-dev.yml" "$REDIS_CONFIG" "$TOKEN"
    
    # 发布数据库配置
    log_info "发布数据库公共配置..."
    DB_CONFIG="spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      auto-commit: true
      idle-timeout: 30000
      max-lifetime: 1800000
      connection-timeout: 30000
      connection-test-query: SELECT 1

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: false
    call-setters-on-nulls: true
    jdbc-type-for-null: 'null'
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  mapper-locations: classpath*:mapper/**/*Mapper.xml"
    
    publish_config "dlmp-database-common-dev.yml" "$DB_CONFIG" "$TOKEN"
    
    log_info "Nacos配置发布完成!"
    log_info "请访问 ${NACOS_SERVER}/nacos 查看配置"
    log_info "用户名: ${NACOS_USERNAME}, 密码: ${NACOS_PASSWORD}"
}

# 执行主函数
main "$@"