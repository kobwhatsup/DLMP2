import { create } from 'zustand'
import type { Case, PaginationData, SearchParams } from '@/types'

interface CaseState {
  // 案件列表
  caseList: Case[]
  
  // 分页信息
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  
  // 搜索参数
  searchParams: SearchParams
  
  // 当前选中的案件
  selectedCase: Case | null
  
  // 案件导入状态
  importLoading: boolean
  
  // 动作
  setCaseList: (data: PaginationData<Case>) => void
  setSearchParams: (params: Partial<SearchParams>) => void
  setSelectedCase: (caseItem: Case | null) => void
  setImportLoading: (loading: boolean) => void
  resetStore: () => void
}

export const useCaseStore = create<CaseState>((set) => ({
  // 初始状态
  caseList: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  searchParams: {
    page: 1,
    size: 10,
  },
  selectedCase: null,
  importLoading: false,

  // 设置案件列表
  setCaseList: (data: PaginationData<Case>) => {
    set({
      caseList: data.records,
      pagination: {
        current: data.current,
        pageSize: data.size,
        total: data.total,
      },
    })
  },

  // 设置搜索参数
  setSearchParams: (params: Partial<SearchParams>) => {
    set((state) => ({
      searchParams: { ...state.searchParams, ...params },
    }))
  },

  // 设置选中的案件
  setSelectedCase: (caseItem: Case | null) => {
    set({ selectedCase: caseItem })
  },

  // 设置导入loading状态
  setImportLoading: (loading: boolean) => {
    set({ importLoading: loading })
  },

  // 重置store
  resetStore: () => {
    set({
      caseList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      searchParams: {
        page: 1,
        size: 10,
      },
      selectedCase: null,
      importLoading: false,
    })
  },
}))