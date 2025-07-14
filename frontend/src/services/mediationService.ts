import { http } from '@/utils/request'
import type { 
  MediationCase,
  MediationRecord,
  DocumentTemplate,
  PaginationData, 
  PaginationParams 
} from '@/types'

// 调解案件查询参数
export interface MediationQueryParams extends PaginationParams {
  caseNumber?: string
  borrowerName?: string
  mediatorName?: string
  status?: number
  createTimeRange?: string[]
  mediationCenterId?: number
  mediatorId?: number
}

// 更新调解案件参数
export interface UpdateMediationParams {
  mediationMethod?: string
  mediationLocation?: string
  appointmentTime?: string
  expectedDuration?: number
  mediationPlan?: string
  remarks?: string
  status?: number
}

// 调解记录参数
export interface MediationRecordParams {
  type: string
  title: string
  content: string
  contactTime?: string
  attachments?: Array<{
    name: string
    url: string
    size: number
  }>
}

// 文书生成参数
export interface DocumentGenerateParams {
  templateId: number
  title: string
  agreementAmount?: number
  paymentMethod?: string
  paymentSchedule?: string
  additionalTerms?: string
  variables?: Record<string, any>
}

// 调解通知参数
export interface NotificationParams {
  type: 'sms' | 'email' | 'phone'
  content: string
  recipient: string
  templateId?: number
}

// 电话记录参数
export interface PhoneCallParams {
  type: 'inbound' | 'outbound'
  duration: number
  notes?: string
  result?: string
}

// 调解完成参数
export interface CompleteMediationParams {
  status: number
  result: string
  completedTime: string
  agreementAmount?: number
  paymentSchedule?: string
  remarks?: string
}

// 新建调解案件参数
export interface CreateMediationCaseParams {
  borrowerName: string
  amount: number
  debtorIdCard?: string
  debtorPhone?: string
  clientName?: string
  mediatorId?: number
  mediatorName?: string
  mediationCenterId?: number
  mediationCenterName?: string
  mediationMethod?: 'online' | 'offline' | 'phone'
  mediationLocation?: string
  appointmentTime?: string
  expectedDuration?: number
  mediationPlan?: string
  remarks?: string
  createFromCase?: boolean
}

// 从现有案件创建调解案件参数
export interface CreateFromCaseParams {
  caseId: number
  mediatorId: number
  mediationCenterId: number
  mediationMethod?: 'online' | 'offline' | 'phone'
  appointmentTime?: string
  mediationPlan?: string
  remarks?: string
}

/**
 * 调解管理相关API
 */
export const mediationService = {
  // 调解案件管理
  /**
   * 分页查询调解案件
   */
  getMediationList: (params: MediationQueryParams): Promise<PaginationData<MediationCase>> => {
    return http.get('/mediation/cases', { params })
  },

  /**
   * 创建新的调解案件
   */
  createMediationCase: (params: CreateMediationCaseParams): Promise<{ data: MediationCase }> => {
    return http.post('/mediation/cases', params)
  },

  /**
   * 从现有案件创建调解案件
   */
  createFromCase: (params: CreateFromCaseParams): Promise<{ data: MediationCase }> => {
    return http.post('/mediation/cases/from-case', params)
  },

  /**
   * 获取可用于创建调解的案件列表
   */
  getAvailableCases: (params: { page: number, size: number, search?: string }): Promise<PaginationData<Case>> => {
    return http.get('/mediation/available-cases', { params })
  },

  /**
   * 根据ID获取调解案件详情
   */
  getMediationById: (id: number): Promise<{ data: MediationCase }> => {
    return http.get(`/mediation/cases/${id}`)
  },

  /**
   * 更新调解案件
   */
  updateMediationCase: (id: number, params: UpdateMediationParams): Promise<MediationCase> => {
    return http.put(`/mediation/cases/${id}`, params)
  },

  /**
   * 更新调解步骤
   */
  updateMediationStep: (id: number, step: number): Promise<string> => {
    return http.put(`/mediation/cases/${id}/step`, { step })
  },

  /**
   * 完成调解
   */
  completeMediation: (id: number, params: CompleteMediationParams): Promise<string> => {
    return http.put(`/mediation/cases/${id}/complete`, params)
  },

  // 调解记录管理
  /**
   * 获取调解记录
   */
  getMediationRecords: (caseId: number): Promise<{ data: MediationRecord[] }> => {
    return http.get(`/mediation/cases/${caseId}/records`)
  },

  /**
   * 添加调解记录
   */
  addMediationRecord: (caseId: number, params: MediationRecordParams): Promise<MediationRecord> => {
    return http.post(`/mediation/cases/${caseId}/records`, params)
  },

  /**
   * 更新调解记录
   */
  updateMediationRecord: (caseId: number, recordId: number, params: Partial<MediationRecordParams>): Promise<MediationRecord> => {
    return http.put(`/mediation/cases/${caseId}/records/${recordId}`, params)
  },

  /**
   * 删除调解记录
   */
  deleteMediationRecord: (caseId: number, recordId: number): Promise<string> => {
    return http.delete(`/mediation/cases/${caseId}/records/${recordId}`)
  },

  // 文书管理
  /**
   * 获取文书模板列表
   */
  getDocumentTemplates: (): Promise<{ data: DocumentTemplate[] }> => {
    return http.get('/mediation/document-templates')
  },

  /**
   * 生成文书
   */
  generateDocument: (caseId: number, params: DocumentGenerateParams): Promise<{ 
    data: { 
      documentId: number
      downloadUrl: string
      fileName: string
    } 
  }> => {
    return http.post(`/mediation/cases/${caseId}/documents`, params)
  },

  /**
   * 获取案件文书列表
   */
  getCaseDocuments: (caseId: number): Promise<{ data: Array<{
    id: number
    name: string
    type: string
    url: string
    size: number
    createTime: string
  }> }> => {
    return http.get(`/mediation/cases/${caseId}/documents`)
  },

  /**
   * 下载文书
   */
  downloadDocument: (documentId: number): Promise<Blob> => {
    return http.get(`/mediation/documents/${documentId}/download`, { responseType: 'blob' })
  },

  // 通知管理
  /**
   * 发送通知
   */
  sendNotification: (caseId: number, params: NotificationParams): Promise<string> => {
    return http.post(`/mediation/cases/${caseId}/notifications`, params)
  },

  /**
   * 获取通知历史
   */
  getNotificationHistory: (caseId: number): Promise<{ data: Array<{
    id: number
    type: string
    content: string
    recipient: string
    status: string
    sentTime: string
  }> }> => {
    return http.get(`/mediation/cases/${caseId}/notifications`)
  },

  // 通话记录
  /**
   * 记录电话
   */
  recordPhoneCall: (caseId: number, params: PhoneCallParams): Promise<string> => {
    return http.post(`/mediation/cases/${caseId}/phone-calls`, params)
  },

  /**
   * 获取通话记录
   */
  getPhoneCallRecords: (caseId: number): Promise<{ data: Array<{
    id: number
    type: string
    duration: number
    notes: string
    result: string
    callTime: string
  }> }> => {
    return http.get(`/mediation/cases/${caseId}/phone-calls`)
  },

  // 调解排期
  /**
   * 获取调解员日程
   */
  getMediatorSchedule: (mediatorId: number, startDate: string, endDate: string): Promise<{ data: Array<{
    id: number
    title: string
    start: string
    end: string
    type: string
    caseId?: number
    status: string
  }> }> => {
    return http.get(`/mediation/mediators/${mediatorId}/schedule`, {
      params: { startDate, endDate }
    })
  },

  /**
   * 预约调解时间
   */
  scheduleMediation: (caseId: number, params: {
    mediatorId: number
    startTime: string
    endTime: string
    location: string
    type: string
    notes?: string
  }): Promise<string> => {
    return http.post(`/mediation/cases/${caseId}/schedule`, params)
  },

  /**
   * 取消预约
   */
  cancelSchedule: (scheduleId: number, reason?: string): Promise<string> => {
    return http.delete(`/mediation/schedules/${scheduleId}`, {
      data: { reason }
    })
  },

  // 调解统计
  /**
   * 获取调解统计信息
   */
  getMediationStats: (startDate?: string, endDate?: string): Promise<{
    totalCases: number
    successCount: number
    failedCount: number
    inProgressCount: number
    successRate: number
    avgDuration: number
    avgSettlementAmount: number
    mediatorPerformance: Array<{
      mediatorId: number
      mediatorName: string
      caseCount: number
      successCount: number
      successRate: number
      avgDuration: number
    }>
  }> => {
    return http.get('/mediation/stats', {
      params: { startDate, endDate }
    })
  },

  /**
   * 获取调解趋势数据
   */
  getMediationTrend: (days: number = 30): Promise<Array<{
    date: string
    totalCases: number
    successCases: number
    failedCases: number
    successRate: number
  }>> => {
    return http.get('/mediation/trend', { params: { days } })
  },

  // 调解员管理
  /**
   * 获取调解员列表
   */
  getMediators: (mediationCenterId?: number): Promise<{ data: Array<{
    id: number
    name: string
    phone: string
    email: string
    mediationCenterId: number
    mediationCenterName: string
    specialty: string[]
    level: number
    status: number
    currentCases: number
    maxCases: number
    workloadRate: number
  }> }> => {
    return http.get('/mediation/mediators', {
      params: { mediationCenterId }
    })
  },

  /**
   * 获取调解员工作量
   */
  getMediatorWorkload: (mediatorId: number): Promise<{
    totalCases: number
    activeCases: number
    completedCases: number
    successRate: number
    avgProcessTime: number
    workloadDistribution: Array<{
      month: string
      caseCount: number
      successCount: number
    }>
  }> => {
    return http.get(`/mediation/mediators/${mediatorId}/workload`)
  },

  // 批量操作
  /**
   * 批量分配调解员
   */
  batchAssignMediator: (caseIds: number[], mediatorId: number): Promise<{
    successCount: number
    failCount: number
    details: Array<{
      caseId: number
      success: boolean
      reason?: string
    }>
  }> => {
    return http.post('/mediation/batch-assign', {
      caseIds,
      mediatorId
    })
  },

  /**
   * 批量更新状态
   */
  batchUpdateStatus: (caseIds: number[], status: number, reason?: string): Promise<{
    successCount: number
    failCount: number
  }> => {
    return http.put('/mediation/batch-status', {
      caseIds,
      status,
      reason
    })
  }
}