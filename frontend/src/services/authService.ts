import { http } from '@/utils/request'
import type { User } from '@/types'

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
  captcha?: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  userId: number
  username: string
  realName: string
  userType: number
}

// 注册请求参数
export interface RegisterParams {
  username: string
  password: string
  realName: string
  phone?: string
  email?: string
  userType: number
}

// 修改密码参数
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/**
 * 认证相关API
 */
export const authService = {
  /**
   * 用户登录
   */
  login: (params: LoginParams): Promise<LoginResponse> => {
    return http.post('/user/auth/login', params)
  },

  /**
   * 用户注册
   */
  register: (params: RegisterParams): Promise<string> => {
    return http.post('/user/auth/register', params)
  },

  /**
   * 用户登出
   */
  logout: (): Promise<string> => {
    return http.post('/user/auth/logout')
  },

  /**
   * 获取验证码
   */
  getCaptcha: (): Promise<{ image: string; key: string }> => {
    return http.get('/user/auth/captcha')
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<User> => {
    return http.get('/user/auth/current')
  },

  /**
   * 修改密码
   */
  changePassword: (userId: number, params: ChangePasswordParams): Promise<string> => {
    return http.post(`/user/users/${userId}/password`, params)
  },

  /**
   * 刷新token
   */
  refreshToken: (): Promise<{ token: string }> => {
    return http.post('/user/auth/refresh')
  },
}