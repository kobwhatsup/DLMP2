/**
 * 环境变量配置
 */

// 环境类型
export type Environment = 'development' | 'test' | 'production'

// 环境配置接口
export interface EnvConfig {
  NODE_ENV: Environment
  API_BASE_URL: string
  API_TIMEOUT: number
  APP_TITLE: string
  APP_VERSION: string
  MOCK_ENABLED: boolean
  CONSOLE_LOG_ENABLED: boolean
  DEBUG: boolean
  SOURCEMAP: boolean
  WS_URL: string
  UPLOAD_MAX_SIZE: number
  UPLOAD_ALLOWED_TYPES: string[]
  CDN_URL?: string
  SENTRY_DSN?: string
  ANALYTICS_ID?: string
}

// 获取环境变量值
const getEnvValue = (key: string, defaultValue: any = undefined): any => {
  const value = import.meta.env[key]
  if (value === undefined) {
    return defaultValue
  }
  
  // 处理布尔值
  if (value === 'true') return true
  if (value === 'false') return false
  
  // 处理数字
  if (/^\d+$/.test(value)) return Number(value)
  
  return value
}

// 当前环境配置
export const env: EnvConfig = {
  NODE_ENV: getEnvValue('VITE_NODE_ENV', 'development') as Environment,
  API_BASE_URL: getEnvValue('VITE_API_BASE_URL', 'http://localhost:8080'),
  API_TIMEOUT: getEnvValue('VITE_API_TIMEOUT', 10000),
  APP_TITLE: getEnvValue('VITE_APP_TITLE', '个贷不良资产分散诉讼调解平台'),
  APP_VERSION: getEnvValue('VITE_APP_VERSION', '1.0.0'),
  MOCK_ENABLED: getEnvValue('VITE_MOCK_ENABLED', false),
  CONSOLE_LOG_ENABLED: getEnvValue('VITE_CONSOLE_LOG_ENABLED', true),
  DEBUG: getEnvValue('VITE_DEBUG', false),
  SOURCEMAP: getEnvValue('VITE_SOURCEMAP', false),
  WS_URL: getEnvValue('VITE_WS_URL', 'ws://localhost:8080/ws'),
  UPLOAD_MAX_SIZE: getEnvValue('VITE_UPLOAD_MAX_SIZE', 10485760),
  UPLOAD_ALLOWED_TYPES: getEnvValue('VITE_UPLOAD_ALLOWED_TYPES', '.pdf,.doc,.docx,.jpg,.jpeg,.png').split(','),
  CDN_URL: getEnvValue('VITE_CDN_URL'),
  SENTRY_DSN: getEnvValue('VITE_SENTRY_DSN'),
  ANALYTICS_ID: getEnvValue('VITE_ANALYTICS_ID')
}

// 环境判断
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'
export const isProduction = env.NODE_ENV === 'production'

// 日志输出
export const logger = {
  log: (...args: any[]) => {
    if (env.CONSOLE_LOG_ENABLED) {
      console.log('[DLMP]', ...args)
    }
  },
  warn: (...args: any[]) => {
    if (env.CONSOLE_LOG_ENABLED) {
      console.warn('[DLMP]', ...args)
    }
  },
  error: (...args: any[]) => {
    if (env.CONSOLE_LOG_ENABLED) {
      console.error('[DLMP]', ...args)
    }
  },
  debug: (...args: any[]) => {
    if (env.DEBUG && env.CONSOLE_LOG_ENABLED) {
      console.debug('[DLMP]', ...args)
    }
  }
}

// 导出配置信息
export default env