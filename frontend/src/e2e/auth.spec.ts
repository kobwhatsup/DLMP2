import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('h1')).toContainText('登录')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page if not already there
    await page.goto('/login')
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            userId: 1,
            username: 'admin',
            realName: '管理员',
            userType: 3,
            expiresIn: 7200
          }
        })
      })
    })
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('.ant-layout-header')).toContainText('管理员')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="username-input"]', 'wronguser')
    await page.fill('[data-testid="password-input"]', 'wrongpass')
    
    // Mock failed login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 401,
          message: '用户名或密码错误'
        })
      })
    })
    
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('.ant-message')).toContainText('用户名或密码错误')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            token: 'mock-jwt-token',
            userId: 1,
            username: 'admin',
            realName: '管理员',
            userType: 3
          }
        })
      })
    })
    
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Mock logout response
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'success'
        })
      })
    })
    
    // Click logout
    await page.click('[data-testid="user-dropdown"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/login')
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]')
    await expect(page).toHaveURL(/.*\/forgot-password/)
    
    // Fill email
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    
    // Mock forgot password response
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: '重置密码邮件已发送'
        })
      })
    })
    
    await page.click('[data-testid="send-reset-button"]')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('重置密码邮件已发送')
  })
})