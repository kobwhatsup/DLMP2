import { http } from '@/utils/request'
import type { 
  PaginationData, 
  PaginationParams 
} from '@/types'

// 结算记录
export interface SettlementRecord {
  id: number
  settlementNumber: string
  caseId: number
  caseNumber: string
  clientId: number
  clientName: string
  settlementType: string
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  status: SettlementStatus
  dueDate?: string
  description?: string
  feeDetails?: FeeDetail[]
  createTime: string
  updateTime?: string
  creatorId: number
  creatorName: string
}

// 结算状态枚举
export enum SettlementStatus {
  DRAFT = 1, // 草稿
  PENDING = 2, // 待审核
  APPROVED = 3, // 已审核
  PAID = 4, // 已付款
  PARTIAL_PAID = 5, // 部分付款
  OVERDUE = 6, // 逾期
  CANCELLED = 7, // 已取消
}

// 费用类型枚举
export enum FeeType {
  SERVICE_FEE = 1, // 服务费
  LITIGATION_FEE = 2, // 诉讼费
  EXECUTION_FEE = 3, // 执行费
  COMMISSION = 4, // 佣金
  OTHER = 5, // 其他费用
}

// 费用明细
export interface FeeDetail {
  id: number
  feeType: FeeType
  description: string
  amount: number
  calculationMethod: string
  baseAmount?: number
  rate?: number
  formula?: string
  remarks?: string
}

// 结算查询参数
export interface SettlementQueryParams extends PaginationParams {
  caseNumber?: string
  clientName?: string
  status?: SettlementStatus
  settlementType?: string
  createTimeRange?: string[]
  amountRange?: [number, number]
  dueTimeRange?: string[]
}

// 创建结算参数
export interface CreateSettlementParams {
  caseId: number
  settlementType: string
  feeDetails: Omit<FeeDetail, 'id'>[]
  dueDate?: string
  description?: string
}

// 更新结算参数
export interface UpdateSettlementParams {
  settlementType?: string
  feeDetails?: FeeDetail[]
  dueDate?: string
  description?: string
  status?: SettlementStatus
}

// 费用计算参数
export interface FeeCalculationParams {
  caseId: number
  settlementType: string
  baseAmount: number
  feeTypes: FeeType[]
  customRates?: Record<string, number>
}

// 结算统计
export interface SettlementStats {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalCount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
}

// 结算报表参数
export interface SettlementReportParams {
  reportType: 'summary' | 'detail' | 'aging' | 'trend'
  startDate: string
  endDate: string
  settlementType?: string
  clientId?: number
  groupBy?: 'day' | 'week' | 'month'
}

/**
 * 结算管理相关API
 */
export const settlementService = {
  // 结算记录管理
  /**
   * 分页查询结算列表
   */
  getSettlementList: (params: SettlementQueryParams): Promise<PaginationData<SettlementRecord>> => {
    return http.get('/settlement/records', { params })
  },

  /**
   * 根据ID获取结算详情
   */
  getSettlementById: (id: number): Promise<{ data: SettlementRecord }> => {
    return http.get(`/settlement/records/${id}`)
  },

  /**
   * 创建结算记录
   */
  createSettlement: (params: CreateSettlementParams): Promise<{ data: SettlementRecord }> => {
    return http.post('/settlement/records', params)
  },

  /**
   * 更新结算记录
   */
  updateSettlement: (id: number, params: UpdateSettlementParams): Promise<{ data: SettlementRecord }> => {
    return http.put(`/settlement/records/${id}`, params)
  },

  /**
   * 删除结算记录
   */
  deleteSettlement: (id: number): Promise<{ data: string }> => {
    return http.delete(`/settlement/records/${id}`)
  },

  /**
   * 提交结算审核
   */
  submitSettlement: (id: number): Promise<{ data: string }> => {
    return http.post(`/settlement/records/${id}/submit`)
  },

  /**
   * 审核结算
   */
  approveSettlement: (id: number, approved: boolean, reason?: string): Promise<{ data: string }> => {
    return http.post(`/settlement/records/${id}/approve`, { approved, reason })
  },

  /**
   * 确认付款
   */
  confirmPayment: (id: number, params: {
    paidAmount: number
    paymentDate: string
    paymentMethod: string
    transactionId?: string
    remarks?: string
  }): Promise<{ data: string }> => {
    return http.post(`/settlement/records/${id}/payment`, params)
  },

  // 费用计算
  /**
   * 费用计算
   */
  calculateFees: (params: FeeCalculationParams): Promise<{ data: {
    totalAmount: number
    feeDetails: FeeDetail[]
    calculation: {
      baseAmount: number
      totalFees: number
      breakdown: Array<{
        feeType: FeeType
        amount: number
        rate: number
        calculation: string
      }>
    }
  } }> => {
    return http.post('/settlement/calculate-fees', params)
  },

  /**
   * 获取费用计算规则
   */
  getFeeRules: (settlementType?: string): Promise<{ data: Array<{
    id: number
    feeType: FeeType
    feeTypeName: string
    rate: number
    minAmount?: number
    maxAmount?: number
    formula: string
    description: string
    isActive: boolean
  }> }> => {
    return http.get('/settlement/fee-rules', { params: { settlementType } })
  },

  /**
   * 更新费用计算规则
   */
  updateFeeRule: (ruleId: number, params: {
    rate?: number
    minAmount?: number
    maxAmount?: number
    formula?: string
    isActive?: boolean
  }): Promise<{ data: string }> => {
    return http.put(`/settlement/fee-rules/${ruleId}`, params)
  },

  // 结算统计
  /**
   * 获取结算统计信息
   */
  getSettlementStats: (params?: {
    startDate?: string
    endDate?: string
    settlementType?: string
    clientId?: number
  }): Promise<SettlementStats> => {
    return http.get('/settlement/stats', { params })
  },

  /**
   * 获取结算趋势数据
   */
  getSettlementTrend: (days: number = 30): Promise<{ data: Array<{
    date: string
    totalAmount: number
    paidAmount: number
    newCount: number
    paidCount: number
  }> }> => {
    return http.get('/settlement/trend', { params: { days } })
  },

  /**
   * 获取账龄分析
   */
  getAgingAnalysis: (): Promise<{ data: Array<{
    ageRange: string
    count: number
    amount: number
    percentage: number
  }> }> => {
    return http.get('/settlement/aging-analysis')
  },

  // 结算报表
  /**
   * 生成结算报表
   */
  generateSettlementReport: (params: SettlementReportParams): Promise<{ data: {
    reportId: string
    downloadUrl: string
    fileName: string
  } }> => {
    return http.post('/settlement/reports/generate', params)
  },

  /**
   * 获取报表列表
   */
  getReportList: (params?: PaginationParams): Promise<{ data: PaginationData<{
    id: string
    reportType: string
    fileName: string
    status: string
    createTime: string
    downloadUrl?: string
    fileSize?: number
  }> }> => {
    return http.get('/settlement/reports', { params })
  },

  /**
   * 下载报表
   */
  downloadReport: (reportId: string): Promise<Blob> => {
    return http.get(`/settlement/reports/${reportId}/download`, { responseType: 'blob' })
  },

  /**
   * 下载结算单
   */
  downloadSettlement: (id: number): Promise<Blob> => {
    return http.get(`/settlement/records/${id}/download`, { responseType: 'blob' })
  },

  // 批量操作
  /**
   * 批量提交审核
   */
  batchSubmit: (ids: number[]): Promise<{ data: {
    successCount: number
    failCount: number
    details: Array<{
      id: number
      success: boolean
      reason?: string
    }>
  } }> => {
    return http.post('/settlement/batch-submit', { ids })
  },

  /**
   * 批量审核
   */
  batchApprove: (ids: number[], approved: boolean, reason?: string): Promise<{ data: {
    successCount: number
    failCount: number
    details: Array<{
      id: number
      success: boolean
      reason?: string
    }>
  } }> => {
    return http.post('/settlement/batch-approve', { ids, approved, reason })
  },

  /**
   * 批量导出
   */
  exportSettlements: (params: SettlementQueryParams): Promise<Blob> => {
    return http.get('/settlement/records/export', {
      params,
      responseType: 'blob'
    })
  },

  // 模板管理
  /**
   * 获取结算模板
   */
  getSettlementTemplates: (): Promise<{ data: Array<{
    id: number
    name: string
    settlementType: string
    feeRules: Array<{
      feeType: FeeType
      rate: number
      formula: string
    }>
    isDefault: boolean
    createTime: string
  }> }> => {
    return http.get('/settlement/templates')
  },

  /**
   * 根据模板创建结算
   */
  createFromTemplate: (templateId: number, caseId: number, customParams?: any): Promise<{ data: SettlementRecord }> => {
    return http.post('/settlement/create-from-template', {
      templateId,
      caseId,
      customParams
    })
  },

  // 提醒和通知
  /**
   * 发送催款通知
   */
  sendPaymentReminder: (id: number, params: {
    reminderType: 'sms' | 'email' | 'phone'
    message?: string
    scheduledTime?: string
  }): Promise<{ data: string }> => {
    return http.post(`/settlement/records/${id}/reminder`, params)
  },

  /**
   * 获取逾期结算列表
   */
  getOverdueSettlements: (params?: PaginationParams): Promise<{ data: PaginationData<SettlementRecord> }> => {
    return http.get('/settlement/overdue', { params })
  },

  /**
   * 设置自动提醒
   */
  setAutoReminder: (id: number, params: {
    enabled: boolean
    reminderDays: number[]
    reminderTypes: string[]
    message?: string
  }): Promise<{ data: string }> => {
    return http.post(`/settlement/records/${id}/auto-reminder`, params)
  }
}