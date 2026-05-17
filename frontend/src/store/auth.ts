import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/http'

interface User {
  id: number
  username: string
  realName: string
  tenant_id: number
}

interface ApiResponse {
  code: number
  message: string
  data: any
}

interface AuthState {
  token: string | null
  user: User | null
  tenant: any
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  fetchTenant: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      login: async (username: string, password: string) => {
        try {
          const res = await api.post('/api/auth/login', { username, password }) as ApiResponse
          if (res.code === 0) {
            set({ token: res.data.token, user: res.data.user })
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (err: any) {
          return { success: false, message: err.message || '登录失败' }
        }
      },
      logout: () => {
        set({ token: null, user: null, tenant: null })
        // 清除localStorage中的token
        localStorage.removeItem('smartauto-auth')
      },
      fetchTenant: async () => {
        // 可扩展
      },
    }),
    { name: 'smartauto-auth' }
  )
)

