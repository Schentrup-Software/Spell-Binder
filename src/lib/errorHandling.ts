// Error types for better error handling
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  retryable?: boolean
  field?: string
}

// Create a standardized error from various error sources
export function createAppError(error: any, _context?: string): AppError {
  // Handle PocketBase errors
  if (error?.response?.data) {
    const pbError = error.response.data
    
    // Handle validation errors
    if (pbError.code === 400 && pbError.data) {
      const fieldErrors = Object.keys(pbError.data)
      if (fieldErrors.length > 0) {
        const firstField = fieldErrors[0]
        const fieldError = pbError.data[firstField]
        return {
          type: ErrorType.VALIDATION,
          message: fieldError.message || 'Validation error',
          field: firstField,
          originalError: error,
          retryable: false
        }
      }
    }
    
    // Handle not found errors
    if (pbError.code === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'The requested resource was not found',
        originalError: error,
        retryable: false
      }
    }
    
    // Handle unauthorized errors
    if (pbError.code === 401 || pbError.code === 403) {
      return {
        type: ErrorType.UNAUTHORIZED,
        message: 'You are not authorized to perform this action',
        originalError: error,
        retryable: false
      }
    }
    
    // Handle server errors
    if (pbError.code >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'A server error occurred. Please try again later.',
        originalError: error,
        retryable: true
      }
    }
  }
  
  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
      retryable: true
    }
  }
  
  // Handle timeout errors
  if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Request timed out. Please try again.',
      originalError: error,
      retryable: true
    }
  }
  
  // Default to unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'An unexpected error occurred',
    originalError: error,
    retryable: false
  }
}

// Get user-friendly error message
export function getErrorMessage(error: AppError, context?: string): string {
  const contextPrefix = context ? `${context}: ` : ''
  
  switch (error.type) {
    case ErrorType.NETWORK:
      return `${contextPrefix}Unable to connect. Please check your internet connection and try again.`
    
    case ErrorType.VALIDATION:
      return error.message
    
    case ErrorType.NOT_FOUND:
      return `${contextPrefix}The requested item could not be found.`
    
    case ErrorType.UNAUTHORIZED:
      return `${contextPrefix}You don't have permission to perform this action.`
    
    case ErrorType.SERVER:
      return `${contextPrefix}Server error. Please try again in a few moments.`
    
    case ErrorType.UNKNOWN:
    default:
      return `${contextPrefix}Something went wrong. Please try again.`
  }
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      const appError = createAppError(error)
      
      // Don't retry if error is not retryable
      if (!appError.retryable || attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Debounced error handler for form validation
export function createDebouncedErrorHandler(
  callback: (error: AppError) => void,
  delay: number = 300
) {
  let timeoutId: number | undefined
  
  return (error: any, context?: string) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      const appError = createAppError(error, context)
      callback(appError)
    }, delay)
  }
}

// Log errors for debugging (in development) or monitoring (in production)
export function logError(error: AppError, context?: string) {
  const logData = {
    type: error.type,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    originalError: error.originalError
  }
  
  if (import.meta.env.DEV) {
    console.error('App Error:', logData)
  } else {
    // In production, you might want to send this to a monitoring service
    // Example: sendToMonitoringService(logData)
  }
}