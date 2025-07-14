import { test, expect } from '@playwright/test'

test.describe('Case Management', () => {
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
    
    // Navigate to case management
    await page.click('[data-testid="menu-case-management"]')
    await expect(page).toHaveURL(/.*\/cases/)
  })

  test('should display case list', async ({ page }) => {
    // Mock case list response
    await page.route('**/api/cases*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [
              {
                id: 1,
                caseNumber: 'CASE001',
                borrowerName: '张三',
                debtorIdCard: '110101199001011234',
                debtAmount: 100000,
                phone: '13800138001',
                status: 1,
                createTime: '2024-01-01 10:00:00'
              },
              {
                id: 2,
                caseNumber: 'CASE002',
                borrowerName: '李四',
                debtorIdCard: '110101199002022345',
                debtAmount: 200000,
                phone: '13800138002',
                status: 2,
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
    
    // Should display case table
    await expect(page.locator('.ant-table-tbody tr')).toHaveCount(2)
    await expect(page.locator('text=CASE001')).toBeVisible()
    await expect(page.locator('text=张三')).toBeVisible()
    await expect(page.locator('text=李四')).toBeVisible()
  })

  test('should search cases', async ({ page }) => {
    // Mock search response
    await page.route('**/api/cases*', async (route) => {
      const url = route.request().url()
      const searchParams = new URL(url).searchParams
      const keyword = searchParams.get('keyword')
      
      if (keyword === '张三') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              records: [
                {
                  id: 1,
                  caseNumber: 'CASE001',
                  borrowerName: '张三',
                  debtorIdCard: '110101199001011234',
                  debtAmount: 100000,
                  phone: '13800138001',
                  status: 1,
                  createTime: '2024-01-01 10:00:00'
                }
              ],
              total: 1,
              current: 1,
              size: 10
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
              records: [],
              total: 0,
              current: 1,
              size: 10
            }
          })
        })
      }
    })

    // Search for specific case
    await page.fill('[data-testid="search-input"]', '张三')
    await page.click('[data-testid="search-button"]')
    
    // Should show filtered results
    await expect(page.locator('.ant-table-tbody tr')).toHaveCount(1)
    await expect(page.locator('text=CASE001')).toBeVisible()
    await expect(page.locator('text=张三')).toBeVisible()
  })

  test('should create new case', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-case-button"]')
    
    // Should open create modal
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-title')).toContainText('新增案件')
    
    // Fill form
    await page.fill('[data-testid="case-number-input"]', 'CASE003')
    await page.fill('[data-testid="borrower-name-input"]', '王五')
    await page.fill('[data-testid="debtor-idcard-input"]', '110101199003033456')
    await page.fill('[data-testid="debt-amount-input"]', '150000')
    await page.fill('[data-testid="phone-input"]', '13800138003')
    
    // Mock create response
    await page.route('**/api/cases', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: '案件创建成功',
            data: {
              id: 3,
              caseNumber: 'CASE003',
              borrowerName: '王五',
              debtorIdCard: '110101199003033456',
              debtAmount: 150000,
              phone: '13800138003',
              status: 1
            }
          })
        })
      }
    })
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Should show success message and close modal
    await expect(page.locator('.ant-message')).toContainText('案件创建成功')
    await expect(page.locator('.ant-modal')).not.toBeVisible()
  })

  test('should view case details', async ({ page }) => {
    // Mock case list
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
              borrowerName: '张三',
              debtorIdCard: '110101199001011234',
              debtAmount: 100000,
              phone: '13800138001',
              status: 1,
              createTime: '2024-01-01 10:00:00',
              materials: []
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
                  id: 1,
                  caseNumber: 'CASE001',
                  borrowerName: '张三',
                  debtorIdCard: '110101199001011234',
                  debtAmount: 100000,
                  phone: '13800138001',
                  status: 1,
                  createTime: '2024-01-01 10:00:00'
                }
              ],
              total: 1,
              current: 1,
              size: 10
            }
          })
        })
      }
    })

    await page.reload()
    
    // Click view button for first case
    await page.click('[data-testid="view-case-1"]')
    
    // Should navigate to case detail page
    await expect(page).toHaveURL(/.*\/cases\/1/)
    await expect(page.locator('h1')).toContainText('案件详情')
    await expect(page.locator('text=CASE001')).toBeVisible()
    await expect(page.locator('text=张三')).toBeVisible()
  })

  test('should export case list', async ({ page }) => {
    // Mock export response
    await page.route('**/api/cases/export*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': 'attachment; filename=cases.xlsx'
        },
        body: 'mock excel data'
      })
    })

    // Mock case list first
    await page.route('**/api/cases*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            records: [],
            total: 0,
            current: 1,
            size: 10
          }
        })
      })
    })

    await page.reload()
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.click('[data-testid="export-button"]')
    
    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('cases.xlsx')
  })

  test('should handle batch import', async ({ page }) => {
    // Click import button
    await page.click('[data-testid="import-button"]')
    
    // Should open import modal
    await expect(page.locator('.ant-modal')).toBeVisible()
    await expect(page.locator('.ant-modal-title')).toContainText('批量导入案件')
    
    // Mock import response
    await page.route('**/api/cases/batch-import', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: '导入成功',
          data: {
            successCount: 2,
            failCount: 0,
            errors: []
          }
        })
      })
    })
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'cases.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('caseNumber,borrowerName,debtAmount\nCASE004,赵六,300000\nCASE005,孙七,400000')
    })
    
    // Submit import
    await page.click('[data-testid="upload-button"]')
    
    // Should show success message
    await expect(page.locator('.ant-message')).toContainText('导入成功')
  })
})