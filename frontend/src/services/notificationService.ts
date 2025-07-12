import { http } from '@/utils/request'
import type { 
  NotificationRecord,
  NotificationTemplate,
  NotificationSettings,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  PaginationData, 
  PaginationParams 
} from '@/types'

// 通知查询参数
export interface NotificationQueryParams extends PaginationParams {
  status?: NotificationStatus
  type?: NotificationType
  priority?: NotificationPriority
  keyword?: string
  startDate?: string
  endDate?: string
  senderId?: number
  relatedType?: string
  relatedId?: number
}

// 发送通知参数
export interface SendNotificationParams {
  title: string
  content: string
  type: NotificationType
  priority?: NotificationPriority
  targetUserIds: number[]
  relatedId?: number
  relatedType?: string
  expireTime?: string
  actions?: Array<{
    type: string
    label: string
    url?: string
    method?: string
    params?: any
  }>
  sendChannels?: string[] // email, sms, inApp
  scheduledTime?: string
}

// 批量发送参数
export interface BatchSendParams {
  templateId: number
  targetUserIds: number[]
  variables?: Record<string, any>
  sendChannels?: string[]
  scheduledTime?: string
}

// 通知模板参数
export interface NotificationTemplateParams {
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
  isActive?: boolean
}

// 通知设置参数
export interface UpdateNotificationSettingsParams {
  emailEnabled?: boolean
  smsEnabled?: boolean
  inAppEnabled?: boolean
  soundEnabled?: boolean
  typeSettings?: Array<{
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
 * 通知管理相关API
 */
export const notificationService = {
  // 通知记录管理
  /**
   * 分页查询通知列表
   */
  getNotificationList: (params: NotificationQueryParams): Promise<{ data: PaginationData<NotificationRecord> }> => {
    return http.get('/notifications', { params })
  },

  /**
   * 获取当前用户通知列表
   */
  getMyNotifications: (params?: Partial<NotificationQueryParams>): Promise<{ data: PaginationData<NotificationRecord> }> => {
    return http.get('/notifications/my', { params })
  },

  /**
   * 根据ID获取通知详情
   */
  getNotificationById: (id: number): Promise<{ data: NotificationRecord }> => {
    return http.get(`/notifications/${id}`)
  },

  /**
   * 发送通知
   */
  sendNotification: (params: SendNotificationParams): Promise<{ data: {
    id: number
    sendResult: Array<{
      userId: number
      channel: string
      success: boolean
      error?: string
    }>
  } }> => {
    return http.post('/notifications/send', params)
  },

  /**
   * 批量发送通知
   */
  batchSendNotification: (params: BatchSendParams): Promise<{ data: {
    taskId: string
    totalCount: number
    successCount: number
    failCount: number
  } }> => {
    return http.post('/notifications/batch-send', params)
  },

  /**
   * 标记为已读
   */
  markAsRead: (id: number): Promise<{ data: string }> => {
    return http.put(`/notifications/${id}/read`)
  },

  /**
   * 批量标记为已读
   */
  batchMarkAsRead: (ids: number[]): Promise<{ data: {
    successCount: number
    failCount: number
  } }> => {
    return http.put('/notifications/batch-read', { ids })
  },

  /**
   * 标记全部为已读
   */
  markAllAsRead: (): Promise<{ data: string }> => {
    return http.put('/notifications/read-all')
  },

  /**
   * 删除通知
   */
  deleteNotification: (id: number): Promise<{ data: string }> => {
    return http.delete(`/notifications/${id}`)
  },

  /**
   * 批量删除通知
   */
  batchDeleteNotifications: (ids: number[]): Promise<{ data: {
    successCount: number
    failCount: number
  } }> => {
    return http.delete('/notifications/batch-delete', { data: { ids } })
  },

  /**
   * 清空已读通知
   */
  clearReadNotifications: (): Promise<{ data: string }> => {
    return http.delete('/notifications/clear-read')
  },

  // 通知统计
  /**
   * 获取通知统计信息
   */
  getNotificationStats: (userId?: number): Promise<{ data: NotificationStats }> => {
    return http.get('/notifications/stats', { params: { userId } })
  },

  /**
   * 获取未读数量
   */
  getUnreadCount: (): Promise<{ data: { count: number } }> => {
    return http.get('/notifications/unread-count')
  },

  /**
   * 获取通知趋势
   */
  getNotificationTrend: (days: number = 7): Promise<{ data: Array<{
    date: string
    totalCount: number
    readCount: number
    unreadCount: number
  }> }> => {
    return http.get('/notifications/trend', { params: { days } })
  },

  // 通知模板管理
  /**
   * 获取通知模板列表
   */
  getTemplateList: (params?: PaginationParams): Promise<{ data: PaginationData<NotificationTemplate> }> => {
    return http.get('/notifications/templates', { params })
  },

  /**
   * 根据ID获取模板详情
   */
  getTemplateById: (id: number): Promise<{ data: NotificationTemplate }> => {
    return http.get(`/notifications/templates/${id}`)
  },

  /**
   * 创建通知模板
   */
  createTemplate: (params: NotificationTemplateParams): Promise<{ data: NotificationTemplate }> => {
    return http.post('/notifications/templates', params)
  },

  /**
   * 更新通知模板
   */
  updateTemplate: (id: number, params: Partial<NotificationTemplateParams>): Promise<{ data: NotificationTemplate }> => {
    return http.put(`/notifications/templates/${id}`, params)
  },

  /**
   * 删除通知模板
   */
  deleteTemplate: (id: number): Promise<{ data: string }> => {
    return http.delete(`/notifications/templates/${id}`)
  },

  /**
   * 预览模板
   */
  previewTemplate: (id: number, variables?: Record<string, any>): Promise<{ data: {
    title: string
    content: string
  } }> => {
    return http.post(`/notifications/templates/${id}/preview`, { variables })
  },

  // 通知设置
  /**
   * 获取通知设置
   */
  getNotificationSettings: (userId?: number): Promise<{ data: NotificationSettings }> => {
    return http.get('/notifications/settings', { params: { userId } })
  },

  /**
   * 更新通知设置
   */
  updateNotificationSettings: (params: UpdateNotificationSettingsParams): Promise<{ data: NotificationSettings }> => {
    return http.put('/notifications/settings', params)
  },

  /**
   * 重置通知设置
   */
  resetNotificationSettings: (): Promise<{ data: string }> => {
    return http.post('/notifications/settings/reset')
  },

  // 实时通知
  /**
   * 建立WebSocket连接
   */
  connectWebSocket: (): WebSocket | null => {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws/notifications'
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('通知WebSocket连接已建立')
      }
      
      ws.onerror = (error) => {
        console.error('通知WebSocket连接错误:', error)
      }
      
      ws.onclose = () => {
        console.log('通知WebSocket连接已关闭')
      }
      
      return ws
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      return null
    }
  },

  /**
   * 轮询获取新通知
   */
  pollNewNotifications: (lastCheckTime: string): Promise<{ data: {
    notifications: NotificationRecord[]
    hasMore: boolean
    lastUpdateTime: string
  } }> => {
    return http.get('/notifications/poll', { 
      params: { lastCheckTime } 
    })
  },

  // 通知操作
  /**
   * 执行通知操作
   */
  executeNotificationAction: (notificationId: number, actionType: string, params?: any): Promise<{ data: any }> => {
    return http.post(`/notifications/${notificationId}/actions/${actionType}`, params)
  },

  /**
   * 获取通知操作历史
   */
  getNotificationActionHistory: (notificationId: number): Promise<{ data: Array<{
    id: number
    actionType: string
    result: string
    executeTime: string
    executorId: number
    executorName: string
  }> }> => {
    return http.get(`/notifications/${notificationId}/action-history`)
  },

  // 通知订阅
  /**
   * 订阅主题
   */
  subscribeTopic: (topic: string, userId?: number): Promise<{ data: string }> => {
    return http.post('/notifications/subscribe', { topic, userId })
  },

  /**
   * 取消订阅
   */
  unsubscribeTopic: (topic: string, userId?: number): Promise<{ data: string }> => {
    return http.post('/notifications/unsubscribe', { topic, userId })
  },

  /**
   * 获取订阅列表
   */
  getSubscriptions: (userId?: number): Promise<{ data: Array<{
    topic: string
    topicName: string
    description: string
    subscribeTime: string
  }> }> => {
    return http.get('/notifications/subscriptions', { params: { userId } })
  },

  // 通知推送
  /**
   * 测试推送
   */
  testPush: (params: {
    channel: 'email' | 'sms' | 'inApp'
    target: string
    title: string
    content: string
  }): Promise<{ data: {
    success: boolean
    message: string
  } }> => {
    return http.post('/notifications/test-push', params)
  },

  /**
   * 获取推送日志
   */
  getPushLogs: (params: PaginationParams & {
    channel?: string
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<{ data: PaginationData<{
    id: number
    notificationId: number
    channel: string
    target: string
    status: string
    error?: string
    sendTime: string
    deliveryTime?: string
  }> }> => {
    return http.get('/notifications/push-logs', { params })
  },

  // 系统公告
  /**
   * 发布系统公告
   */
  publishAnnouncement: (params: {
    title: string
    content: string
    priority: NotificationPriority
    targetUserTypes?: number[]
    startTime?: string
    endTime?: string
    isTop?: boolean
  }): Promise<{ data: {
    id: number
    publishTime: string
  } }> => {
    return http.post('/notifications/announcements', params)
  },

  /**
   * 获取系统公告列表
   */
  getAnnouncements: (params?: PaginationParams & {
    status?: string
    priority?: NotificationPriority
  }): Promise<{ data: PaginationData<{
    id: number
    title: string
    content: string
    priority: NotificationPriority
    status: string
    startTime?: string
    endTime?: string
    isTop: boolean
    publishTime: string
    publisherName: string
    readCount: number
  }> }> => {
    return http.get('/notifications/announcements', { params })
  },

  /**
   * 撤回系统公告
   */
  withdrawAnnouncement: (id: number): Promise<{ data: string }> => {
    return http.put(`/notifications/announcements/${id}/withdraw`)
  }
}