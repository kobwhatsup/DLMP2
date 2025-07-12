import { http } from '@/utils/request'
import type { 
  AssignmentRule,
  AssignmentTask,
  MediationCenter,
  Mediator,
  PaginationData, 
  PaginationParams 
} from '@/types'

// 分案规则查询参数
export interface RuleQueryParams extends PaginationParams {
  name?: string
  status?: string
  priority?: number
}

// 创建分案规则参数
export interface CreateRuleParams {
  name: string
  description?: string
  priority: number
  status: string
  conditions: Array<{
    field: string
    operator: string
    value: string
    logic: string
  }>
  actions: Array<{
    type: string
    target: string
    weight: number
  }>
}

// 更新分案规则参数
export interface UpdateRuleParams {
  name?: string
  description?: string
  priority?: number
  status?: string
  conditions?: Array<{
    field: string
    operator: string
    value: string
    logic: string
  }>
  actions?: Array<{
    type: string
    target: string
    weight: number
  }>
}

// 分案任务查询参数
export interface TaskQueryParams extends PaginationParams {
  name?: string
  status?: string
  strategy?: string
}

// 智能分案配置参数
export interface SmartAssignmentConfig {
  strategy: 'rule_based' | 'load_balance' | 'random' | 'manual'
  batchSize: number
  maxCasesPerMediator: number
  mediationCenterIds: number[]
  mediatorIds: number[]
  enableAutoAssignment: boolean
}

// 手动分案参数
export interface ManualAssignmentParams {
  caseIds: number[]
  mediationCenterId?: number
  mediatorId?: number
  assignReason?: string
}

/**
 * 智能分案相关API
 */
export const assignmentService = {
  // 分案规则管理
  /**
   * 分页查询分案规则
   */
  getRuleList: (params: RuleQueryParams): Promise<PaginationData<AssignmentRule>> => {
    return http.get('/assignment/rules', { params })
  },

  /**
   * 根据ID获取分案规则详情
   */
  getRuleById: (id: number): Promise<AssignmentRule> => {
    return http.get(`/assignment/rules/${id}`)
  },

  /**
   * 创建分案规则
   */
  createRule: (data: CreateRuleParams): Promise<AssignmentRule> => {
    return http.post('/assignment/rules', data)
  },

  /**
   * 更新分案规则
   */
  updateRule: (id: number, data: UpdateRuleParams): Promise<AssignmentRule> => {
    return http.put(`/assignment/rules/${id}`, data)
  },

  /**
   * 删除分案规则
   */
  deleteRule: (id: number): Promise<string> => {
    return http.delete(`/assignment/rules/${id}`)
  },

  /**
   * 更新规则状态
   */
  updateRuleStatus: (id: number, status: string): Promise<string> => {
    return http.put(`/assignment/rules/${id}/status`, { status })
  },

  /**
   * 测试分案规则
   */
  testRule: (ruleId: number, caseIds: number[]): Promise<{
    matchedCount: number
    matchedCases: Array<{
      caseId: number
      matchReason: string
      assignTarget: string
    }>
  }> => {
    return http.post(`/assignment/rules/${ruleId}/test`, { caseIds })
  },

  // 分案任务管理
  /**
   * 分页查询分案任务
   */
  getTaskList: (params: TaskQueryParams): Promise<PaginationData<AssignmentTask>> => {
    return http.get('/assignment/tasks', { params })
  },

  /**
   * 根据ID获取分案任务详情
   */
  getTaskById: (id: number): Promise<AssignmentTask> => {
    return http.get(`/assignment/tasks/${id}`)
  },

  /**
   * 启动智能分案
   */
  startSmartAssignment: (config: SmartAssignmentConfig): Promise<{
    taskId: number
    message: string
  }> => {
    return http.post('/assignment/smart-assignment/start', config)
  },

  /**
   * 停止智能分案
   */
  stopAssignment: (): Promise<string> => {
    return http.post('/assignment/smart-assignment/stop')
  },

  /**
   * 暂停分案任务
   */
  pauseTask: (taskId: number): Promise<string> => {
    return http.put(`/assignment/tasks/${taskId}/pause`)
  },

  /**
   * 启动分案任务
   */
  startTask: (taskId: number): Promise<string> => {
    return http.put(`/assignment/tasks/${taskId}/start`)
  },

  /**
   * 取消分案任务
   */
  cancelTask: (taskId: number): Promise<string> => {
    return http.put(`/assignment/tasks/${taskId}/cancel`)
  },

  /**
   * 手动分案
   */
  manualAssignment: (params: ManualAssignmentParams): Promise<{
    successCount: number
    failCount: number
    details: Array<{
      caseId: number
      success: boolean
      reason?: string
    }>
  }> => {
    return http.post('/assignment/manual-assignment', params)
  },

  /**
   * 批量分案
   */
  batchAssignment: (params: ManualAssignmentParams): Promise<{
    taskId: number
    message: string
  }> => {
    return http.post('/assignment/batch-assignment', params)
  },

  // 调解中心和调解员管理
  /**
   * 获取调解中心列表
   */
  getMediationCenters: (): Promise<{ data: MediationCenter[] }> => {
    return http.get('/assignment/mediation-centers')
  },

  /**
   * 获取调解员列表
   */
  getMediators: (mediationCenterId?: number): Promise<{ data: Mediator[] }> => {
    return http.get('/assignment/mediators', {
      params: { mediationCenterId }
    })
  },

  /**
   * 获取调解员工作负载
   */
  getMediatorWorkload: (mediatorId: number): Promise<{
    totalCases: number
    activeCases: number
    completedCases: number
    workloadRate: number
    performance: {
      successRate: number
      avgProcessTime: number
      satisfactionScore: number
    }
  }> => {
    return http.get(`/assignment/mediators/${mediatorId}/workload`)
  },

  // 分案统计
  /**
   * 获取分案统计信息
   */
  getAssignmentStats: (startDate?: string, endDate?: string): Promise<{
    totalAssigned: number
    successRate: number
    avgAssignTime: number
    ruleEffectiveness: Array<{
      ruleId: number
      ruleName: string
      executeCount: number
      successRate: number
    }>
    mediatorDistribution: Array<{
      mediatorId: number
      mediatorName: string
      assignedCount: number
      workloadRate: number
    }>
  }> => {
    return http.get('/assignment/stats', {
      params: { startDate, endDate }
    })
  },

  /**
   * 获取分案趋势数据
   */
  getAssignmentTrend: (days: number = 30): Promise<Array<{
    date: string
    assignedCount: number
    successCount: number
    failCount: number
  }>> => {
    return http.get('/assignment/trend', { params: { days } })
  },

  // 分案审核
  /**
   * 获取待审核分案列表
   */
  getPendingAssignments: (params: PaginationParams): Promise<PaginationData<{
    id: number
    caseId: number
    caseNumber: string
    borrowerName: string
    fromMediatorId: number
    fromMediatorName: string
    toMediatorId: number
    toMediatorName: string
    reason: string
    status: string
    createTime: string
  }>> => {
    return http.get('/assignment/pending-assignments', { params })
  },

  /**
   * 审核分案申请
   */
  approveAssignment: (id: number, approved: boolean, reason?: string): Promise<string> => {
    return http.put(`/assignment/pending-assignments/${id}/approve`, {
      approved,
      reason
    })
  }
}