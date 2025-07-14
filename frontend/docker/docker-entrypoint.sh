#!/bin/bash
set -e

# 获取环境变量，设置默认值
API_BASE_URL=${API_BASE_URL:-"http://localhost:8080"}
WS_URL=${WS_URL:-"ws://localhost:8080"}

echo "Starting DLMP Frontend with the following configuration:"
echo "API_BASE_URL: $API_BASE_URL"
echo "WS_URL: $WS_URL"

# 替换nginx配置中的环境变量
envsubst '${API_BASE_URL} ${WS_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# 验证nginx配置
nginx -t

# 启动nginx
exec "$@"