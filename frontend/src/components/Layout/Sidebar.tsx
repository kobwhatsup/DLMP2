import { useNavigate } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import { useAuthStore, useAppStore } from '@/stores'
import { menuConfig, filterMenuByPermission } from '@/router/menuConfig'
import type { MenuItem } from '@/types'

const { Sider } = Layout
const { Title } = Typography

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { sidebarCollapsed, selectedMenuKey } = useAppStore()

  // 根据用户权限过滤菜单  
  const userRole = user?.userType === 1 ? 'admin' : 'user'
  const filteredMenus = filterMenuByPermission(menuConfig, userRole)

  // 将菜单配置转换为Ant Design Menu组件需要的格式
  const convertToMenuItems = (menus: MenuItem[]): any[] => {
    return menus.map((menu) => ({
      key: menu.key,
      icon: menu.icon,
      label: menu.label,
      children: menu.children ? convertToMenuItems(menu.children) : undefined,
    }))
  }

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    // 查找对应的菜单项
    const findMenuItem = (menus: MenuItem[], targetKey: string): MenuItem | null => {
      for (const menu of menus) {
        if (menu.key === targetKey) {
          return menu
        }
        if (menu.children) {
          const found = findMenuItem(menu.children, targetKey)
          if (found) return found
        }
      }
      return null
    }

    const menuItem = findMenuItem(filteredMenus, key)
    if (menuItem?.path) {
      navigate(menuItem.path)
    }
  }

  // 获取默认展开的菜单
  const getDefaultOpenKeys = (): string[] => {
    const openKeys: string[] = []
    
    // 查找选中菜单的父级
    const findParentKeys = (menus: MenuItem[], targetKey: string, parentKey?: string): void => {
      for (const menu of menus) {
        if (menu.children) {
          const hasTarget = menu.children.some(child => child.key === targetKey)
          if (hasTarget && parentKey) {
            openKeys.push(parentKey)
          }
          if (hasTarget) {
            openKeys.push(menu.key)
          }
          findParentKeys(menu.children, targetKey, menu.key)
        }
      }
    }
    
    findParentKeys(filteredMenus, selectedMenuKey)
    return openKeys
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebarCollapsed}
      width={240}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
      theme='dark'
    >
      {/* Logo和标题 */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #001529',
        }}
      >
        {!sidebarCollapsed ? (
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            全国分散诉调平台
          </Title>
        ) : (
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            DLMP
          </Title>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        theme='dark'
        mode='inline'
        selectedKeys={[selectedMenuKey]}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={convertToMenuItems(filteredMenus)}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          height: 'calc(100vh - 64px)',
        }}
      />
    </Sider>
  )
}

export default Sidebar