import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
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
  })

  test('should navigate to all main pages', async ({ page }) => {
    // Dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('h1')).toContainText('数据概览')
    
    // Case Management
    await page.click('[data-testid="menu-case-management"]')
    await expect(page).toHaveURL(/.*\/cases/)
    await expect(page.locator('h1')).toContainText('案件管理')
    
    // Smart Assignment
    await page.click('[data-testid="menu-smart-assignment"]')
    await expect(page).toHaveURL(/.*\/assignment/)
    await expect(page.locator('h1')).toContainText('智能分案')
    
    // Mediation Management
    await page.click('[data-testid="menu-mediation"]')
    await expect(page).toHaveURL(/.*\/mediation/)
    await expect(page.locator('h1')).toContainText('调解管理')
    
    // Litigation Management
    await page.click('[data-testid="menu-litigation"]')
    await expect(page).toHaveURL(/.*\/litigation/)
    await expect(page.locator('h1')).toContainText('诉讼管理')
    
    // Settlement Management
    await page.click('[data-testid="menu-settlement"]')
    await expect(page).toHaveURL(/.*\/settlement/)
    await expect(page.locator('h1')).toContainText('结算管理')
    
    // User Management
    await page.click('[data-testid="menu-user-management"]')
    await expect(page).toHaveURL(/.*\/users/)
    await expect(page.locator('h1')).toContainText('用户管理')
    
    // System Settings
    await page.click('[data-testid="menu-settings"]')
    await expect(page).toHaveURL(/.*\/settings/)
    await expect(page.locator('h1')).toContainText('系统设置')
  })

  test('should handle menu collapse/expand', async ({ page }) => {
    // Menu should be expanded by default
    await expect(page.locator('.ant-layout-sider')).not.toHaveClass(/.*ant-layout-sider-collapsed.*/)
    
    // Click collapse button
    await page.click('[data-testid="menu-collapse-button"]')
    
    // Menu should be collapsed
    await expect(page.locator('.ant-layout-sider')).toHaveClass(/.*ant-layout-sider-collapsed.*/)
    
    // Click expand button
    await page.click('[data-testid="menu-collapse-button"]')
    
    // Menu should be expanded again
    await expect(page.locator('.ant-layout-sider')).not.toHaveClass(/.*ant-layout-sider-collapsed.*/)
  })

  test('should show correct breadcrumbs', async ({ page }) => {
    // Dashboard breadcrumb
    await expect(page.locator('.ant-breadcrumb')).toContainText('首页')
    await expect(page.locator('.ant-breadcrumb')).toContainText('数据概览')
    
    // Navigate to case management
    await page.click('[data-testid="menu-case-management"]')
    await expect(page.locator('.ant-breadcrumb')).toContainText('案件管理')
    
    // Navigate to case detail (if exists)
    await page.route('**/api/cases*', async (route) => {
      if (route.request().url().includes('/cases/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              id: 1,
              caseNumber: 'CASE001',
              borrowerName: '张三'
            }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              records: [{
                id: 1,
                caseNumber: 'CASE001',
                borrowerName: '张三'
              }],
              total: 1
            }
          })
        })
      }
    })

    // Go to case detail
    await page.goto('/cases/1')
    await expect(page.locator('.ant-breadcrumb')).toContainText('案件管理')
    await expect(page.locator('.ant-breadcrumb')).toContainText('案件详情')
  })

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to cases
    await page.click('[data-testid="menu-case-management"]')
    await expect(page).toHaveURL(/.*\/cases/)
    
    // Navigate to users
    await page.click('[data-testid="menu-user-management"]')
    await expect(page).toHaveURL(/.*\/users/)
    
    // Go back
    await page.goBack()
    await expect(page).toHaveURL(/.*\/cases/)
    
    // Go back again
    await page.goBack()
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Go forward
    await page.goForward()
    await expect(page).toHaveURL(/.*\/cases/)
  })

  test('should show user profile in header', async ({ page }) => {
    // Should show user name
    await expect(page.locator('[data-testid="user-info"]')).toContainText('管理员')
    
    // Click user dropdown
    await page.click('[data-testid="user-dropdown"]')
    
    // Should show dropdown menu
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="settings-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()
  })

  test('should handle active menu highlighting', async ({ page }) => {
    // Dashboard should be active initially
    await expect(page.locator('[data-testid="menu-dashboard"]')).toHaveClass(/.*ant-menu-item-selected.*/)
    
    // Navigate to cases
    await page.click('[data-testid="menu-case-management"]')
    await expect(page.locator('[data-testid="menu-case-management"]')).toHaveClass(/.*ant-menu-item-selected.*/)
    await expect(page.locator('[data-testid="menu-dashboard"]')).not.toHaveClass(/.*ant-menu-item-selected.*/)
    
    // Navigate to users
    await page.click('[data-testid="menu-user-management"]')
    await expect(page.locator('[data-testid="menu-user-management"]')).toHaveClass(/.*ant-menu-item-selected.*/)
    await expect(page.locator('[data-testid="menu-case-management"]')).not.toHaveClass(/.*ant-menu-item-selected.*/)
  })

  test('should handle submenu expansion', async ({ page }) => {
    // If there are submenus, test their expansion
    const systemMenu = page.locator('[data-testid="menu-system"]')
    
    if (await systemMenu.isVisible()) {
      // Click system menu to expand
      await systemMenu.click()
      
      // Should show submenu items
      await expect(page.locator('[data-testid="submenu-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="submenu-logs"]')).toBeVisible()
      
      // Click submenu item
      await page.click('[data-testid="submenu-settings"]')
      await expect(page).toHaveURL(/.*\/settings/)
    }
  })
})