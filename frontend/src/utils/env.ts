/**
 * 环境变量工具
 */

// 获取环境变量
export const getEnv = (key: string, defaultValue?: string): string => {
  return import.meta.env[key] || defaultValue || ''
}

// 判断是否为开发环境
export const isDev = (): boolean => {
  return import.meta.env.DEV
}

// 判断是否为生产环境
export const isProd = (): boolean => {
  return import.meta.env.PROD
}

// 应用配置
export const appConfig = {
  // 应用信息
  title: getEnv('VITE_APP_TITLE', '个贷不良资产分散诉讼调解平台'),
  version: getEnv('VITE_APP_VERSION', '1.0.0'),
  
  // API配置
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:8080'),
  apiTimeout: Number(getEnv('VITE_API_TIMEOUT', '10000')),
  
  // 功能开关
  mockEnabled: getEnv('VITE_MOCK_ENABLED', 'false') === 'true',
  consoleLogEnabled: getEnv('VITE_CONSOLE_LOG_ENABLED', 'true') === 'true',
  
  // 构建配置
  sourcemap: getEnv('VITE_SOURCEMAP', 'false') === 'true',
  buildAnalyze: getEnv('VITE_BUILD_ANALYZE', 'false') === 'true',
  buildGzip: getEnv('VITE_BUILD_GZIP', 'false') === 'true',
}

// 控制台日志
export const log = {
  info: (...args: any[]) => {
    if (appConfig.consoleLogEnabled) {
      console.log('[INFO]', ...args)
    }
  },
  warn: (...args: any[]) => {
    if (appConfig.consoleLogEnabled) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args: any[]) => {
    if (appConfig.consoleLogEnabled) {
      console.error('[ERROR]', ...args)
    }
  },
  debug: (...args: any[]) => {
    if (appConfig.consoleLogEnabled && isDev()) {
      console.debug('[DEBUG]', ...args)
    }
  },
}