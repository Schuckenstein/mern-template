// client/src/hooks/useApi.ts

import { useState, useCallback } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { logger } from '@/utils/logger'

interface ApiHookOptions {
  showErrorNotification?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
}

export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiHookOptions = {}
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNotification } = useUiStore()

  const {
    showErrorNotification = true,
    showSuccessNotification = false,
    successMessage = 'Operation completed successfully'
  } = options

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(...args)
      setData(result)
      
      if (showSuccessNotification) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: successMessage
        })
      }
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      
      if (showErrorNotification) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage
        })
      }
      
      logger.error('API call failed', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, showErrorNotification, showSuccessNotification, successMessage, addNotification])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

// =============================================