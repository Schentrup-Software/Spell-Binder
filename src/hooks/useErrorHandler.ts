import { useCallback } from 'react'
import { useToast } from '../components/ToastProvider'
import { createAppError, getErrorMessage, logError } from '../lib/errorHandling'

export interface UseErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  context?: string
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast: showToastNotification } = useToast()
  const {
    showToast = true,
    logError: shouldLogError = true,
    context
  } = options

  const handleError = useCallback((error: any, customContext?: string) => {
    const appError = createAppError(error, customContext || context)
    
    // Log the error if enabled
    if (shouldLogError) {
      logError(appError, customContext || context)
    }
    
    // Show toast notification if enabled
    if (showToast) {
      const message = getErrorMessage(appError, customContext || context)
      showToastNotification(message, 'error')
    }
    
    return appError
  }, [showToast, shouldLogError, context, showToastNotification])

  const handleSuccess = useCallback((message: string) => {
    if (showToast) {
      showToastNotification(message, 'success')
    }
  }, [showToast, showToastNotification])

  const handleInfo = useCallback((message: string) => {
    if (showToast) {
      showToastNotification(message, 'info')
    }
  }, [showToast, showToastNotification])

  return {
    handleError,
    handleSuccess,
    handleInfo
  }
}