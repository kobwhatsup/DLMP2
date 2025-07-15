#!/bin/bash

# 个贷不良资产分散诉讼调解平台数据库初始化脚本

echo "=== 个贷不良资产分散诉讼调解平台数据库初始化 ==="
echo ""

# 检查MySQL是否运行
echo "1. 检查MySQL服务状态..."
if ! pgrep -x "mysqld" > /dev/null; then
    echo "错误: MySQL服务未运行，请先启动MySQL服务"
    echo "可以使用以下命令启动MySQL:"
    echo "  brew services start mysql"
    echo "  或者"
    echo "  sudo /usr/local/mysql/support-files/mysql.server start"
    exit 1
fi
echo "✓ MySQL服务正在运行"

# 检查MySQL连接
echo ""
echo "2. 测试MySQL连接..."
if ! mysql -u root -p -e "SELECT 1;" >/dev/null 2>&1; then
    echo "错误: 无法连接到MySQL数据库"
    echo "请检查MySQL用户名和密码是否正确"
    exit 1
fi
echo "✓ MySQL连接正常"

# 创建数据库和表结构
echo ""
echo "3. 创建数据库和表结构..."
mysql -u root -p < "$(dirname "$0")/schema.sql"
if [ $? -eq 0 ]; then
    echo "✓ 数据库和表结构创建成功"
else
    echo "✗ 数据库和表结构创建失败"
    exit 1
fi

# 插入初始数据
echo ""
echo "4. 插入初始数据..."
mysql -u root -p < "$(dirname "$0")/init_data.sql"
if [ $? -eq 0 ]; then
    echo "✓ 初始数据插入成功"
else
    echo "✗ 初始数据插入失败"
    exit 1
fi

# 验证数据
echo ""
echo "5. 验证数据..."
USER_COUNT=$(mysql -u root -p -s -N -e "USE dlmp_platform; SELECT COUNT(*) FROM users;")
CASE_COUNT=$(mysql -u root -p -s -N -e "USE dlmp_platform; SELECT COUNT(*) FROM cases;")
TEMPLATE_COUNT=$(mysql -u root -p -s -N -e "USE dlmp_platform; SELECT COUNT(*) FROM document_templates;")

echo "✓ 用户数据: $USER_COUNT 条"
echo "✓ 案件数据: $CASE_COUNT 条"
echo "✓ 模板数据: $TEMPLATE_COUNT 条"

echo ""
echo "=== 数据库初始化完成 ==="
echo ""
echo "数据库信息:"
echo "  数据库名: dlmp_platform"
echo "  主机: localhost"
echo "  端口: 3306"
echo ""
echo "接下来请："
echo "1. 修改 mock-backend/config/database.js 中的数据库密码"
echo "2. 重启后端服务以使用MySQL数据库"
echo ""