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