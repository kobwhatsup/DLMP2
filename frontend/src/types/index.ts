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
}

/**
 * 案件信息类型
 */
export interface Case {
  id: number
  caseNo: string
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
  caseStatus: number
  assignmentStatus: number
  mediationCenterId?: number
  mediatorId?: number
  clientId: number
  createdTime: string
  updatedTime?: string
}

/**
 * 案件状态枚举
 */
export enum CaseStatus {
  PENDING_ASSIGNMENT = 1, // 待分案
  IN_MEDIATION = 2, // 调解中
  MEDIATION_SUCCESS = 3, // 调解成功
  MEDIATION_FAILED = 4, // 调解失败
  IN_LITIGATION = 5, // 诉讼中
  CLOSED = 6, // 结案
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