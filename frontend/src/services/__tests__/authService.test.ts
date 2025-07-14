import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '../authService'
import { mockApiResponse } from '@/test/test-utils'

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

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('logs in user successfully', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
        remember: true
      }
      const mockLoginResponse = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        userId: 1,
        username: 'testuser',
        realName: '测试用户',
        userType: 1,
        expiresIn: 7200
      }
      const mockResponse = mockApiResponse(mockLoginResponse)
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.login(loginData)

      expect(request.post).toHaveBeenCalledWith('/api/auth/login', loginData)
      expect(result).toEqual(mockResponse)
      expect(result.data.token).toBe('mock-jwt-token')
      expect(result.data.userId).toBe(1)
    })

    it('handles invalid credentials', async () => {
      const loginData = {
        username: 'wronguser',
        password: 'wrongpass'
      }
      const error = new Error('Invalid credentials')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials')
      expect(request.post).toHaveBeenCalledWith('/api/auth/login', loginData)
    })

    it('handles account locked', async () => {
      const loginData = {
        username: 'lockeduser',
        password: 'password123'
      }
      const error = new Error('Account is locked')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.login(loginData)).rejects.toThrow('Account is locked')
    })
  })

  describe('logout', () => {
    it('logs out user successfully', async () => {
      const mockResponse = mockApiResponse({ success: true })
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.logout()

      expect(request.post).toHaveBeenCalledWith('/api/auth/logout')
      expect(result).toEqual(mockResponse)
    })

    it('handles logout errors gracefully', async () => {
      const error = new Error('Logout failed')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.logout()).rejects.toThrow('Logout failed')
    })
  })

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      const refreshTokenData = { refreshToken: 'current-refresh-token' }
      const mockRefreshResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 7200
      }
      const mockResponse = mockApiResponse(mockRefreshResponse)
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.refreshToken(refreshTokenData)

      expect(request.post).toHaveBeenCalledWith('/api/auth/refresh', refreshTokenData)
      expect(result).toEqual(mockResponse)
      expect(result.data.token).toBe('new-jwt-token')
    })

    it('handles invalid refresh token', async () => {
      const refreshTokenData = { refreshToken: 'invalid-token' }
      const error = new Error('Invalid refresh token')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.refreshToken(refreshTokenData)).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('getCurrentUser', () => {
    it('gets current user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        realName: '测试用户',
        phone: '13800138000',
        email: 'test@example.com',
        userType: 1,
        status: 1,
        permissions: ['user:view', 'case:view']
      }
      const mockResponse = mockApiResponse(mockUser)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await authService.getCurrentUser()

      expect(request.get).toHaveBeenCalledWith('/api/auth/me')
      expect(result).toEqual(mockResponse)
      expect(result.data.username).toBe('testuser')
      expect(result.data.permissions).toContain('user:view')
    })

    it('handles unauthorized access', async () => {
      const error = new Error('Unauthorized')
      vi.mocked(request.get).mockRejectedValue(error)

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized')
    })
  })

  describe('forgotPassword', () => {
    it('sends password reset email successfully', async () => {
      const email = 'test@example.com'
      const mockResponse = mockApiResponse({ 
        success: true, 
        message: 'Password reset email sent' 
      })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.forgotPassword(email)

      expect(request.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email })
      expect(result).toEqual(mockResponse)
      expect(result.data.success).toBe(true)
    })

    it('handles non-existent email', async () => {
      const email = 'nonexistent@example.com'
      const error = new Error('Email not found')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.forgotPassword(email)).rejects.toThrow('Email not found')
    })
  })

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const resetData = {
        token: 'reset-token-123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const mockResponse = mockApiResponse({ 
        success: true, 
        message: 'Password reset successful' 
      })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.resetPassword(resetData)

      expect(request.post).toHaveBeenCalledWith('/api/auth/reset-password', resetData)
      expect(result).toEqual(mockResponse)
    })

    it('handles invalid reset token', async () => {
      const resetData = {
        token: 'invalid-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const error = new Error('Invalid or expired reset token')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.resetPassword(resetData)).rejects.toThrow('Invalid or expired reset token')
    })

    it('handles password mismatch', async () => {
      const resetData = {
        token: 'reset-token-123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      }
      const error = new Error('Passwords do not match')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(authService.resetPassword(resetData)).rejects.toThrow('Passwords do not match')
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const mockResponse = mockApiResponse({ 
        success: true, 
        message: 'Password changed successfully' 
      })
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await authService.changePassword(passwordData)

      expect(request.put).toHaveBeenCalledWith('/api/auth/change-password', passwordData)
      expect(result).toEqual(mockResponse)
    })

    it('handles incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      const error = new Error('Current password is incorrect')
      vi.mocked(request.put).mockRejectedValue(error)

      await expect(authService.changePassword(passwordData)).rejects.toThrow('Current password is incorrect')
    })
  })

  describe('verifyToken', () => {
    it('verifies token successfully', async () => {
      const token = 'valid-jwt-token'
      const mockResponse = mockApiResponse({ 
        valid: true,
        userId: 1,
        username: 'testuser'
      })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.verifyToken(token)

      expect(request.post).toHaveBeenCalledWith('/api/auth/verify', { token })
      expect(result).toEqual(mockResponse)
      expect(result.data.valid).toBe(true)
    })

    it('handles invalid token', async () => {
      const token = 'invalid-token'
      const mockResponse = mockApiResponse({ valid: false })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await authService.verifyToken(token)

      expect(result.data.valid).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      const profileData = {
        realName: '更新的姓名',
        phone: '13900139000',
        email: 'updated@example.com'
      }
      const mockUpdatedUser = {
        id: 1,
        username: 'testuser',
        ...profileData,
        userType: 1,
        status: 1
      }
      const mockResponse = mockApiResponse(mockUpdatedUser)
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await authService.updateProfile(profileData)

      expect(request.put).toHaveBeenCalledWith('/api/auth/profile', profileData)
      expect(result).toEqual(mockResponse)
      expect(result.data.realName).toBe('更新的姓名')
    })

    it('handles profile update validation errors', async () => {
      const profileData = {
        phone: 'invalid-phone',
        email: 'invalid-email'
      }
      const error = new Error('Validation failed')
      vi.mocked(request.put).mockRejectedValue(error)

      await expect(authService.updateProfile(profileData)).rejects.toThrow('Validation failed')
    })
  })

  describe('checkPermission', () => {
    it('checks permission successfully', async () => {
      const permission = 'user:edit'
      const mockResponse = mockApiResponse({ hasPermission: true })
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await authService.checkPermission(permission)

      expect(request.get).toHaveBeenCalledWith('/api/auth/check-permission', {
        params: { permission }
      })
      expect(result).toEqual(mockResponse)
      expect(result.data.hasPermission).toBe(true)
    })

    it('handles insufficient permissions', async () => {
      const permission = 'admin:delete'
      const mockResponse = mockApiResponse({ hasPermission: false })
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await authService.checkPermission(permission)

      expect(result.data.hasPermission).toBe(false)
    })
  })

  describe('getLoginHistory', () => {
    it('fetches login history successfully', async () => {
      const mockHistory = [
        {
          id: 1,
          loginTime: '2024-01-01 10:00:00',
          clientIp: '192.168.1.100',
          userAgent: 'Chrome/120.0',
          location: '北京市',
          status: 'success'
        },
        {
          id: 2,
          loginTime: '2024-01-01 09:00:00',
          clientIp: '192.168.1.100',
          userAgent: 'Chrome/120.0',
          location: '北京市',
          status: 'success'
        }
      ]
      const mockResponse = mockApiResponse(mockHistory)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const params = { page: 1, size: 10 }
      const result = await authService.getLoginHistory(params)

      expect(request.get).toHaveBeenCalledWith('/api/auth/login-history', { params })
      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(2)
    })
  })
})