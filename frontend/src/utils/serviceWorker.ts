import { logger } from '@/config/env'

/**
 * Service Worker 注册和管理
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false

  static getInstance(): ServiceWorkerManager {
    if (!this.instance) {
      this.instance = new ServiceWorkerManager()
    }
    return this.instance
  }

  /**
   * 注册Service Worker
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker不支持')
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info('开发环境跳过Service Worker注册')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      logger.info('Service Worker注册成功')

      // 监听更新
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound()
      })

      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.info('Service Worker控制器已更新')
        // 可以在这里刷新页面或通知用户
        this.notifyUpdate()
      })

      // 检查现有的Service Worker
      if (this.registration.active) {
        logger.info('Service Worker已激活')
      }

      if (this.registration.waiting) {
        this.updateAvailable = true
        this.notifyUpdate()
      }

    } catch (error) {
      logger.error('Service Worker注册失败:', error)
    }
  }

  /**
   * 处理Service Worker更新
   */
  private handleUpdateFound(): void {
    const newWorker = this.registration?.installing

    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // 有新版本可用
          this.updateAvailable = true
          this.notifyUpdate()
        } else {
          // 首次安装
          logger.info('Service Worker首次安装完成')
        }
      }
    })
  }

  /**
   * 通知用户有更新
   */
  private notifyUpdate(): void {
    // 这里可以显示更新提示
    logger.info('有新版本可用，请刷新页面')
    
    // 可以集成到应用的通知系统
    this.dispatchUpdateEvent()
  }

  /**
   * 分发更新事件
   */
  private dispatchUpdateEvent(): void {
    const event = new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    })
    window.dispatchEvent(event)
  }

  /**
   * 跳过等待，立即激活新的Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return

    // 向等待中的Service Worker发送消息
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  /**
   * 获取Service Worker版本
   */
  async getVersion(): Promise<string> {
    if (!this.registration?.active) return 'unknown'

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || 'unknown')
      }

      this.registration!.active!.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      )
    })
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) return

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = () => {
        resolve()
      }

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      )
    })
  }

  /**
   * 预缓存资源
   */
  async cacheResources(urls: string[]): Promise<void> {
    if (!this.registration?.active) return

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = () => {
        resolve()
      }

      this.registration!.active!.postMessage(
        { 
          type: 'CACHE_URLS',
          payload: { urls }
        },
        [messageChannel.port2]
      )
    })
  }

  /**
   * 注销Service Worker
   */
  async unregister(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.unregister()
      logger.info('Service Worker已注销')
    } catch (error) {
      logger.error('Service Worker注销失败:', error)
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdate(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      logger.info('检查Service Worker更新完成')
    } catch (error) {
      logger.error('检查Service Worker更新失败:', error)
    }
  }

  /**
   * 获取注册状态
   */
  get isRegistered(): boolean {
    return !!this.registration
  }

  /**
   * 是否有更新可用
   */
  get hasUpdate(): boolean {
    return this.updateAvailable
  }
}

/**
 * 离线状态管理
 */
export class OfflineManager {
  private static callbacks: Set<(online: boolean) => void> = new Set()

  static init(): void {
    window.addEventListener('online', () => {
      logger.info('网络已连接')
      this.notifyCallbacks(true)
    })

    window.addEventListener('offline', () => {
      logger.warn('网络已断开')
      this.notifyCallbacks(false)
    })
  }

  static addCallback(callback: (online: boolean) => void): void {
    this.callbacks.add(callback)
  }

  static removeCallback(callback: (online: boolean) => void): void {
    this.callbacks.delete(callback)
  }

  private static notifyCallbacks(online: boolean): void {
    this.callbacks.forEach(callback => {
      try {
        callback(online)
      } catch (error) {
        logger.error('离线状态回调错误:', error)
      }
    })
  }

  static get isOnline(): boolean {
    return navigator.onLine
  }
}

/**
 * 缓存策略配置
 */
export interface CacheStrategy {
  name: string
  patterns: RegExp[]
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate'
  maxAge?: number
  maxEntries?: number
}

/**
 * PWA安装管理
 */
export class PWAInstallManager {
  private static deferredPrompt: any = null
  private static callbacks: Set<(canInstall: boolean) => void> = new Set()

  static init(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认安装提示
      e.preventDefault()
      
      this.deferredPrompt = e
      this.notifyCallbacks(true)
      
      logger.info('PWA安装提示已准备')
    })

    window.addEventListener('appinstalled', () => {
      logger.info('PWA已安装')
      this.deferredPrompt = null
      this.notifyCallbacks(false)
    })
  }

  static async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.warn('PWA安装提示不可用')
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      logger.info('PWA安装提示结果:', outcome)
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null
        return true
      }
      
      return false
    } catch (error) {
      logger.error('PWA安装提示失败:', error)
      return false
    }
  }

  static addCallback(callback: (canInstall: boolean) => void): void {
    this.callbacks.add(callback)
  }

  static removeCallback(callback: (canInstall: boolean) => void): void {
    this.callbacks.delete(callback)
  }

  private static notifyCallbacks(canInstall: boolean): void {
    this.callbacks.forEach(callback => {
      try {
        callback(canInstall)
      } catch (error) {
        logger.error('PWA安装回调错误:', error)
      }
    })
  }

  static get canInstall(): boolean {
    return !!this.deferredPrompt
  }

  static get isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://')
  }
}

/**
 * React Hook: Service Worker状态
 */
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [hasUpdate, setHasUpdate] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const swManager = ServiceWorkerManager.getInstance()
    
    // 注册Service Worker
    swManager.register().then(() => {
      setIsRegistered(swManager.isRegistered)
      setHasUpdate(swManager.hasUpdate)
    })

    // 监听更新事件
    const handleUpdate = () => {
      setHasUpdate(true)
    }

    window.addEventListener('sw-update-available', handleUpdate)

    // 监听离线状态
    const handleOffline = (online: boolean) => {
      setIsOnline(online)
    }

    OfflineManager.addCallback(handleOffline)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate)
      OfflineManager.removeCallback(handleOffline)
    }
  }, [])

  const updateApp = React.useCallback(async () => {
    const swManager = ServiceWorkerManager.getInstance()
    await swManager.skipWaiting()
    window.location.reload()
  }, [])

  return {
    isRegistered,
    hasUpdate,
    isOnline,
    updateApp
  }
}

/**
 * React Hook: PWA安装
 */
export function usePWAInstall() {
  const [canInstall, setCanInstall] = React.useState(PWAInstallManager.canInstall)
  const [isInstalled] = React.useState(PWAInstallManager.isInstalled)

  React.useEffect(() => {
    PWAInstallManager.init()
    
    const handleInstallChange = (canInstall: boolean) => {
      setCanInstall(canInstall)
    }

    PWAInstallManager.addCallback(handleInstallChange)

    return () => {
      PWAInstallManager.removeCallback(handleInstallChange)
    }
  }, [])

  const install = React.useCallback(async () => {
    return await PWAInstallManager.showInstallPrompt()
  }, [])

  return {
    canInstall,
    isInstalled,
    install
  }
}

// 初始化
export function initServiceWorker(): void {
  OfflineManager.init()
  PWAInstallManager.init()
  
  const swManager = ServiceWorkerManager.getInstance()
  swManager.register()
}

export default ServiceWorkerManager