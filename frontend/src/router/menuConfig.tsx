import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  BranchesOutlined,
  TeamOutlined,
  AuditOutlined,
  DollarOutlined,
  BellOutlined,
  FolderOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { MenuItem } from '@/types'

// 菜单配置
export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    key: 'case',
    label: '案件管理',
    icon: <FileTextOutlined />,
    children: [
      {
        key: 'case-management',
        label: '案件列表',
        path: '/case/management',
      },
      {
        key: 'case-import',
        label: '案件导入',
        path: '/case/import',
      },
    ],
  },
  {
    key: 'assignment',
    label: '智能分案',
    icon: <BranchesOutlined />,
    children: [
      {
        key: 'assignment-management',
        label: '分案管理',
        path: '/assignment/management',
      },
    ],
  },
  {
    key: 'mediation',
    label: '调解管理',
    icon: <TeamOutlined />,
    children: [
      {
        key: 'mediation-management',
        label: '调解案件',
        path: '/mediation/management',
      },
    ],
  },
  {
    key: 'litigation',
    label: '诉讼管理',
    icon: <AuditOutlined />,
    children: [
      {
        key: 'litigation-management',
        label: '诉讼案件',
        path: '/litigation/management',
      },
    ],
  },
  {
    key: 'settlement',
    label: '结算管理',
    icon: <DollarOutlined />,
    children: [
      {
        key: 'settlement-management',
        label: '结算列表',
        path: '/settlement/management',
      },
    ],
  },
  {
    key: 'user',
    label: '用户管理',
    icon: <UserOutlined />,
    children: [
      {
        key: 'user-management',
        label: '用户列表',
        path: '/user/management',
      },
    ],
    permission: 'admin', // 仅管理员可见
  },
  {
    key: 'notification',
    label: '消息中心',
    icon: <BellOutlined />,
    children: [
      {
        key: 'notification-center',
        label: '通知列表',
        path: '/notification/center',
      },
    ],
  },
  {
    key: 'file',
    label: '文件管理',
    icon: <FolderOutlined />,
    children: [
      {
        key: 'file-management',
        label: '文件列表',
        path: '/file/management',
      },
    ],
  },
  {
    key: 'system',
    label: '系统设置',
    icon: <SettingOutlined />,
    children: [
      {
        key: 'system-settings',
        label: '系统配置',
        path: '/system/settings',
      },
    ],
    permission: 'admin', // 仅管理员可见
  },
]

/**
 * 根据权限过滤菜单
 */
export const filterMenuByPermission = (menus: MenuItem[], userRole?: string): MenuItem[] => {
  return menus
    .filter(menu => {
      // 如果菜单没有权限要求，或者用户角色匹配，则显示
      if (!menu.permission || menu.permission === userRole) {
        return true
      }
      return false
    })
    .map(menu => {
      if (menu.children) {
        return {
          ...menu,
          children: filterMenuByPermission(menu.children, userRole),
        }
      }
      return menu
    })
    .filter(menu => {
      // 过滤掉没有子菜单的父菜单
      if (menu.children && menu.children.length === 0) {
        return false
      }
      return true
    })
}

/**
 * 根据路径获取菜单项
 */
export const getMenuItemByPath = (menus: MenuItem[], path: string): MenuItem | null => {
  for (const menu of menus) {
    if (menu.path === path) {
      return menu
    }
    if (menu.children) {
      const found = getMenuItemByPath(menu.children, path)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * 获取面包屑导航
 */
export const getBreadcrumbItems = (menus: MenuItem[], path: string): MenuItem[] => {
  const breadcrumbs: MenuItem[] = []
  
  const findPath = (items: MenuItem[], targetPath: string, parents: MenuItem[] = []): boolean => {
    for (const item of items) {
      const currentPath = [...parents, item]
      
      if (item.path === targetPath) {
        breadcrumbs.push(...currentPath)
        return true
      }
      
      if (item.children && findPath(item.children, targetPath, currentPath)) {
        return true
      }
    }
    return false
  }
  
  findPath(menus, path)
  return breadcrumbs
}

export default menuConfig