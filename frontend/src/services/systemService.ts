import { http } from '@/utils/request'
import type {
  SystemConfig,
  SystemConfigGroup,
  DataDictionary,
  DictType,
  OperationLog,
  LoginLog,
  SystemMonitor,
  SecuritySettings,
  BackupRecord,
  HealthCheck,
  PaginationParams,
  PaginationData
} from '@/types'

export interface SystemConfigParams extends PaginationParams {
  configKey?: string
  configType?: number
  category?: string
}

export interface LogParams extends PaginationParams {
  module?: string
  operation?: string
  status?: string
  startTime?: string
  endTime?: string
  userId?: number
}

export interface BackupParams {
  backupType: 'full' | 'incremental' | 'differential'
  backupName?: string
}

export const systemService = {
  // 系统配置管理
  getSystemConfigs: (params: SystemConfigParams) =>
    http.get<PaginationData<SystemConfig>>('/api/system/configs', { params }),

  getSystemConfigGroups: () =>
    http.get<SystemConfigGroup[]>('/api/system/config-groups'),

  getSystemConfig: (id: number) =>
    http.get<SystemConfig>(`/api/system/configs/${id}`),

  createSystemConfig: (data: Partial<SystemConfig>) =>
    http.post<SystemConfig>('/api/system/configs', data),

  updateSystemConfig: (id: number, data: Partial<SystemConfig>) =>
    http.put<SystemConfig>(`/api/system/configs/${id}`, data),

  deleteSystemConfig: (id: number) =>
    http.delete(`/api/system/configs/${id}`),

  batchUpdateConfigs: (configs: Array<{ id: number; configValue: string }>) =>
    http.put('/api/system/configs/batch', { configs }),

  resetConfigToDefault: (id: number) =>
    http.post(`/api/system/configs/${id}/reset`),

  // 数据字典管理
  getDictTypes: (params: PaginationParams) =>
    http.get<PaginationData<DictType>>('/api/system/dict-types', { params }),

  getDictItems: (typeCode: string) =>
    http.get<DataDictionary[]>(`/api/system/dict-items/${typeCode}`),

  createDictType: (data: Partial<DictType>) =>
    http.post<DictType>('/api/system/dict-types', data),

  updateDictType: (id: number, data: Partial<DictType>) =>
    http.put<DictType>(`/api/system/dict-types/${id}`, data),

  deleteDictType: (id: number) =>
    http.delete(`/api/system/dict-types/${id}`),

  createDictItem: (data: Partial<DataDictionary>) =>
    http.post<DataDictionary>('/api/system/dict-items', data),

  updateDictItem: (id: number, data: Partial<DataDictionary>) =>
    http.put<DataDictionary>(`/api/system/dict-items/${id}`, data),

  deleteDictItem: (id: number) =>
    http.delete(`/api/system/dict-items/${id}`),

  refreshDictCache: () =>
    http.post('/api/system/dict-cache/refresh'),

  // 操作日志
  getOperationLogs: (params: LogParams) =>
    http.get<PaginationData<OperationLog>>('/api/system/operation-logs', { params }),

  deleteOperationLogs: (ids: number[]) =>
    http.delete('/api/system/operation-logs', { data: { ids } }),

  clearOperationLogs: (days: number) =>
    http.delete(`/api/system/operation-logs/clear/${days}`),

  exportOperationLogs: (params: LogParams) =>
    http.get('/api/system/operation-logs/export', { 
      params,
      responseType: 'blob'
    }),

  // 登录日志
  getLoginLogs: (params: LogParams) =>
    http.get<PaginationData<LoginLog>>('/api/system/login-logs', { params }),

  deleteLoginLogs: (ids: number[]) =>
    http.delete('/api/system/login-logs', { data: { ids } }),

  clearLoginLogs: (days: number) =>
    http.delete(`/api/system/login-logs/clear/${days}`),

  // 系统监控
  getSystemMonitor: () =>
    http.get<SystemMonitor>('/api/system/monitor'),

  getSystemHealth: () =>
    http.get<HealthCheck>('/api/system/health'),

  // 安全设置
  getSecuritySettings: () =>
    http.get<SecuritySettings>('/api/system/security-settings'),

  updateSecuritySettings: (data: Partial<SecuritySettings>) =>
    http.put<SecuritySettings>('/api/system/security-settings', data),

  updatePasswordPolicy: (policy: SecuritySettings['passwordPolicy']) =>
    http.put('/api/system/security-settings/password-policy', policy),

  updateLoginSettings: (settings: SecuritySettings['loginSettings']) =>
    http.put('/api/system/security-settings/login-settings', settings),

  updateIpWhitelist: (ips: string[]) =>
    http.put('/api/system/security-settings/ip-whitelist', { ips }),

  updateIpBlacklist: (ips: string[]) =>
    http.put('/api/system/security-settings/ip-blacklist', { ips }),

  // 数据备份
  getBackupRecords: (params: PaginationParams) =>
    http.get<PaginationData<BackupRecord>>('/api/system/backups', { params }),

  createBackup: (params: BackupParams) =>
    http.post<BackupRecord>('/api/system/backups', params),

  deleteBackup: (id: number) =>
    http.delete(`/api/system/backups/${id}`),

  downloadBackup: (id: number) =>
    http.get(`/api/system/backups/${id}/download`, { responseType: 'blob' }),

  restoreBackup: (id: number) =>
    http.post(`/api/system/backups/${id}/restore`),

  // 系统维护
  clearSystemCache: () =>
    http.post('/api/system/maintenance/clear-cache'),

  optimizeDatabase: () =>
    http.post('/api/system/maintenance/optimize-db'),

  restartApplication: () =>
    http.post('/api/system/maintenance/restart'),

  getSystemInfo: () =>
    http.get('/api/system/info'),

  // 配置导入导出
  exportSystemConfig: () =>
    http.get('/api/system/configs/export', { responseType: 'blob' }),

  importSystemConfig: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post('/api/system/configs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 系统升级
  checkUpdate: () =>
    http.get('/api/system/update/check'),

  downloadUpdate: () =>
    http.post('/api/system/update/download'),

  installUpdate: () =>
    http.post('/api/system/update/install'),

  // 许可证管理
  getLicenseInfo: () =>
    http.get('/api/system/license'),

  updateLicense: (licenseKey: string) =>
    http.put('/api/system/license', { licenseKey }),

  validateLicense: () =>
    http.post('/api/system/license/validate')
}