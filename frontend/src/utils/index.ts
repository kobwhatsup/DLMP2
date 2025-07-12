// 导出所有工具函数
export * from './env'
export { http } from './request'

// 通用工具函数
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString()}`
}

export const formatPhone = (phone: string): string => {
  if (!phone) return '-'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export const formatIdCard = (idCard: string): string => {
  if (!idCard) return '-'
  return `${idCard.slice(0, 6)}****${idCard.slice(-4)}`
}

export const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString()
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString()
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// 相对时间格式化
export const formatRelativeTime = (dateTime: string): string => {
  const now = new Date()
  const date = new Date(dateTime)
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 通知图标获取
export const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    system: '🔔',
    case_update: 'ℹ️',
    assignment: '👤',
    mediation: '💬',
    litigation: '⚖️',
    settlement: '💰',
    reminder: '⏰',
    announcement: '📢'
  }
  return iconMap[type] || '🔔'
}

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// 生成随机ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const cloneObj = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = deepClone(obj[key])
      }
    }
    return cloneObj
  }
  return obj
}