import React from 'react'
import { render, RenderOptions, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { ConfigProvider, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { vi } from 'vitest'

// Mock数据生成器
export const mockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  realName: '测试用户',
  phone: '13800138000',
  email: 'test@example.com',
  userType: 1,
  status: 1,
  createdTime: '2024-01-01 10:00:00',
  ...overrides
})

export const mockCase = (overrides = {}) => ({
  id: 1,
  caseNumber: 'CASE001',
  borrowerName: '张三',
  debtorIdCard: '110101199001011234',
  debtAmount: 10000,
  phone: '13800138001',
  status: 1,
  createTime: '2024-01-01 10:00:00',
  ...overrides
})

export const mockApiResponse = <T>(data: T) => ({
  code: 200,
  message: 'success',
  data
})

export const mockPaginationData = <T>(records: T[], total = records.length) => ({
  records,
  total,
  size: 10,
  current: 1,
  pages: Math.ceil(total / 10)
})

// Provider配置
interface ProvidersProps {
  children: React.ReactNode
  initialEntries?: string[]
}

const AllTheProviders: React.FC<ProvidersProps> = ({ 
  children, 
  initialEntries = ['/'] 
}) => {
  const Router = initialEntries.length > 1 ? MemoryRouter : BrowserRouter
  const routerProps = initialEntries.length > 1 
    ? { initialEntries } 
    : {}

  return (
    <Router {...routerProps}>
      <ConfigProvider locale={zhCN}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </Router>
  )
}

// 自定义渲染选项
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

const customRender = (
  ui: React.ReactElement, 
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, ...renderOptions } = options
  
  return render(ui, { 
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ), 
    ...renderOptions 
  })
}

// 等待元素出现
export const waitForElement = async (selector: string) => {
  return waitFor(() => {
    const element = screen.getByTestId(selector) || screen.getByText(selector)
    expect(element).toBeInTheDocument()
    return element
  })
}

// 模拟API调用
export const mockApiCall = (response: any, delay = 0) => {
  return vi.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve(response), delay)
    )
  )
}

// 模拟失败的API调用
export const mockApiError = (error: any = new Error('API Error')) => {
  return vi.fn().mockRejectedValue(error)
}

// 表单填充辅助函数
export const fillForm = async (formData: Record<string, any>) => {
  const user = userEvent.setup()
  
  for (const [name, value] of Object.entries(formData)) {
    const input = screen.getByRole('textbox', { name: new RegExp(name, 'i') }) ||
                  screen.getByLabelText(new RegExp(name, 'i')) ||
                  screen.getByPlaceholderText(new RegExp(name, 'i'))
    
    if (input) {
      await user.clear(input)
      await user.type(input, String(value))
    }
  }
}

// 点击按钮辅助函数
export const clickButton = async (buttonText: string | RegExp) => {
  const user = userEvent.setup()
  const button = screen.getByRole('button', { name: buttonText })
  await user.click(button)
}

// 等待加载完成
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/loading|加载中|Loading/i)).not.toBeInTheDocument()
  })
}

// 模拟文件上传
export const mockFileUpload = (fileName = 'test.txt', content = 'test content') => {
  const file = new File([content], fileName, { type: 'text/plain' })
  return file
}

// 创建带有默认props的组件渲染器
export const createRenderer = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  defaultProps: Partial<T> = {}
) => {
  return (props: Partial<T> = {}) => {
    const mergedProps = { ...defaultProps, ...props } as T
    return customRender(<Component {...mergedProps} />)
  }
}

// 断言辅助函数
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string | RegExp) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

// 重新导出所有测试工具
export * from '@testing-library/react'
export { userEvent }
export { customRender as render }