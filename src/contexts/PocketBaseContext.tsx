import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '../lib/pocketbase'

interface PocketBaseContextType {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  reconnect: () => Promise<void>
}

const PocketBaseContext = createContext<PocketBaseContextType | undefined>(undefined)

interface PocketBaseProviderProps {
  children: ReactNode
}

export function PocketBaseProvider({ children }: PocketBaseProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Test connection by fetching health status
      await pb.health.check()
      setIsConnected(true)
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Failed to connect to PocketBase')
      console.error('PocketBase connection error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const reconnect = async () => {
    await checkConnection()
  }

  useEffect(() => {
    checkConnection()
    
    // Set up periodic health checks
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const value: PocketBaseContextType = {
    isConnected,
    isLoading,
    error,
    reconnect
  }

  return (
    <PocketBaseContext.Provider value={value}>
      {children}
    </PocketBaseContext.Provider>
  )
}

export function usePocketBase() {
  const context = useContext(PocketBaseContext)
  if (context === undefined) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider')
  }
  return context
}