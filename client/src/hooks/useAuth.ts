// client/src/hooks/useAuth.ts

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { logger } from '@/utils/logger'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { addNotification } = useUiStore()

  useEffect(() => {
    // Initialize auth on app start
    const initAuth = async () => {
      try {
        await authStore.getCurrentUser()
      } catch (error) {
        logger.error('Auth initialization failed', error)
      }
    }

    initAuth()
  }, [])

  const loginWithCredentials = async (credentials: any) => {
    try {
      await authStore.login(credentials)
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have been logged in successfully.'
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error.message || 'Unable to log in. Please check your credentials.'
      })
      throw error
    }
  }

  const registerWithCredentials = async (credentials: any) => {
    try {
      await authStore.register(credentials)
      addNotification({
        type: 'success',
        title: 'Account Created!',
        message: 'Your account has been created successfully.'
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Unable to create account. Please try again.'
      })
      throw error
    }
  }

  const logoutUser = async () => {
    try {
      await authStore.logout()
      addNotification({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been logged out successfully.'
      })
    } catch (error: any) {
      logger.error('Logout error', error)
    }
  }

  return {
    ...authStore,
    login: loginWithCredentials,
    register: registerWithCredentials,
    logout: logoutUser
  }
}

// =============================================