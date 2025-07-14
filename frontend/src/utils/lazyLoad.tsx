import React, { Suspense, ComponentType } from 'react'
import { Spin } from 'antd'
import { logger } from '@/config/env'

/**
 * 页面加载组件
 */
const PageLoading: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px'
    }}
  >
    <Spin size="large" tip="页面加载中..." />
  </div>
)

/**
 * 错误边界组件
 */
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('页面加载错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '50px',
            textAlign: 'center',
            color: '#666'
          }}
        >
          <h3>页面加载失败</h3>
          <p>请刷新页面重试</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 懒加载高阶组件
 * @param importFunc 动态导入函数
 * @param fallback 加载中组件
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ComponentType = PageLoading
): React.ComponentType {
  const LazyComponent = React.lazy(importFunc)

  return (props: any) => (
    <ErrorBoundary>
      <Suspense fallback={<fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * 预加载组件
 * @param importFunc 动态导入函数
 * @param delay 延迟时间（毫秒）
 */
export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  delay = 0
): void {
  setTimeout(() => {
    importFunc().catch(error => {
      logger.warn('组件预加载失败:', error)
    })
  }, delay)
}

/**
 * 路由级别的懒加载
 */
export const routeLazyLoad = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return lazyLoad(importFunc, PageLoading)
}

/**
 * 组件级别的懒加载（更轻量的加载指示器）
 */
const ComponentLoading: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <Spin size="small" />
  </div>
)

export const componentLazyLoad = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return lazyLoad(importFunc, ComponentLoading)
}

/**
 * 条件懒加载 - 只有在满足条件时才加载组件
 */
export function conditionalLazyLoad<T extends ComponentType<any>>(
  condition: () => boolean,
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  if (!condition()) {
    return () => fallback ? React.createElement(fallback) : null
  }
  return lazyLoad(importFunc, fallback)
}

/**
 * 资源预加载工具
 */
export class ResourcePreloader {
  private static preloadedModules = new Set<string>()

  /**
   * 预加载模块
   */
  static preloadModule(moduleId: string, importFunc: () => Promise<any>) {
    if (this.preloadedModules.has(moduleId)) {
      return
    }

    this.preloadedModules.add(moduleId)
    
    // 在浏览器空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunc().catch(error => {
          logger.warn(`模块 ${moduleId} 预加载失败:`, error)
          this.preloadedModules.delete(moduleId)
        })
      })
    } else {
      // 降级到setTimeout
      setTimeout(() => {
        importFunc().catch(error => {
          logger.warn(`模块 ${moduleId} 预加载失败:`, error)
          this.preloadedModules.delete(moduleId)
        })
      }, 1000)
    }
  }

  /**
   * 预加载关键路由
   */
  static preloadCriticalRoutes() {
    // 预加载用户最可能访问的页面
    this.preloadModule('dashboard', () => import('@/pages/Dashboard'))
    this.preloadModule('cases', () => import('@/pages/Cases'))
    this.preloadModule('users', () => import('@/pages/Users'))
  }

  /**
   * 根据用户角色预加载相关页面
   */
  static preloadByUserRole(userType: number) {
    switch (userType) {
      case 1: // 案源端客户
        this.preloadModule('cases', () => import('@/pages/Cases'))
        this.preloadModule('mediation', () => import('@/pages/Mediation'))
        break
      case 2: // 调解中心
        this.preloadModule('mediation', () => import('@/pages/Mediation'))
        this.preloadModule('cases', () => import('@/pages/Cases'))
        break
      case 3: // 平台运营方
        this.preloadModule('dashboard', () => import('@/pages/Dashboard'))
        this.preloadModule('users', () => import('@/pages/Users'))
        this.preloadModule('settings', () => import('@/pages/Settings'))
        break
      default:
        this.preloadCriticalRoutes()
    }
  }
}

/**
 * 图片懒加载Hook
 */
export function useImageLazyLoad() {
  React.useEffect(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src) {
              img.src = src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      })

      // 观察所有带有data-src属性的图片
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })

      return () => imageObserver.disconnect()
    }
  }, [])
}

/**
 * 组件可见性检测Hook
 */
export function useVisibility(ref: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref])

  return isVisible
}

export default lazyLoad