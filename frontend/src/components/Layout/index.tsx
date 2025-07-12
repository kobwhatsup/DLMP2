import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout } from 'antd'
import { useAuthStore, useAppStore } from '@/stores'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'

const { Content } = AntLayout

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { sidebarCollapsed, setSelectedMenuKey, setBreadcrumbs } = useAppStore()

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 根据路由更新菜单状态
  useEffect(() => {
    const path = location.pathname
    
    // 根据路径设置选中的菜单
    if (path.startsWith('/dashboard')) {
      setSelectedMenuKey('dashboard')
      setBreadcrumbs([{ key: 'dashboard', label: '工作台', path: '/dashboard' }])
    } else if (path.startsWith('/case/management')) {
      setSelectedMenuKey('case-management')
      setBreadcrumbs([
        { key: 'case', label: '案件管理' },
        { key: 'case-management', label: '案件列表', path: '/case/management' },
      ])
    } else if (path.startsWith('/case/import')) {
      setSelectedMenuKey('case-import')
      setBreadcrumbs([
        { key: 'case', label: '案件管理' },
        { key: 'case-import', label: '案件导入', path: '/case/import' },
      ])
    } else if (path.startsWith('/case/detail')) {
      setSelectedMenuKey('case-management')
      setBreadcrumbs([
        { key: 'case', label: '案件管理' },
        { key: 'case-management', label: '案件列表', path: '/case/management' },
        { key: 'case-detail', label: '案件详情' },
      ])
    } else if (path.startsWith('/user')) {
      setSelectedMenuKey('user-management')
      setBreadcrumbs([
        { key: 'user', label: '用户管理' },
        { key: 'user-management', label: '用户列表', path: '/user/management' },
      ])
    }
    // 可以继续添加其他路由的处理...
  }, [location.pathname, setSelectedMenuKey, setBreadcrumbs])

  if (!isAuthenticated) {
    return null
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <AntLayout className={sidebarCollapsed ? 'layout-collapsed' : ''}>
        <Header />
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb />
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 112px)',
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout