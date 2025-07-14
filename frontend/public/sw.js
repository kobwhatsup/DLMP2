// Service Worker for DLMP Frontend
// 提供离线缓存、资源预缓存等功能

const CACHE_NAME = 'dlmp-cache-v1'
const CACHE_VERSION = '1.0.0'

// 需要缓存的静态资源
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // 核心CSS和JS文件会在构建时动态添加
]

// 需要缓存的API接口
const API_CACHE_PATTERNS = [
  /^\/api\/users\/me$/,
  /^\/api\/dashboard\/statistics$/,
  /^\/api\/system\/config$/
]

// 不需要缓存的接口
const NO_CACHE_PATTERNS = [
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
  /^\/api\/files\/upload$/
]

// 安装事件 - 预缓存资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static files')
        return cache.addAll(STATIC_CACHE_FILES)
      })
      .then(() => {
        // 强制激活新的Service Worker
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to precache:', error)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker', CACHE_VERSION)
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  )
})

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }

  // 根据请求类型采用不同策略
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API请求 - 网络优先策略
      event.respondWith(handleApiRequest(request))
    } else {
      // 静态资源 - 缓存优先策略
      event.respondWith(handleStaticRequest(request))
    }
  }
})

// 处理API请求 - 网络优先，缓存备用
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // 检查是否不应该缓存
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return fetch(request)
  }

  try {
    // 网络优先
    const networkResponse = await fetch(request)
    
    // 只缓存成功的GET请求
    if (networkResponse.ok && shouldCacheApi(url.pathname)) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // 网络失败时从缓存获取
    console.log('[SW] Network failed, trying cache for:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 返回离线页面或错误响应
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    
    return new Response('Network error', { 
      status: 408,
      statusText: 'Network timeout' 
    })
  }
}

// 处理静态资源请求 - 缓存优先，网络备用
async function handleStaticRequest(request) {
  try {
    // 缓存优先
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      // 后台更新缓存
      updateCache(request)
      return cachedResponse
    }
    
    // 缓存未命中，从网络获取
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch static resource:', request.url)
    
    // 对于HTML请求，返回离线页面
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// 后台更新缓存
async function updateCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response)
    }
  } catch (error) {
    // 后台更新失败不影响用户体验
    console.log('[SW] Background cache update failed:', error)
  }
}

// 判断API是否应该缓存
function shouldCacheApi(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname))
}

// 消息处理 - 与主线程通信
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION })
      break
      
    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    default:
      console.log('[SW] Unknown message type:', type)
  }
})

// 清除缓存
async function clearCache() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('[SW] All caches cleared')
}

// 缓存指定URL
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(urls)
  console.log('[SW] Cached URLs:', urls)
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 同步离线时的操作
    console.log('[SW] Background sync triggered')
    
    // 这里可以处理离线时的数据同步
    // 例如：上传离线时保存的表单数据
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// 推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action) {
    // 处理操作按钮点击
    handleNotificationAction(event.action, event.notification.data)
  } else {
    // 处理通知本身的点击
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// 处理通知操作
async function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      await clients.openWindow(data.url || '/')
      break
    case 'dismiss':
      // 只是关闭通知
      break
    default:
      console.log('[SW] Unknown notification action:', action)
  }
}

// 错误处理
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error)
})

// 未处理的Promise拒绝
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

console.log('[SW] Service Worker loaded', CACHE_VERSION)