import { test, expect } from '@playwright/test'

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
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
    
    // Navigate to user management
    await page.click('[data-testid="menu-user-management"]')
    await expect(page).toHaveURL(/.*\/users/)
  })

  test('should display user list', async ({ page }) => {
    // Mock user list response
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 1,
                username: 'admin',
                realName: '管理员',
                phone: '13800138001',
                email: 'admin@example.com',
                userType: 3,
                status: 1,
                createTime: '2024-01-01 10:00:00'
              },
              {
                id: 2,
                username: 'mediator1',
                realName: '调解员1',
                phone: '13800138002',
                email: 'mediator1@example.com',
                userType: 2,
                status: 1,
                createTime: '2024-01-02 10:00:00'
              }
            ],
            total: 2,
            current: 1,
            size: 10
          }
        })
      })
    })

    await page.reload()
    
    // Should display user table
    await expect(page.locator('.ant-table-tbody tr')).toHaveCount(2)
    await expect(page.locator('text=admin')).toBeVisible()
    await expect(page.locator('text=管理员')).toBeVisible()
    await expect(page.locator('text=mediator1')).toBeVisible()
    await expect(page.locator('text=调解员1')).toBeVisible()
  })

  test('should create new user', async ({ page }) => {
    // Mock user list first
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { records: [], total: 0 }
        })
      })
    })

    await page.reload()
    
    // Click create button
    await page.click('[data-testid="create-user-button"]')
    
    // Should open create modal
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-title')).toContainText('新增用户')
    
    // Fill form
    await page.fill('[data-testid="username-input"]', 'newuser')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="realname-input"]', '新用户')
    await page.fill('[data-testid="phone-input"]', '13800138003')
    await page.fill('[data-testid="email-input"]', 'newuser@example.com')
    await page.selectOption('[data-testid="usertype-select"]', '2')
    
    // Mock create response
    await page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: '用户创建成功',
            data: {
              id: 3,
              username: 'newuser',
              realName: '新用户',
              phone: '13800138003',
              email: 'newuser@example.com',
              userType: 2,
              status: 1
            }
          })
        })
      }
    })
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Should show success message and close modal
    await expect(page.locator('.ant-message')).toContainText('用户创建成功')
    await expect(page.locator('.ant-modal')).not.toBeVisible()
  })

  test('should edit user', async ({ page }) => {
    // Mock user list
    await page.route('**/api/users*', async (route) => {
      if (route.request().url().includes('/users/2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              id: 2,
              username: 'mediator1',
              realName: '调解员1',
              phone: '13800138002',
              email: 'mediator1@example.com',
              userType: 2,
              status: 1
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
              records: [
                {
                  id: 2,
                  username: 'mediator1',
                  realName: '调解员1',
                  phone: '13800138002',
                  email: 'mediator1@example.com',
                  userType: 2,
                  status: 1,
                  createTime: '2024-01-02 10:00:00'
                }
              ],
              total: 1
            }
          })
        })
      }
    })

    await page.reload()
    
    // Click edit button for first user
    await page.click('[data-testid="edit-user-2"]')
    
    // Should open edit modal
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-title')).toContainText('编辑用户')
    
    // Form should be pre-filled
    await expect(page.locator('[data-testid="username-input"]')).toHaveValue('mediator1')
    await expect(page.locator('[data-testid="realname-input"]')).toHaveValue('调解员1')
    
    // Update form
    await page.fill('[data-testid="realname-input"]', '调解员1（更新）')
    await page.fill('[data-testid="phone-input"]', '13900139002')
    
    // Mock update response
    await page.route('**/api/users/2', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: '用户更新成功',
            data: {
              id: 2,
              username: 'mediator1',
              realName: '调解员1（更新）',
              phone: '13900139002',
              userType: 2,
              status: 1
            }
          })
        })
      }
    })
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('用户更新成功')
  })

  test('should delete user', async ({ page }) => {
    // Mock user list
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 2,
                username: 'mediator1',
                realName: '调解员1',
                phone: '13800138002',
                userType: 2,
                status: 1
              }
            ],
            total: 1
          }
        })
      })
    })

    await page.reload()
    
    // Click delete button
    await page.click('[data-testid="delete-user-2"]')
    
    // Should show confirmation dialog
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-body')).toContainText('确定要删除用户')
    
    // Mock delete response
    await page.route('**/api/users/2', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: '用户删除成功'
          })
        })
      }
    })
    
    // Confirm deletion
    await page.click('.ant-modal .ant-btn-primary')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('用户删除成功')
  })

  test('should change user status', async ({ page }) => {
    // Mock user list
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 2,
                username: 'mediator1',
                realName: '调解员1',
                phone: '13800138002',
                userType: 2,
                status: 1
              }
            ],
            total: 1
          }
        })
      })
    })

    await page.reload()
    
    // Mock status update response
    await page.route('**/api/users/2/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: '用户状态更新成功'
        })
      })
    })
    
    // Click disable button
    await page.click('[data-testid="disable-user-2"]')
    
    // Should show confirmation
    await expect(page.locator('.ant-modal')).toBeVisible()
    await page.click('.ant-modal .ant-btn-primary')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('用户状态更新成功')
  })

  test('should search users', async ({ page }) => {
    // Mock search response
    await page.route('**/api/users*', async (route) => {
      const url = route.request().url()
      const searchParams = new URL(url).searchParams
      const keyword = searchParams.get('keyword')
      
      if (keyword === '调解') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              records: [
                {
                  id: 2,
                  username: 'mediator1',
                  realName: '调解员1',
                  phone: '13800138002',
                  userType: 2,
                  status: 1
                }
              ],
              total: 1
            }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: { records: [], total: 0 }
          })
        })
      }
    })

    // Search for users
    await page.fill('[data-testid="search-input"]', '调解')
    await page.click('[data-testid="search-button"]')
    
    // Should show filtered results
    await expect(page.locator('.ant-table-tbody tr')).toHaveCount(1)
    await expect(page.locator('text=调解员1')).toBeVisible()
  })

  test('should manage user roles', async ({ page }) => {
    // Mock user list
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 2,
                username: 'mediator1',
                realName: '调解员1',
                userType: 2,
                status: 1
              }
            ],
            total: 1
          }
        })
      })
    })

    await page.reload()
    
    // Click manage roles button
    await page.click('[data-testid="manage-roles-2"]')
    
    // Should open roles modal
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-title')).toContainText('分配角色')
    
    // Mock roles response
    await page.route('**/api/users/2/roles', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: [
              { id: 1, name: '调解员', code: 'mediator' }
            ]
          })
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: '角色分配成功'
          })
        })
      }
    })
    
    // Mock available roles
    await page.route('**/api/roles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { id: 1, name: '调解员', code: 'mediator' },
            { id: 2, name: '管理员', code: 'admin' }
          ]
        })
      })
    })
    
    // Select additional role
    await page.click('[data-testid="role-checkbox-2"]')
    
    // Submit role assignment
    await page.click('[data-testid="submit-roles-button"]')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('角色分配成功')
  })
})