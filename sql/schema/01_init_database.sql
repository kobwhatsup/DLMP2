-- 个贷不良资产分散诉讼调解平台数据库初始化脚本
-- 创建时间: 2025-07-12
-- 说明: 创建各个业务数据库

-- 创建用户管理数据库
CREATE DATABASE IF NOT EXISTS user_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建案件管理数据库
CREATE DATABASE IF NOT EXISTS case_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建调解管理数据库
CREATE DATABASE IF NOT EXISTS mediation_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建诉讼管理数据库
CREATE DATABASE IF NOT EXISTS litigation_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建结算管理数据库
CREATE DATABASE IF NOT EXISTS settlement_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建日志数据库
CREATE DATABASE IF NOT EXISTS log_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建Nacos配置数据库
CREATE DATABASE IF NOT EXISTS nacos_config DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建数据库用户并授权
CREATE USER IF NOT EXISTS 'dlmp_user'@'%' IDENTIFIED BY 'dlmp123456';
GRANT ALL PRIVILEGES ON user_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON case_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON mediation_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON litigation_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON settlement_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON log_db.* TO 'dlmp_user'@'%';
GRANT ALL PRIVILEGES ON nacos_config.* TO 'dlmp_user'@'%';

-- 创建只读用户（用于从库读取）
CREATE USER IF NOT EXISTS 'dlmp_reader'@'%' IDENTIFIED BY 'dlmp_read123';
GRANT SELECT ON user_db.* TO 'dlmp_reader'@'%';
GRANT SELECT ON case_db.* TO 'dlmp_reader'@'%';
GRANT SELECT ON mediation_db.* TO 'dlmp_reader'@'%';
GRANT SELECT ON litigation_db.* TO 'dlmp_reader'@'%';
GRANT SELECT ON settlement_db.* TO 'dlmp_reader'@'%';
GRANT SELECT ON log_db.* TO 'dlmp_reader'@'%';

FLUSH PRIVILEGES;