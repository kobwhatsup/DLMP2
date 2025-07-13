import request from './request'
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
    request.get<PaginationData<SystemConfig>>('/api/system/configs', { params }),

  getSystemConfigGroups: () =>
    request.get<SystemConfigGroup[]>('/api/system/config-groups'),

  getSystemConfig: (id: number) =>
    request.get<SystemConfig>(`/api/system/configs/${id}`),

  createSystemConfig: (data: Partial<SystemConfig>) =>
    request.post<SystemConfig>('/api/system/configs', data),

  updateSystemConfig: (id: number, data: Partial<SystemConfig>) =>
    request.put<SystemConfig>(`/api/system/configs/${id}`, data),

  deleteSystemConfig: (id: number) =>
    request.delete(`/api/system/configs/${id}`),

  batchUpdateConfigs: (configs: Array<{ id: number; configValue: string }>) =>
    request.put('/api/system/configs/batch', { configs }),

  resetConfigToDefault: (id: number) =>
    request.post(`/api/system/configs/${id}/reset`),

  // 数据字典管理
  getDictTypes: (params: PaginationParams) =>
    request.get<PaginationData<DictType>>('/api/system/dict-types', { params }),

  getDictItems: (typeCode: string) =>
    request.get<DataDictionary[]>(`/api/system/dict-items/${typeCode}`),

  createDictType: (data: Partial<DictType>) =>
    request.post<DictType>('/api/system/dict-types', data),

  updateDictType: (id: number, data: Partial<DictType>) =>
    request.put<DictType>(`/api/system/dict-types/${id}`, data),

  deleteDictType: (id: number) =>
    request.delete(`/api/system/dict-types/${id}`),

  createDictItem: (data: Partial<DataDictionary>) =>
    request.post<DataDictionary>('/api/system/dict-items', data),

  updateDictItem: (id: number, data: Partial<DataDictionary>) =>
    request.put<DataDictionary>(`/api/system/dict-items/${id}`, data),

  deleteDictItem: (id: number) =>
    request.delete(`/api/system/dict-items/${id}`),

  refreshDictCache: () =>
    request.post('/api/system/dict-cache/refresh'),

  // 操作日志
  getOperationLogs: (params: LogParams) =>
    request.get<PaginationData<OperationLog>>('/api/system/operation-logs', { params }),

  deleteOperationLogs: (ids: number[]) =>
    request.delete('/api/system/operation-logs', { data: { ids } }),

  clearOperationLogs: (days: number) =>
    request.delete(`/api/system/operation-logs/clear/${days}`),

  exportOperationLogs: (params: LogParams) =>
    request.get('/api/system/operation-logs/export', { 
      params,
      responseType: 'blob'
    }),

  // 登录日志
  getLoginLogs: (params: LogParams) =>
    request.get<PaginationData<LoginLog>>('/api/system/login-logs', { params }),

  deleteLoginLogs: (ids: number[]) =>
    request.delete('/api/system/login-logs', { data: { ids } }),

  clearLoginLogs: (days: number) =>
    request.delete(`/api/system/login-logs/clear/${days}`),

  // 系统监控
  getSystemMonitor: () =>
    request.get<SystemMonitor>('/api/system/monitor'),

  getSystemHealth: () =>
    request.get<HealthCheck>('/api/system/health'),

  // 安全设置
  getSecuritySettings: () =>
    request.get<SecuritySettings>('/api/system/security-settings'),

  updateSecuritySettings: (data: Partial<SecuritySettings>) =>
    request.put<SecuritySettings>('/api/system/security-settings', data),

  updatePasswordPolicy: (policy: SecuritySettings['passwordPolicy']) =>
    request.put('/api/system/security-settings/password-policy', policy),

  updateLoginSettings: (settings: SecuritySettings['loginSettings']) =>
    request.put('/api/system/security-settings/login-settings', settings),

  updateIpWhitelist: (ips: string[]) =>
    request.put('/api/system/security-settings/ip-whitelist', { ips }),

  updateIpBlacklist: (ips: string[]) =>
    request.put('/api/system/security-settings/ip-blacklist', { ips }),

  // 数据备份
  getBackupRecords: (params: PaginationParams) =>
    request.get<PaginationData<BackupRecord>>('/api/system/backups', { params }),

  createBackup: (params: BackupParams) =>
    request.post<BackupRecord>('/api/system/backups', params),

  deleteBackup: (id: number) =>
    request.delete(`/api/system/backups/${id}`),

  downloadBackup: (id: number) =>
    request.get(`/api/system/backups/${id}/download`, { responseType: 'blob' }),

  restoreBackup: (id: number) =>
    request.post(`/api/system/backups/${id}/restore`),

  // 系统维护
  clearSystemCache: () =>
    request.post('/api/system/maintenance/clear-cache'),

  optimizeDatabase: () =>
    request.post('/api/system/maintenance/optimize-db'),

  restartApplication: () =>
    request.post('/api/system/maintenance/restart'),

  getSystemInfo: () =>
    request.get('/api/system/info'),

  // 配置导入导出
  exportSystemConfig: () =>
    request.get('/api/system/configs/export', { responseType: 'blob' }),

  importSystemConfig: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/api/system/configs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 系统升级
  checkUpdate: () =>
    request.get('/api/system/update/check'),

  downloadUpdate: () =>
    request.post('/api/system/update/download'),

  installUpdate: () =>
    request.post('/api/system/update/install'),

  // 许可证管理
  getLicenseInfo: () =>
    request.get('/api/system/license'),

  updateLicense: (licenseKey: string) =>
    request.put('/api/system/license', { licenseKey }),

  validateLicense: () =>
    request.post('/api/system/license/validate')
}