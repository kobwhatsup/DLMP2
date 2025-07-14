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
  amount: number
  debtorIdCard?: string
  debtorPhone?: string
  clientName?: string
  mediatorId: number
  mediatorName: string
  mediationCenterId: number
  mediationCenterName: string
  status: number
  step: number
  mediationMethod?: string
  mediationLocation?: string
  appointmentTime?: string
  expectedDuration?: number
  mediationPlan?: string
  remarks?: string
  createTime: string
  updateTime?: string
  agreementAmount?: number
  paymentSchedule?: string
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

/**
 * 诉讼状态枚举
 */
export enum LitigationStatus {
  PREPARING = 1, // 准备中
  FILED = 2, // 已立案
  IN_TRIAL = 3, // 审理中
  JUDGMENT_ISSUED = 4, // 已判决
  IN_EXECUTION = 5, // 执行中
  EXECUTED = 6, // 已执行
  CLOSED = 7, // 已结案
}

/**
 * 诉讼阶段枚举
 */
export enum LitigationStage {
  PREPARATION = 0, // 诉前准备
  FILING = 1, // 立案审查
  TRIAL = 2, // 开庭审理
  JUDGMENT = 3, // 判决执行
  EXECUTION = 4, // 强制执行
  COMPLETED = 5, // 执行完毕
}

/**
 * 诉讼案件
 */
export interface LitigationCase {
  id: number
  caseId: number
  caseNumber: string
  borrowerName: string
  debtAmount: number
  courtName: string
  courtCaseNumber?: string
  judgeName?: string
  plaintiffLawyer?: string
  status: LitigationStatus
  stage: LitigationStage
  progress: number
  filingDate?: string
  trialDate?: string
  judgmentDate?: string
  judgmentAmount?: number
  recoveredAmount?: number
  executionCourt?: string
  caseDescription?: string
  remarks?: string
  createTime: string
  updateTime?: string
}

/**
 * 法院事件
 */
export interface CourtEvent {
  id: number
  caseId: number
  type: string
  title: string
  scheduledTime: string
  actualTime?: string
  location?: string
  description?: string
  status: string
  result?: string
  operatorId: number
  operatorName: string
  createTime: string
}

/**
 * 执行记录
 */
export interface ExecutionRecord {
  id: number
  caseId: number
  type: string
  title: string
  content: string
  amount?: number
  executeTime: string
  executorId: number
  executorName: string
  attachments?: Array<{
    name: string
    url: string
    size: number
  }>
  createTime: string
}

/**
 * 结算状态枚举
 */
export enum SettlementStatus {
  DRAFT = 1, // 草稿
  PENDING = 2, // 待审核
  APPROVED = 3, // 已审核
  PAID = 4, // 已付款
  PARTIAL_PAID = 5, // 部分付款
  OVERDUE = 6, // 逾期
  CANCELLED = 7, // 已取消
}

/**
 * 费用类型枚举
 */
export enum FeeType {
  SERVICE_FEE = 1, // 服务费
  LITIGATION_FEE = 2, // 诉讼费
  EXECUTION_FEE = 3, // 执行费
  COMMISSION = 4, // 佣金
  OTHER = 5, // 其他费用
}

/**
 * 结算记录
 */
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

/**
 * 费用明细
 */
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

/**
 * 系统配置类型枚举
 */
export enum SystemConfigType {
  SYSTEM = 1, // 系统基础配置
  SECURITY = 2, // 安全配置
  NOTIFICATION = 3, // 通知配置
  STORAGE = 4, // 存储配置
  INTEGRATION = 5, // 第三方集成
  BUSINESS = 6, // 业务配置
}

/**
 * 系统配置
 */
export interface SystemConfig {
  id: number
  configKey: string
  configValue: string
  configType: SystemConfigType
  configName: string
  description?: string
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array'
  isEncrypted: boolean
  isPublic: boolean
  validationRule?: string
  defaultValue?: string
  category: string
  sortOrder: number
  isActive: boolean
  createTime: string
  updateTime?: string
  updatedBy?: string
}

/**
 * 系统参数分组
 */
export interface SystemConfigGroup {
  category: string
  categoryName: string
  description?: string
  icon?: string
  sortOrder: number
  configs: SystemConfig[]
}

/**
 * 数据字典
 */
export interface DataDictionary {
  id: number
  dictType: string
  dictName: string
  dictCode: string
  dictValue: string
  description?: string
  sortOrder: number
  isActive: boolean
  parentId?: number
  children?: DataDictionary[]
  createTime: string
  updateTime?: string
}

/**
 * 数据字典类型
 */
export interface DictType {
  id: number
  typeCode: string
  typeName: string
  description?: string
  isSystem: boolean
  isActive: boolean
  itemCount: number
  createTime: string
}

/**
 * 操作日志
 */
export interface OperationLog {
  id: number
  userId: number
  userName: string
  module: string
  operation: string
  method: string
  requestUrl: string
  requestParams?: string
  responseData?: string
  clientIp: string
  userAgent: string
  location?: string
  executionTime: number
  status: 'success' | 'failure'
  errorMessage?: string
  createTime: string
}

/**
 * 登录日志
 */
export interface LoginLog {
  id: number
  userId: number
  userName: string
  loginType: 'web' | 'mobile' | 'api'
  clientIp: string
  userAgent: string
  location?: string
  loginTime: string
  logoutTime?: string
  status: 'success' | 'failure'
  failureReason?: string
}

/**
 * 系统监控信息
 */
export interface SystemMonitor {
  serverInfo: {
    hostname: string
    os: string
    architecture: string
    javaVersion: string
    serverTime: string
    uptime: string
  }
  cpuInfo: {
    usage: number
    cores: number
    systemUsage: number
    userUsage: number
  }
  memoryInfo: {
    totalMemory: number
    usedMemory: number
    freeMemory: number
    usage: number
  }
  diskInfo: {
    totalSpace: number
    usedSpace: number
    freeSpace: number
    usage: number
  }
  networkInfo: {
    downloadSpeed: number
    uploadSpeed: number
    totalDownload: number
    totalUpload: number
  }
  applicationInfo: {
    activeUsers: number
    totalRequests: number
    errorRequests: number
    avgResponseTime: number
  }
}

/**
 * 安全设置
 */
export interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number
    historyCount: number
  }
  loginSettings: {
    maxFailAttempts: number
    lockoutDuration: number
    sessionTimeout: number
    multipleLoginAllowed: boolean
    requireCaptcha: boolean
  }
  ipWhitelist: string[]
  ipBlacklist: string[]
  enableTwoFactor: boolean
  allowedFileTypes: string[]
  maxUploadSize: number
}

/**
 * 备份记录
 */
export interface BackupRecord {
  id: number
  backupName: string
  backupType: 'full' | 'incremental' | 'differential'
  backupSize: number
  filePath: string
  status: 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  duration?: number
  errorMessage?: string
  createdBy: string
}

/**
 * 系统健康检查
 */
export interface HealthCheck {
  overall: 'healthy' | 'warning' | 'critical'
  checks: Array<{
    name: string
    status: 'healthy' | 'warning' | 'critical'
    message: string
    details?: any
    lastCheck: string
  }>
  metrics: {
    responseTime: number
    errorRate: number
    throughput: number
    availability: number
  }
}

/**
 * 通知状态枚举
 */
export enum NotificationStatus {
  UNREAD = 0, // 未读
  READ = 1, // 已读
  DELETED = 2, // 已删除
}

/**
 * 通知类型枚举
 */
export enum NotificationType {
  SYSTEM = 1, // 系统通知
  CASE_UPDATE = 2, // 案件更新
  ASSIGNMENT = 3, // 分案通知
  MEDIATION = 4, // 调解通知
  LITIGATION = 5, // 诉讼通知
  SETTLEMENT = 6, // 结算通知
  REMINDER = 7, // 提醒通知
  ANNOUNCEMENT = 8, // 公告通知
}

/**
 * 通知优先级枚举
 */
export enum NotificationPriority {
  LOW = 1, // 低
  NORMAL = 2, // 普通
  HIGH = 3, // 高
  URGENT = 4, // 紧急
}

/**
 * 通知记录
 */
export interface NotificationRecord {
  id: number
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  targetUserId: number
  targetUserName?: string
  relatedId?: number
  relatedType?: string
  senderId?: number
  senderName?: string
  readTime?: string
  createTime: string
  expireTime?: string
  actions?: NotificationAction[]
}

/**
 * 通知操作
 */
export interface NotificationAction {
  type: string
  label: string
  url?: string
  method?: string
  params?: any
}

/**
 * 通知模板
 */
export interface NotificationTemplate {
  id: number
  name: string
  title: string
  content: string
  type: NotificationType
  variables: Array<{
    name: string
    label: string
    type: string
    required: boolean
    defaultValue?: any
  }>
  isActive: boolean
  createTime: string
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  userId: number
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  soundEnabled: boolean
  typeSettings: Array<{
    type: NotificationType
    emailEnabled: boolean
    smsEnabled: boolean
    inAppEnabled: boolean
  }>
  quietHours?: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

/**
 * 通知统计
 */
export interface NotificationStats {
  totalCount: number
  unreadCount: number
  todayCount: number
  weekCount: number
  typeDistribution: Array<{
    type: NotificationType
    typeName: string
    count: number
    unreadCount: number
  }>
}

/**
 * 文件状态枚举
 */
export enum FileStatus {
  UPLOADING = 1, // 上传中
  SUCCESS = 2, // 上传成功
  FAILED = 3, // 上传失败
  PROCESSING = 4, // 处理中
  DELETED = 5, // 已删除
}

/**
 * 文件类型枚举
 */
export enum FileType {
  DOCUMENT = 1, // 文档
  IMAGE = 2, // 图片
  VIDEO = 3, // 视频
  AUDIO = 4, // 音频
  ARCHIVE = 5, // 压缩包
  OTHER = 6, // 其他
}

/**
 * 文件存储类型枚举
 */
export enum StorageType {
  LOCAL = 1, // 本地存储
  OSS = 2, // 对象存储
  CDN = 3, // CDN
}

/**
 * 文件记录
 */
export interface FileRecord {
  id: number
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  fileType: FileType
  mimeType: string
  fileHash: string
  thumbnailPath?: string
  previewPath?: string
  status: FileStatus
  storageType: StorageType
  uploaderId: number
  uploaderName: string
  relatedId?: number
  relatedType?: string
  tags?: string[]
  description?: string
  downloadCount: number
  viewCount: number
  isPublic: boolean
  expireTime?: string
  createTime: string
  updateTime?: string
}

/**
 * 文件夹记录
 */
export interface FolderRecord {
  id: number
  name: string
  path: string
  parentId?: number
  parentPath?: string
  description?: string
  fileCount: number
  totalSize: number
  creatorId: number
  creatorName: string
  isPublic: boolean
  createTime: string
  updateTime?: string
  children?: FolderRecord[]
}

/**
 * 文件上传配置
 */
export interface UploadConfig {
  maxFileSize: number
  allowedTypes: string[]
  chunkSize: number
  concurrent: number
  autoThumbnail: boolean
  autoPreview: boolean
  storageType: StorageType
  expireDays?: number
}

/**
 * 文件分享记录
 */
export interface FileShare {
  id: number
  fileId: number
  fileName: string
  shareCode: string
  shareUrl: string
  password?: string
  downloadLimit?: number
  downloadCount: number
  viewLimit?: number
  viewCount: number
  expireTime?: string
  creatorId: number
  creatorName: string
  isActive: boolean
  createTime: string
}

/**
 * 文件操作日志
 */
export interface FileOperationLog {
  id: number
  fileId: number
  fileName: string
  operation: string
  operatorId: number
  operatorName: string
  clientIp: string
  userAgent: string
  result: string
  errorMessage?: string
  createTime: string
}

/**
 * 文件统计
 */
export interface FileStats {
  totalFiles: number
  totalSize: number
  totalFolders: number
  todayUploads: number
  todayDownloads: number
  storageUsage: Array<{
    storageType: StorageType
    count: number
    size: number
    percentage: number
  }>
  typeDistribution: Array<{
    fileType: FileType
    typeName: string
    count: number
    size: number
    percentage: number
  }>
  monthlyStats: Array<{
    month: string
    uploads: number
    downloads: number
    size: number
  }>
}

