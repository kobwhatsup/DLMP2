import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: User | null
  token: string | null
  
  // 动作
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      user: null,
      token: null,

      // 登录
      login: (user: User, token: string) => {
        set({
          isAuthenticated: true,
          user,
          token,
        })
      },

      // 登出
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      },

      // 更新用户信息
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },

      // 设置token
      setToken: (token: string) => {
        set({ token })
      },
    }),
    {
      name: 'auth-storage', // 存储key
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
)