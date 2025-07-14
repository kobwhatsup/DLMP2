import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { userService } from '../userService'
import { mockApiResponse, mockPaginationData, mockUser } from '@/test/test-utils'

// Mock request module
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import request from '@/utils/request'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserList', () => {
    it('fetches user list successfully', async () => {
      const mockUsers = [
        mockUser({ id: 1, username: 'user1' }),
        mockUser({ id: 2, username: 'user2' })
      ]
      const mockResponse = mockApiResponse(mockPaginationData(mockUsers))
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const params = { page: 1, size: 10 }
      const result = await userService.getUserList(params)

      expect(request.get).toHaveBeenCalledWith('/api/users', { params })
      expect(result).toEqual(mockResponse)
      expect(result.data.records).toHaveLength(2)
    })

    it('handles search with filters', async () => {
      const mockResponse = mockApiResponse(mockPaginationData([]))
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const params = {
        page: 1,
        size: 10,
        keyword: 'test',
        userType: 1,
        status: 1
      }

      await userService.getUserList(params)

      expect(request.get).toHaveBeenCalledWith('/api/users', { params })
    })
  })

  describe('getUserDetail', () => {
    it('fetches user detail successfully', async () => {
      const mockUserDetail = mockUser({ id: 1, username: 'testuser' })
      const mockResponse = mockApiResponse(mockUserDetail)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.getUserDetail(1)

      expect(request.get).toHaveBeenCalledWith('/api/users/1')
      expect(result).toEqual(mockResponse)
      expect(result.data.username).toBe('testuser')
    })

    it('handles non-existent user', async () => {
      const error = new Error('User not found')
      vi.mocked(request.get).mockRejectedValue(error)

      await expect(userService.getUserDetail(999)).rejects.toThrow('User not found')
    })
  })

  describe('createUser', () => {
    it('creates user successfully', async () => {
      const newUser = {
        username: 'newuser',
        password: 'password123',
        realName: '新用户',
        phone: '13800138000',
        email: 'new@example.com',
        userType: 1
      }
      const mockCreatedUser = mockUser({ ...newUser, id: 3 })
      const mockResponse = mockApiResponse(mockCreatedUser)
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await userService.createUser(newUser)

      expect(request.post).toHaveBeenCalledWith('/api/users', newUser)
      expect(result).toEqual(mockResponse)
      expect(result.data.username).toBe('newuser')
    })

    it('handles duplicate username', async () => {
      const duplicateUser = {
        username: 'existinguser',
        password: 'password123',
        realName: '重复用户',
        userType: 1
      }
      const error = new Error('Username already exists')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(userService.createUser(duplicateUser)).rejects.toThrow('Username already exists')
    })
  })

  describe('updateUser', () => {
    it('updates user successfully', async () => {
      const updateData = {
        realName: '更新的用户名',
        phone: '13900139000'
      }
      const mockUpdatedUser = mockUser({ ...updateData, id: 1 })
      const mockResponse = mockApiResponse(mockUpdatedUser)
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await userService.updateUser(1, updateData)

      expect(request.put).toHaveBeenCalledWith('/api/users/1', updateData)
      expect(result).toEqual(mockResponse)
      expect(result.data.realName).toBe('更新的用户名')
    })
  })

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      const mockResponse = mockApiResponse({ success: true })
      vi.mocked(request.delete).mockResolvedValue(mockResponse)

      const result = await userService.deleteUser(1)

      expect(request.delete).toHaveBeenCalledWith('/api/users/1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateUserStatus', () => {
    it('updates user status successfully', async () => {
      const mockResponse = mockApiResponse({ success: true })
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await userService.updateUserStatus(1, 0)

      expect(request.put).toHaveBeenCalledWith('/api/users/1/status', { status: 0 })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('resetUserPassword', () => {
    it('resets user password successfully', async () => {
      const mockResponse = mockApiResponse({ 
        success: true, 
        newPassword: 'temp123456' 
      })
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await userService.resetUserPassword(1)

      expect(request.post).toHaveBeenCalledWith('/api/users/1/reset-password')
      expect(result).toEqual(mockResponse)
      expect(result.data.newPassword).toBe('temp123456')
    })
  })

  describe('getUserRoles', () => {
    it('fetches user roles successfully', async () => {
      const mockRoles = [
        { id: 1, name: '管理员', code: 'admin' },
        { id: 2, name: '操作员', code: 'operator' }
      ]
      const mockResponse = mockApiResponse(mockRoles)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.getUserRoles(1)

      expect(request.get).toHaveBeenCalledWith('/api/users/1/roles')
      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(2)
    })
  })

  describe('assignUserRoles', () => {
    it('assigns roles to user successfully', async () => {
      const roleIds = [1, 2, 3]
      const mockResponse = mockApiResponse({ success: true })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await userService.assignUserRoles(1, roleIds)

      expect(request.post).toHaveBeenCalledWith('/api/users/1/roles', { roleIds })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getUserPermissions', () => {
    it('fetches user permissions successfully', async () => {
      const mockPermissions = [
        { id: 1, name: '用户查看', code: 'user:view' },
        { id: 2, name: '用户编辑', code: 'user:edit' }
      ]
      const mockResponse = mockApiResponse(mockPermissions)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.getUserPermissions(1)

      expect(request.get).toHaveBeenCalledWith('/api/users/1/permissions')
      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(2)
    })
  })

  describe('batchUpdateUsers', () => {
    it('batch updates users successfully', async () => {
      const userUpdates = [
        { id: 1, status: 0 },
        { id: 2, status: 0 }
      ]
      const mockResponse = mockApiResponse({ 
        successCount: 2, 
        failCount: 0 
      })
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await userService.batchUpdateUsers(userUpdates)

      expect(request.put).toHaveBeenCalledWith('/api/users/batch', { users: userUpdates })
      expect(result).toEqual(mockResponse)
      expect(result.data.successCount).toBe(2)
    })
  })

  describe('exportUserList', () => {
    it('exports user list successfully', async () => {
      const mockBlob = new Blob(['user export data'], { type: 'application/vnd.ms-excel' })
      vi.mocked(request.get).mockResolvedValue(mockBlob)

      const params = { userType: 1 }
      const result = await userService.exportUserList(params)

      expect(request.get).toHaveBeenCalledWith('/api/users/export', {
        params,
        responseType: 'blob'
      })
      expect(result).toEqual(mockBlob)
    })
  })

  describe('getUserStatistics', () => {
    it('fetches user statistics successfully', async () => {
      const mockStats = {
        totalUsers: 500,
        activeUsers: 450,
        inactiveUsers: 50,
        onlineUsers: 120,
        userTypeDistribution: [
          { userType: 1, count: 100 },
          { userType: 2, count: 200 },
          { userType: 3, count: 200 }
        ]
      }
      const mockResponse = mockApiResponse(mockStats)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.getUserStatistics()

      expect(request.get).toHaveBeenCalledWith('/api/users/statistics')
      expect(result).toEqual(mockResponse)
      expect(result.data.totalUsers).toBe(500)
      expect(result.data.userTypeDistribution).toHaveLength(3)
    })
  })

  describe('checkUsername', () => {
    it('checks username availability successfully', async () => {
      const mockResponse = mockApiResponse({ available: true })
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.checkUsername('newusername')

      expect(request.get).toHaveBeenCalledWith('/api/users/check-username', {
        params: { username: 'newusername' }
      })
      expect(result).toEqual(mockResponse)
      expect(result.data.available).toBe(true)
    })

    it('handles existing username', async () => {
      const mockResponse = mockApiResponse({ available: false })
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await userService.checkUsername('existinguser')

      expect(result.data.available).toBe(false)
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      }
      const mockResponse = mockApiResponse({ success: true })
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await userService.changePassword(1, passwordData)

      expect(request.put).toHaveBeenCalledWith('/api/users/1/change-password', passwordData)
      expect(result).toEqual(mockResponse)
    })

    it('handles incorrect old password', async () => {
      const passwordData = {
        oldPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      }
      const error = new Error('Invalid old password')
      vi.mocked(request.put).mockRejectedValue(error)

      await expect(userService.changePassword(1, passwordData)).rejects.toThrow('Invalid old password')
    })
  })
})