import { env, logger } from '@/config/env'
import { useAuthStore } from '@/stores'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface WebSocketOptions {
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Event) => void
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private options: Required<WebSocketOptions>
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private isManualClose = false

  constructor(url?: string, options: WebSocketOptions = {}) {
    this.url = url || env.WS_URL
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      onMessage: () => {},
      onConnected: () => {},
      onDisconnected: () => {},
      onError: () => {},
      ...options
    }
  }

  connect() {
    try {
      const { token } = useAuthStore.getState()
      const wsUrl = token ? `${this.url}?token=${token}` : this.url
      
      this.ws = new WebSocket(wsUrl)
      this.isManualClose = false

      this.ws.onopen = () => {
        logger.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.options.onConnected()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          logger.debug('WebSocket message received:', message)
          
          // 处理心跳响应
          if (message.type === 'pong') {
            return
          }
          
          this.options.onMessage(message)
        } catch (error) {
          logger.error('WebSocket message parse error:', error)
        }
      }

      this.ws.onclose = (event) => {
        logger.log('WebSocket disconnected:', event.code, event.reason)
        this.stopHeartbeat()
        this.options.onDisconnected()
        
        if (!this.isManualClose && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        logger.error('WebSocket error:', error)
        this.options.onError(error)
      }
    } catch (error) {
      logger.error('WebSocket connection error:', error)
    }
  }

  disconnect() {
    this.isManualClose = true
    this.stopHeartbeat()
    this.clearReconnectTimer()
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      this.ws.send(JSON.stringify(fullMessage))
      logger.debug('WebSocket message sent:', fullMessage)
      return true
    } else {
      logger.warn('WebSocket is not connected')
      return false
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', data: null })
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimer()
    this.reconnectAttempts++
    
    logger.log(`WebSocket reconnecting... (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }
}

// 全局WebSocket实例
let globalWS: WebSocketManager | null = null

export const createWebSocket = (options?: WebSocketOptions) => {
  if (globalWS) {
    globalWS.disconnect()
  }
  
  globalWS = new WebSocketManager(undefined, options)
  return globalWS
}

export const getWebSocket = () => globalWS

export const disconnectWebSocket = () => {
  if (globalWS) {
    globalWS.disconnect()
    globalWS = null
  }
}