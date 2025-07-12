import { create } from 'zustand'

interface AppState {
  // 全局loading状态
  loading: boolean
  
  // 侧边栏折叠状态
  sidebarCollapsed: boolean
  
  // 当前选中的菜单key
  selectedMenuKey: string
  
  // 面包屑路径
  breadcrumbs: Array<{ key: string; label: string; path?: string }>
  
  // 页面标题
  pageTitle: string
  
  // 主题模式
  themeMode: 'light' | 'dark'
  
  // 动作
  setLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedMenuKey: (key: string) => void
  setBreadcrumbs: (breadcrumbs: Array<{ key: string; label: string; path?: string }>) => void
  setPageTitle: (title: string) => void
  setThemeMode: (mode: 'light' | 'dark') => void
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  loading: false,
  sidebarCollapsed: false,
  selectedMenuKey: 'dashboard',
  breadcrumbs: [{ key: 'dashboard', label: '工作台', path: '/dashboard' }],
  pageTitle: '个贷不良资产分散诉讼调解平台',
  themeMode: 'light',

  // 设置全局loading
  setLoading: (loading: boolean) => set({ loading }),

  // 切换侧边栏折叠状态
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // 设置侧边栏折叠状态
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

  // 设置选中的菜单key
  setSelectedMenuKey: (key: string) => set({ selectedMenuKey: key }),

  // 设置面包屑
  setBreadcrumbs: (breadcrumbs: Array<{ key: string; label: string; path?: string }>) =>
    set({ breadcrumbs }),

  // 设置页面标题
  setPageTitle: (title: string) => {
    set({ pageTitle: title })
    document.title = title
  },

  // 设置主题模式
  setThemeMode: (mode: 'light' | 'dark') => set({ themeMode: mode }),
}))