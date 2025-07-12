import { http } from '@/utils/request'
import type { User, PaginationData, PaginationParams } from '@/types'

// 用户查询参数
export interface UserQueryParams extends PaginationParams {
  keyword?: string
  userType?: number
  status?: number
}

// 更新用户参数
export interface UpdateUserParams {
  realName?: string
  phone?: string
  email?: string
  status?: number
}

/**
 * 用户管理相关API
 */
export const userService = {
  /**
   * 分页查询用户列表
   */
  getUsers: (params: UserQueryParams): Promise<PaginationData<User>> => {
    return http.get('/user/users', { params })
  },

  /**
   * 根据ID获取用户详情
   */
  getUserById: (id: number): Promise<User> => {
    return http.get(`/user/users/${id}`)
  },

  /**
   * 更新用户信息
   */
  updateUser: (id: number, params: UpdateUserParams): Promise<string> => {
    return http.put(`/user/users/${id}`, params)
  },

  /**
   * 删除用户
   */
  deleteUser: (id: number): Promise<string> => {
    return http.delete(`/user/users/${id}`)
  },

  /**
   * 批量删除用户
   */
  batchDeleteUsers: (ids: number[]): Promise<string> => {
    return http.delete('/user/users/batch', { data: { ids } })
  },

  /**
   * 重置用户密码
   */
  resetPassword: (id: number): Promise<{ password: string }> => {
    return http.post(`/user/users/${id}/reset-password`)
  },

  /**
   * 启用/禁用用户
   */
  toggleUserStatus: (id: number, status: number): Promise<string> => {
    return http.put(`/user/users/${id}/status`, { status })
  },
}