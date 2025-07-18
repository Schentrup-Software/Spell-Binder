import { useState, useCallback } from 'react'

export interface LoadingState {
  [key: string]: boolean
}

export function useLoadingState(initialState: LoadingState = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState)

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading)
  }, [loadingStates])

  const withLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true)
    try {
      return await operation()
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  const reset = useCallback(() => {
    setLoadingStates({})
  }, [])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    reset
  }
}