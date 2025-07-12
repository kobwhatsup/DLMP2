import { http } from '@/utils/request'
import type { 
  User, 
  Role, 
  Permission, 
  PaginationData, 
  PaginationParams,
  LoginRequest,
  LoginResponse
} from '@/types'

// 用户查询参数
export interface UserQueryParams extends PaginationParams {
  username?: string
  realName?: string
  phone?: string
  userType?: number
  status?: number
}

// 创建用户参数
export interface CreateUserParams {
  username: string
  realName: string
  phone: string
  email?: string
  userType: number
  status: number
  password: string
  remarks?: string
}

// 更新用户参数
export interface UpdateUserParams {
  realName?: string
  phone?: string
  email?: string
  status?: number
  remarks?: string
}

// 角色查询参数
export interface RoleQueryParams extends PaginationParams {
  name?: string
  code?: string
}

// 创建角色参数
export interface CreateRoleParams {
  name: string
  code: string
  description?: string
}

// 更新角色参数
export interface UpdateRoleParams {
  name?: string
  description?: string
}

/**
 * 用户管理相关API
 */
export const userService = {
  // 认证相关
  /**
   * 用户登录
   */
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return http.post('/auth/login', data)
  },

  /**
   * 用户登出
   */
  logout: (): Promise<void> => {
    return http.post('/auth/logout')
  },

  /**
   * 刷新Token
   */
  refreshToken: (): Promise<LoginResponse> => {
    return http.post('/auth/refresh')
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<User> => {
    return http.get('/auth/current-user')
  },

  // 用户管理
  /**
   * 分页查询用户列表
   */
  getUserList: (params: UserQueryParams): Promise<PaginationData<User>> => {
    return http.get('/user/users', { params })
  },

  /**
   * 根据ID获取用户详情
   */
  getUserById: (id: number): Promise<User> => {
    return http.get(`/user/users/${id}`)
  },

  /**
   * 创建用户
   */
  createUser: (data: CreateUserParams): Promise<User> => {
    return http.post('/user/users', data)
  },

  /**
   * 更新用户信息
   */
  updateUser: (id: number, params: UpdateUserParams): Promise<User> => {
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

  /**
   * 导出用户数据
   */
  exportUsers: (params: UserQueryParams): Promise<Blob> => {
    return http.get('/user/users/export', { params, responseType: 'blob' })
  },

  // 角色管理
  /**
   * 分页查询角色列表
   */
  getRoleList: (params: RoleQueryParams): Promise<PaginationData<Role>> => {
    return http.get('/user/roles', { params })
  },

  /**
   * 根据ID获取角色详情
   */
  getRoleById: (id: number): Promise<Role> => {
    return http.get(`/user/roles/${id}`)
  },

  /**
   * 创建角色
   */
  createRole: (data: CreateRoleParams): Promise<Role> => {
    return http.post('/user/roles', data)
  },

  /**
   * 更新角色信息
   */
  updateRole: (id: number, params: UpdateRoleParams): Promise<Role> => {
    return http.put(`/user/roles/${id}`, params)
  },

  /**
   * 删除角色
   */
  deleteRole: (id: number): Promise<string> => {
    return http.delete(`/user/roles/${id}`)
  },

  // 权限管理
  /**
   * 获取所有权限列表
   */
  getPermissionList: (): Promise<Permission[]> => {
    return http.get('/user/permissions')
  },

  /**
   * 获取角色权限
   */
  getRolePermissions: (roleId: number): Promise<Permission[]> => {
    return http.get(`/user/roles/${roleId}/permissions`)
  },

  /**
   * 更新角色权限
   */
  updateRolePermissions: (roleId: number, permissionIds: number[]): Promise<string> => {
    return http.put(`/user/roles/${roleId}/permissions`, { permissionIds })
  },

  // 用户角色关联
  /**
   * 获取用户角色
   */
  getUserRoles: (userId: number): Promise<Role[]> => {
    return http.get(`/user/users/${userId}/roles`)
  },

  /**
   * 更新用户角色
   */
  updateUserRoles: (userId: number, roleIds: number[]): Promise<string> => {
    return http.put(`/user/users/${userId}/roles`, { roleIds })
  },
}