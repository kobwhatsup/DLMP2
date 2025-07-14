import { logger } from '@/config/env'

/**
 * 性能监控工具类
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private observers: PerformanceObserver[] = []
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }

  /**
   * 初始化性能监控
   */
  init() {
    this.initWebVitals()
    this.initResourceTiming()
    this.initNavigationTiming()
    this.initUserTiming()
  }

  /**
   * 监控Web Vitals指标
   */
  private initWebVitals() {
    // First Contentful Paint (FCP)
    this.observePerformance('paint', (list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric('FCP', entry.startTime)
        }
      })
    })

    // Largest Contentful Paint (LCP)
    this.observePerformance('largest-contentful-paint', (list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        this.reportMetric('LCP', lastEntry.startTime)
      }
    })

    // First Input Delay (FID)
    this.observePerformance('first-input', (list) => {
      list.getEntries().forEach((entry: any) => {
        this.reportMetric('FID', entry.processingStart - entry.startTime)
      })
    })

    // Cumulative Layout Shift (CLS)
    this.observePerformance('layout-shift', (list) => {
      let clsValue = 0
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.reportMetric('CLS', clsValue)
    })
  }

  /**
   * 监控资源加载时间
   */
  private initResourceTiming() {
    this.observePerformance('resource', (list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.initiatorType === 'script') {
          this.reportMetric(`Script_${entry.name}`, entry.duration)
        } else if (entry.initiatorType === 'link') {
          this.reportMetric(`Stylesheet_${entry.name}`, entry.duration)
        } else if (entry.initiatorType === 'img') {
          this.reportMetric(`Image_${entry.name}`, entry.duration)
        }
      })
    })
  }

  /**
   * 监控页面导航时间
   */
  private initNavigationTiming() {
    this.observePerformance('navigation', (list) => {
      list.getEntries().forEach((entry: any) => {
        // DNS查询时间
        this.reportMetric('DNS_Time', entry.domainLookupEnd - entry.domainLookupStart)
        
        // TCP连接时间
        this.reportMetric('TCP_Time', entry.connectEnd - entry.connectStart)
        
        // SSL握手时间
        if (entry.secureConnectionStart > 0) {
          this.reportMetric('SSL_Time', entry.connectEnd - entry.secureConnectionStart)
        }
        
        // 请求响应时间
        this.reportMetric('Request_Time', entry.responseStart - entry.requestStart)
        
        // DOM解析时间
        this.reportMetric('DOM_Parse_Time', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart)
        
        // 页面加载完成时间
        this.reportMetric('Page_Load_Time', entry.loadEventEnd - entry.loadEventStart)
      })
    })
  }

  /**
   * 监控用户自定义时间
   */
  private initUserTiming() {
    this.observePerformance('measure', (list) => {
      list.getEntries().forEach((entry) => {
        this.reportMetric(`Custom_${entry.name}`, entry.duration)
      })
    })
  }

  /**
   * 创建性能观察器
   */
  private observePerformance(type: string, callback: (list: PerformanceObserverEntryList) => void) {
    try {
      const observer = new PerformanceObserver(callback)
      observer.observe({ entryTypes: [type] })
      this.observers.push(observer)
    } catch (error) {
      logger.warn(`性能监控类型 ${type} 不支持:`, error)
    }
  }

  /**
   * 上报性能指标
   */
  private reportMetric(name: string, value: number) {
    this.metrics.set(name, value)
    logger.debug(`性能指标 ${name}: ${value.toFixed(2)}ms`)

    // 发送到监控服务
    this.sendToMonitoring(name, value)
  }

  /**
   * 发送指标到监控服务
   */
  private sendToMonitoring(name: string, value: number) {
    // 只在生产环境发送
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    // 批量发送，避免频繁请求
    this.batchSend(name, value)
  }

  private pendingMetrics: Array<{ name: string; value: number; timestamp: number }> = []
  private sendTimer: NodeJS.Timeout | null = null

  private batchSend(name: string, value: number) {
    this.pendingMetrics.push({
      name,
      value,
      timestamp: Date.now()
    })

    // 延迟发送，批量处理
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        this.flushMetrics()
        this.sendTimer = null
      }, 5000)
    }

    // 如果积累了太多指标，立即发送
    if (this.pendingMetrics.length >= 50) {
      if (this.sendTimer) {
        clearTimeout(this.sendTimer)
        this.sendTimer = null
      }
      this.flushMetrics()
    }
  }

  private async flushMetrics() {
    if (this.pendingMetrics.length === 0) return

    const metrics = [...this.pendingMetrics]
    this.pendingMetrics = []

    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      logger.warn('发送性能指标失败:', error)
      // 失败的指标重新加入队列
      this.pendingMetrics.unshift(...metrics)
    }
  }

  /**
   * 手动标记时间点
   */
  mark(name: string) {
    performance.mark(name)
  }

  /**
   * 测量两个时间点之间的时间
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (endMark) {
      performance.measure(name, startMark, endMark)
    } else {
      performance.measure(name, startMark)
    }
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): Map<string, number> {
    return new Map(this.metrics)
  }

  /**
   * 清理观察器
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    if (this.sendTimer) {
      clearTimeout(this.sendTimer)
      this.sendTimer = null
    }
    
    this.flushMetrics()
  }
}

/**
 * 防抖函数 - 性能优化
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(this, args)
  }
}

/**
 * 节流函数 - 性能优化
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private static checkInterval: NodeJS.Timeout | null = null

  static startMonitoring(interval = 30000) {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        logger.debug('内存使用情况:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        })

        // 内存使用超过限制的80%时警告
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          logger.warn('内存使用率过高，建议清理或优化')
        }
      }
    }, interval)
  }

  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

/**
 * 长任务监控
 */
export class LongTaskMonitor {
  private static observer: PerformanceObserver | null = null

  static startMonitoring() {
    if (this.observer || !('PerformanceObserver' in window)) return

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          logger.warn('检测到长任务:', {
            name: entry.name,
            duration: `${entry.duration.toFixed(2)}ms`,
            startTime: entry.startTime
          })

          // 上报长任务信息
          PerformanceMonitor.getInstance().reportMetric?.('Long_Task', entry.duration)
        })
      })

      this.observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      logger.warn('长任务监控不支持:', error)
    }
  }

  static stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

/**
 * 资源预加载
 */
export function preloadResource(href: string, as: string, type?: string) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type
  
  document.head.appendChild(link)
}

/**
 * 懒加载图片优化
 */
export function optimizeImages() {
  const images = document.querySelectorAll('img[data-src]')
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))
  } else {
    // 降级方案
    images.forEach(img => {
      const image = img as HTMLImageElement
      image.src = image.dataset.src || ''
      image.removeAttribute('data-src')
    })
  }
}

/**
 * 组件渲染性能测量
 */
export function measureRenderTime(componentName: string) {
  return function<T extends React.ComponentType<any>>(Component: T): T {
    const WrappedComponent = React.forwardRef((props: any, ref: any) => {
      React.useEffect(() => {
        const startTime = performance.now()
        
        // 使用requestIdleCallback测量实际渲染完成时间
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const endTime = performance.now()
            logger.debug(`${componentName} 渲染时间: ${(endTime - startTime).toFixed(2)}ms`)
          })
        }
      })

      return React.createElement(Component, { ...props, ref })
    })

    WrappedComponent.displayName = `withRenderMeasure(${Component.displayName || Component.name})`
    
    return WrappedComponent as T
  }
}

// 初始化性能监控
export function initPerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance()
  monitor.init()
  
  MemoryMonitor.startMonitoring()
  LongTaskMonitor.startMonitoring()
  
  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    monitor.cleanup()
    MemoryMonitor.stopMonitoring()
    LongTaskMonitor.stopMonitoring()
  })
}

export default PerformanceMonitor