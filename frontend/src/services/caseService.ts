import { http } from '@/utils/request'
import type { Case, PaginationData, PaginationParams } from '@/types'

// 案件查询参数
export interface CaseQueryParams extends PaginationParams {
  caseNo?: string
  batchNo?: string
  debtorName?: string
  debtorIdCard?: string
  debtorPhone?: string
  caseStatus?: number
  assignmentStatus?: number
  mediationCenterId?: number
  mediatorId?: number
  clientId?: number
}

// 创建案件参数
export interface CreateCaseParams {
  batchNo?: string
  iouNumber?: string
  contractAmount?: number
  debtorId: string
  debtorName: string
  debtorIdCard: string
  debtorPhone?: string
  gender?: number
  education?: string
  ethnicity?: string
  maritalStatus?: string
  householdProvince?: string
  householdCity?: string
  householdAddress?: string
  currentProvince?: string
  currentCity?: string
  currentAddress?: string
  companyName?: string
  jobPosition?: string
  companyPhone?: string
  companyProvince?: string
  companyCity?: string
  companyAddress?: string
  loanProductType?: string
  loanDate?: string
  loanAmount?: number
  overduePrincipal?: number
  overdueInterest?: number
  overdueFees?: number
  overdueTotalAmount?: number
  overdueDays?: number
  clientId: number
}

// 更新案件参数
export interface UpdateCaseParams {
  debtorName?: string
  debtorPhone?: string
  contractAmount?: number
  loanAmount?: number
  overdueTotalAmount?: number
  caseStatus?: number
}

// 分案参数
export interface AssignCaseParams {
  mediationCenterId: number
  mediatorId: number
}

/**
 * 案件管理相关API
 */
export const caseService = {
  /**
   * 分页查询案件列表
   */
  getCases: (params: CaseQueryParams): Promise<PaginationData<Case>> => {
    return http.get('/case/cases', { params })
  },

  /**
   * 根据ID获取案件详情
   */
  getCaseById: (id: number): Promise<Case> => {
    return http.get(`/case/cases/${id}`)
  },

  /**
   * 创建案件
   */
  createCase: (params: CreateCaseParams): Promise<string> => {
    return http.post('/case/cases', params)
  },

  /**
   * 更新案件信息
   */
  updateCase: (id: number, params: UpdateCaseParams): Promise<string> => {
    return http.put(`/case/cases/${id}`, params)
  },

  /**
   * 删除案件
   */
  deleteCase: (id: number): Promise<string> => {
    return http.delete(`/case/cases/${id}`)
  },

  /**
   * 批量导入案件
   */
  batchImportCases: (cases: CreateCaseParams[]): Promise<string> => {
    return http.post('/case/cases/batch-import', cases)
  },

  /**
   * 分案
   */
  assignCase: (id: number, params: AssignCaseParams): Promise<string> => {
    return http.post(`/case/cases/${id}/assign`, params)
  },

  /**
   * 批量分案
   */
  batchAssignCases: (caseIds: number[], params: AssignCaseParams): Promise<string> => {
    return http.post('/case/cases/batch-assign', { caseIds, ...params })
  },

  /**
   * 导出案件数据
   */
  exportCases: (params: CaseQueryParams): Promise<Blob> => {
    return http.get('/case/cases/export', {
      params,
      responseType: 'blob',
    })
  },

  /**
   * 下载案件导入模板
   */
  downloadTemplate: (): Promise<Blob> => {
    return http.get('/case/cases/template', {
      responseType: 'blob',
    })
  },

  /**
   * 上传案件文件
   */
  uploadCaseFile: (caseId: number, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    return http.upload(`/case/cases/${caseId}/upload`, formData)
  },
}