import { http } from '@/utils/request'
import type { 
  LitigationCase,
  ExecutionRecord,
  CourtEvent,
  PaginationData, 
  PaginationParams 
} from '@/types'

// 诉讼案件查询参数
export interface LitigationQueryParams extends PaginationParams {
  caseNumber?: string
  borrowerName?: string
  courtName?: string
  status?: number
  stage?: number
  createTimeRange?: string[]
  courtCaseNumber?: string
  judgeName?: string
}

// 创建诉讼案件参数
export interface CreateLitigationParams {
  caseId: number
  courtName: string
  courtCaseNumber?: string
  judgeName?: string
  plaintiffLawyer?: string
  filingDate?: string
  caseDescription?: string
  claimAmount?: number
}

// 更新诉讼案件参数
export interface UpdateLitigationParams {
  courtName?: string
  courtCaseNumber?: string
  judgeName?: string
  plaintiffLawyer?: string
  filingDate?: string
  trialDate?: string
  judgmentDate?: string
  judgmentAmount?: number
  executionCourt?: string
  caseDescription?: string
  remarks?: string
  status?: number
}

// 法院事件参数
export interface CourtEventParams {
  type: string
  title: string
  scheduledTime: string
  location?: string
  description?: string
  status: string
}

// 执行记录参数
export interface ExecutionRecordParams {
  type: string
  title: string
  content: string
  amount?: number
  executeTime?: string
  attachments?: Array<{
    name: string
    url: string
    size: number
  }>
}

// 文书生成参数
export interface LegalDocumentParams {
  templateId: number
  title: string
  content?: string
  variables?: Record<string, any>
}

// 诉讼统计参数
export interface LitigationStatsParams {
  startDate?: string
  endDate?: string
  courtName?: string
  stage?: number
}

/**
 * 诉讼管理相关API
 */
export const litigationService = {
  // 诉讼案件管理
  /**
   * 分页查询诉讼案件
   */
  getLitigationList: (params: LitigationQueryParams): Promise<PaginationData<LitigationCase>> => {
    return http.get('/litigation/cases', { params })
  },

  /**
   * 根据ID获取诉讼案件详情
   */
  getLitigationById: (id: number): Promise<{ data: LitigationCase }> => {
    return http.get(`/litigation/cases/${id}`)
  },

  /**
   * 创建诉讼案件
   */
  createLitigation: (params: CreateLitigationParams): Promise<LitigationCase> => {
    return http.post('/litigation/cases', params)
  },

  /**
   * 更新诉讼案件
   */
  updateLitigation: (id: number, params: UpdateLitigationParams): Promise<LitigationCase> => {
    return http.put(`/litigation/cases/${id}`, params)
  },

  /**
   * 删除诉讼案件
   */
  deleteLitigation: (id: number): Promise<string> => {
    return http.delete(`/litigation/cases/${id}`)
  },

  /**
   * 更新诉讼阶段
   */
  updateLitigationStage: (id: number, stage: number, progress?: number): Promise<string> => {
    return http.put(`/litigation/cases/${id}/stage`, { stage, progress })
  },

  /**
   * 获取可转诉讼的调解失败案件
   */
  getAvailableMediationCases: (params: { page: number, size: number, search?: string }): Promise<PaginationData<any>> => {
    return http.get('/litigation/available-mediation-cases', { params })
  },

  // 文书管理
  /**
   * 获取诉讼文书模板
   */
  getDocumentTemplates: (): Promise<{ data: any[] }> => {
    return http.get('/litigation/document-templates')
  },

  /**
   * 生成诉讼文书
   */
  generateDocument: (caseId: number, params: any): Promise<{ data: any }> => {
    return http.post(`/litigation/cases/${caseId}/documents`, params)
  },

  /**
   * 完成诉讼
   */
  completeLitigation: (id: number): Promise<string> => {
    return http.put(`/litigation/cases/${id}/complete`)
  },

  // 法院事件管理
  /**
   * 获取法院事件列表
   */
  getCourtEvents: (caseId: number): Promise<{ data: CourtEvent[] }> => {
    return http.get(`/litigation/cases/${caseId}/events`)
  },

  /**
   * 获取诉讼统计
   */
  getLitigationStats: (params?: LitigationStatsParams): Promise<{ data: any }> => {
    return http.get('/litigation/stats', { params })
  },

  /**
   * 添加法院事件
   */
  addCourtEvent: (caseId: number, params: CourtEventParams): Promise<CourtEvent> => {
    return http.post(`/litigation/cases/${caseId}/events`, params)
  },

  /**
   * 更新法院事件
   */
  updateCourtEvent: (eventId: number, params: Partial<CourtEventParams>): Promise<CourtEvent> => {
    return http.put(`/litigation/events/${eventId}`, params)
  },

  /**
   * 删除法院事件
   */
  deleteCourtEvent: (eventId: number): Promise<string> => {
    return http.delete(`/litigation/events/${eventId}`)
  },

  // 执行记录管理
  /**
   * 获取执行记录
   */
  getExecutionRecords: (caseId: number): Promise<{ data: ExecutionRecord[] }> => {
    return http.get(`/litigation/cases/${caseId}/executions`)
  },

  /**
   * 添加执行记录
   */
  addExecutionRecord: (caseId: number, params: ExecutionRecordParams): Promise<ExecutionRecord> => {
    return http.post(`/litigation/cases/${caseId}/executions`, params)
  },

  /**
   * 更新执行记录
   */
  updateExecutionRecord: (recordId: number, params: Partial<ExecutionRecordParams>): Promise<ExecutionRecord> => {
    return http.put(`/litigation/executions/${recordId}`, params)
  },

  /**
   * 删除执行记录
   */
  deleteExecutionRecord: (recordId: number): Promise<string> => {
    return http.delete(`/litigation/executions/${recordId}`)
  },

  // 文书管理
  /**
   * 获取法律文书模板
   */
  getLegalDocumentTemplates: (): Promise<{ data: Array<{
    id: number
    name: string
    type: string
    category: string
    description: string
  }> }> => {
    return http.get('/litigation/document-templates')
  },

  /**
   * 生成法律文书
   */
  generateLegalDocument: (caseId: number, params: LegalDocumentParams): Promise<{ 
    data: { 
      documentId: number
      downloadUrl: string
      fileName: string
    } 
  }> => {
    return http.post(`/litigation/cases/${caseId}/documents`, params)
  },


  /**
   * 下载文书
   */
  downloadDocument: (documentId: number): Promise<Blob> => {
    return http.get(`/litigation/documents/${documentId}/download`, { responseType: 'blob' })
  },

  // 开庭排期管理
  /**
   * 获取开庭排期
   */
  getCourtSchedule: (startDate: string, endDate: string): Promise<{ data: Array<{
    id: number
    caseId: number
    caseNumber: string
    courtName: string
    trialDate: string
    judgeName: string
    status: string
  }> }> => {
    return http.get('/litigation/court-schedule', {
      params: { startDate, endDate }
    })
  },

  /**
   * 安排开庭时间
   */
  scheduleCourtTrial: (caseId: number, params: {
    trialDate: string
    courtroom?: string
    judgeName?: string
    notes?: string
  }): Promise<string> => {
    return http.post(`/litigation/cases/${caseId}/schedule`, params)
  },

  /**
   * 取消开庭安排
   */
  cancelCourtTrial: (caseId: number, reason?: string): Promise<string> => {
    return http.delete(`/litigation/cases/${caseId}/schedule`, {
      data: { reason }
    })
  },


  /**
   * 获取诉讼趋势数据
   */
  getLitigationTrend: (days: number = 30): Promise<Array<{
    date: string
    newCases: number
    completedCases: number
    recoveredAmount: number
  }>> => {
    return http.get('/litigation/trend', { params: { days } })
  },

  /**
   * 获取执行效果分析
   */
  getExecutionAnalysis: (startDate?: string, endDate?: string): Promise<{
    totalExecutions: number
    successfulExecutions: number
    partialExecutions: number
    failedExecutions: number
    totalRecoveredAmount: number
    avgRecoveryTime: number
    executionMethods: Array<{
      method: string
      count: number
      successRate: number
      avgAmount: number
    }>
  }> => {
    return http.get('/litigation/execution-analysis', {
      params: { startDate, endDate }
    })
  },

  // 法院管理
  /**
   * 获取法院列表
   */
  getCourts: (): Promise<{ data: Array<{
    id: number
    name: string
    address: string
    contactPhone: string
    jurisdiction: string
    level: string
  }> }> => {
    return http.get('/litigation/courts')
  },

  /**
   * 获取法官列表
   */
  getJudges: (courtId?: number): Promise<{ data: Array<{
    id: number
    name: string
    courtId: number
    courtName: string
    department: string
    phone: string
    email: string
  }> }> => {
    return http.get('/litigation/judges', {
      params: { courtId }
    })
  },

  // 批量操作
  /**
   * 批量更新案件状态
   */
  batchUpdateStatus: (caseIds: number[], status: number, reason?: string): Promise<{
    successCount: number
    failCount: number
  }> => {
    return http.put('/litigation/batch-status', {
      caseIds,
      status,
      reason
    })
  },

  /**
   * 批量分配法官
   */
  batchAssignJudge: (caseIds: number[], judgeId: number): Promise<{
    successCount: number
    failCount: number
    details: Array<{
      caseId: number
      success: boolean
      reason?: string
    }>
  }> => {
    return http.post('/litigation/batch-assign-judge', {
      caseIds,
      judgeId
    })
  },

  /**
   * 批量导出案件
   */
  exportCases: (params: LitigationQueryParams): Promise<Blob> => {
    return http.get('/litigation/cases/export', {
      params,
      responseType: 'blob'
    })
  },

  // 案件转移
  /**
   * 案件转移到其他法院
   */
  transferCase: (caseId: number, params: {
    targetCourtId: number
    reason: string
    transferDate: string
  }): Promise<string> => {
    return http.post(`/litigation/cases/${caseId}/transfer`, params)
  },

  /**
   * 获取案件转移历史
   */
  getCaseTransferHistory: (caseId: number): Promise<{ data: Array<{
    id: number
    fromCourtName: string
    toCourtName: string
    reason: string
    transferDate: string
    operatorName: string
  }> }> => {
    return http.get(`/litigation/cases/${caseId}/transfer-history`)
  }
}