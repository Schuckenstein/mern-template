// client/src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginCredentials, RegisterCredentials } from '@shared/types'
import { authService } from '@/services/authService'
import { logger } from '@/utils/logger'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  getCurrentUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true })
          
          const response = await authService.login(credentials)
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          logger.info('User logged in successfully', { userId: user.id })
        } catch (error) {
          set({ isLoading: false })
          logger.error('Login failed', error)
          throw error
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true })
          
          const response = await authService.register(credentials)
          const { user, accessToken, refreshToken } = response.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          logger.info('User registered successfully', { userId: user.id })
        } catch (error) {
          set({ isLoading: false })
          logger.error('Registration failed', error)
          throw error
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          
          if (refreshToken) {
            await authService.logout(refreshToken)
          }
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false
          })
          
          logger.info('User logged out')
        } catch (error) {
          // Clear local state even if logout request fails
          get().clearAuth()
          logger.error('Logout error', error)
        }
      },

      refreshTokens: async () => {
        try {
          const { refreshToken } = get()
          
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }
          
          const response = await authService.refreshToken(refreshToken)
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data
          
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          })
          
          logger.info('Tokens refreshed successfully')
        } catch (error) {
          logger.error('Token refresh failed', error)
          get().clearAuth()
          throw error
        }
      },

      getCurrentUser: async () => {
        try {
          const { accessToken } = get()
          
          if (!accessToken) {
            set({ isLoading: false })
            return
          }
          
          const response = await authService.getCurrentUser()
          const { user } = response.data
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          logger.error('Failed to get current user', error)
          get().clearAuth()
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Initialize auth state on app start
export const initializeAuth = async () => {
  const { getCurrentUser, setLoading } = useAuthStore.getState()
  setLoading(true)
  await getCurrentUser()
}

// =============================================