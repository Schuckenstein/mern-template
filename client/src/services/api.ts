// client/src/services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { logger } from '@/utils/logger'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers
    })
    
    return config
  },
  (error) => {
    logger.error('API Request Error', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    logger.error('API Response Error', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    })

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { refreshTokens } = useAuthStore.getState()
        await refreshTokens()
        
        // Retry original request with new token
        const { accessToken } = useAuthStore.getState()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        const { clearAuth } = useAuthStore.getState()
        const { addNotification } = useUiStore.getState()
        
        clearAuth()
        addNotification({
          type: 'error',
          title: 'Session Expired',
          message: 'Please log in again to continue.'
        })
        
        // Redirect to login page
        window.location.href = '/auth/login'
        
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      const { addNotification } = useUiStore.getState()
      addNotification({
        type: 'error',
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.'
      })
    }

    return Promise.reject(error)
  }
)

export { api }

// Helper function for API calls
export const apiCall = async <T = any>(
  config: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  try {
    const response = await api(config)
    return {
      data: response.data.data || response.data,
      status: response.status
    }
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      details: error.response?.data?.error?.details
    }
  }
}