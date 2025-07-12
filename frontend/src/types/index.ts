// 通用类型定义

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  size: number
}

/**
 * 分页响应数据
 */
export interface PaginationData<T = any> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 用户信息类型
 */
export interface User {
  id: number
  username: string
  realName: string
  phone?: string
  email?: string
  userType: number
  organizationId?: number
  status: number
  createdTime: string
  updatedTime?: string
}

/**
 * 用户类型枚举
 */
export enum UserType {
  CASE_SOURCE_CLIENT = 1, // 案源端客户
  MEDIATION_CENTER = 2, // 调解中心
  PLATFORM_OPERATOR = 3, // 平台运营方
  COURT = 4, // 法院用户
  DEBTOR = 5, // 债务人
}

/**
 * 案件信息类型
 */
export interface Case {
  id: number
  caseNumber: string
  caseNo?: string
  batchNo?: string
  iouNumber?: string
  contractAmount?: number
  debtorId?: string
  borrowerName: string
  debtorName?: string
  debtorIdCard: string
  debtorPhone?: string
  phone?: string
  address?: string
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
  debtAmount: number
  overduePrincipal?: number
  overdueInterest?: number
  overdueFees?: number
  overdueTotalAmount?: number
  overdueDays?: number
  status: CaseStatus
  caseStatus?: number
  assignmentStatus?: number
  mediationCenterId?: number
  mediatorId?: number
  clientId?: number
  clientName?: string
  caseDescription?: string
  assignTime?: string
  createTime: string
  createdTime?: string
  updatedTime?: string
}

/**
 * 案件状态枚举
 */
export enum CaseStatus {
  PENDING_ASSIGNMENT = 1, // 待分案
  ASSIGNED = 2, // 已分案
  IN_MEDIATION = 3, // 调解中
  MEDIATION_SUCCESS = 4, // 调解成功
  MEDIATION_FAILED = 5, // 调解失败
  IN_LITIGATION = 6, // 诉讼中
  LITIGATION_SUCCESS = 7, // 诉讼成功
  CLOSED = 8, // 结案
}

/**
 * 分案状态枚举
 */
export enum AssignmentStatus {
  UNASSIGNED = 0, // 未分案
  ASSIGNED = 1, // 已分案
}

/**
 * 路由菜单项类型
 */
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  permission?: string
}

/**
 * 表格列配置类型
 */
export interface TableColumn<T = any> {
  title: string
  dataIndex: keyof T
  key?: string
  width?: number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sorter?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
}

/**
 * 表单字段类型
 */
export interface FormField {
  name: string
  label: string
  type: 'input' | 'select' | 'date' | 'textarea' | 'number'
  required?: boolean
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  rules?: any[]
}

/**
 * 搜索参数类型
 */
export interface SearchParams extends PaginationParams {
  keyword?: string
  status?: number
  startTime?: string
  endTime?: string
  [key: string]: any
}

/**
 * 角色信息类型
 */
export interface Role {
  id: number
  name: string
  code: string
  description?: string
  permissions?: Permission[]
  createTime: string
  updateTime?: string
}

/**
 * 权限信息类型
 */
export interface Permission {
  id: number
  name: string
  code: string
  module: string
  description?: string
  type: 'menu' | 'button' | 'api'
  parentId?: number
  children?: Permission[]
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 1, // 启用
  INACTIVE = 0, // 禁用
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string
  password: string
  remember?: boolean
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string
  refreshToken: string
  userId: number
  username: string
  realName: string
  userType: number
  expiresIn: number
}

/**
 * 分案规则条件
 */
export interface RuleCondition {
  field: string
  operator: string
  value: string
  logic: 'AND' | 'OR'
}

/**
 * 分案规则动作
 */
export interface RuleAction {
  type: string
  target: string
  weight: number
}

/**
 * 分案规则
 */
export interface AssignmentRule {
  id: number
  name: string
  description?: string
  priority: number
  status: 'active' | 'inactive'
  conditions: RuleCondition[]
  actions: RuleAction[]
  executeCount: number
  successRate: number
  createTime: string
  updateTime?: string
}

/**
 * 分案任务
 */
export interface AssignmentTask {
  id: number
  name: string
  strategy: 'rule_based' | 'load_balance' | 'random' | 'manual'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  totalCount: number
  successCount: number
  failCount: number
  startTime?: string
  endTime?: string
  createTime: string
  executorId: number
  executorName: string
  config?: any
  errorMessage?: string
}

/**
 * 调解中心
 */
export interface MediationCenter {
  id: number
  name: string
  code: string
  address?: string
  contactPerson?: string
  contactPhone?: string
  status: number
  capacity: number
  currentLoad: number
  workloadRate: number
  createTime: string
}

/**
 * 调解员
 */
export interface Mediator {
  id: number
  name: string
  phone?: string
  email?: string
  mediationCenterId: number
  mediationCenterName: string
  specialty?: string[]
  level: number
  status: number
  maxCases: number
  currentCases: number
  workloadRate: number
  performance: {
    successRate: number
    avgProcessTime: number
    satisfactionScore: number
  }
  createTime: string
}

/**
 * 调解状态枚举
 */
export enum MediationStatus {
  PENDING = 1, // 待开始
  IN_PROGRESS = 2, // 进行中
  SUCCESS = 3, // 调解成功
  FAILED = 4, // 调解失败
  SUSPENDED = 5, // 已暂停
}

/**
 * 调解案件
 */
export interface MediationCase {
  id: number
  caseId: number
  caseNumber: string
  borrowerName: string
  debtAmount: number
  phone: string
  address?: string
  mediatorId: number
  mediatorName: string
  mediationCenterId: number
  mediationCenterName: string
  status: MediationStatus
  currentStep: number
  progress: number
  startTime?: string
  deadline?: string
  mediationMethod?: string
  mediationLocation?: string
  appointmentTime?: string
  expectedDuration?: number
  mediationPlan?: string
  remarks?: string
  description?: string
  createTime: string
  updateTime?: string
}

/**
 * 调解记录
 */
export interface MediationRecord {
  id: number
  caseId: number
  type: string
  title: string
  content: string
  contactTime?: string
  operatorId: number
  operatorName: string
  attachments?: Array<{
    name: string
    url: string
    size: number
  }>
  createTime: string
}

/**
 * 文书模板
 */
export interface DocumentTemplate {
  id: number
  name: string
  description: string
  type: string
  category: string
  template: string
  variables: Array<{
    name: string
    label: string
    type: string
    required: boolean
    defaultValue?: any
  }>
  status: number
  createTime: string
}

