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
  if (error?.response) {
    const pbError = error.response
    
    // Handle validation errors
    if (pbError.status === 400) {
      return {
        type: ErrorType.VALIDATION,
        message: pbError.message || 'Validation error',
        originalError: error,
        retryable: false
      }
    }
    
    // Handle not found errors
    if (pbError.status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'The requested resource was not found',
        originalError: error,
        retryable: false
      }
    }
    
    // Handle unauthorized errors
    if (pbError.status === 401 || pbError.status === 403) {
      return {
        type: ErrorType.UNAUTHORIZED,
        message: 'You are not authorized to perform this action',
        originalError: error,
        retryable: false
      }
    }
    
    // Handle server errors
    if (pbError.status >= 500) {
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
    console.error('Network error:', error);
    return {
      type: ErrorType.NETWORK,
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
      retryable: true
    }
  }
  
  // Handle timeout errors
  if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
    console.error('Timeout error:', error);
    return {
      type: ErrorType.NETWORK,
      message: 'Request timed out. Please try again.',
      originalError: error,
      retryable: true
    }
  }
  
  // Default to unknown error
  console.error('Unknown error:', error);
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