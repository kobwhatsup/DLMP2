import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/stores'
import { env, logger } from '@/config/env'
import type { ApiResponse } from '@/types'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 携带cookie
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 获取token
    const { token } = useAuthStore.getState()
    
    // 添加认证头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求ID
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    // 记录请求日志
    logger.debug('Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data
    })
    
    return config
  },
  (error) => {
    logger.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data, config } = response
    
    // 记录响应日志
    logger.debug('Response:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      status: response.status,
      data: data
    })
    
    // 请求成功
    if (data.code === 200) {
      return data.data  // 直接返回数据部分
    }
    
    // 业务错误
    const errorMessage = data.message || '请求失败'
    message.error(errorMessage)
    logger.warn('Business Error:', errorMessage)
    return Promise.reject(new Error(errorMessage))
  },
  (error) => {
    const { response, config } = error
    
    logger.error('Response Error:', {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: response?.status,
      message: error.message
    })
    
    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          useAuthStore.getState().logout()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          message.error('登录已过期，请重新登录')
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 422:
          message.error('数据验证失败')
          break
        case 429:
          message.error('请求过于频繁，请稍后再试')
          break
        case 500:
          message.error('服务器内部错误')
          break
        case 502:
          message.error('网关错误')
          break
        case 503:
          message.error('服务暂时不可用')
          break
        case 504:
          message.error('网关超时')
          break
        default:
          message.error(response.data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接')
    } else if (error.code === 'ERR_NETWORK') {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error('网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

// 封装请求方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.get(url, config)
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.post(url, data, config)
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.put(url, data, config)
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.delete(url, config)
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.patch(url, data, config)
  },
  
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    return request.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
  },
}

export default request