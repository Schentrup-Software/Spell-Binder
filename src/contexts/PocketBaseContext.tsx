import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '../lib/pocketbase'

interface User {
  id: string
  email: string
  name: string
  created: string
  updated: string
}

interface PocketBaseContextType {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
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
  const [user, setUser] = useState<User | null>(null)

  const checkConnection = async () => {
    try {
      setError(null)

      // Test connection by fetching health status
      await pb.health.check()
      setIsConnected(true)
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Failed to connect to PocketBase')
      console.error('PocketBase connection error:', err)
    }
  }

  const initialCheckConnection = async () => {
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

  const checkAuth = () => {
    if (pb.authStore.isValid && pb.authStore.model) {
      setUser({
        id: pb.authStore.model.id,
        email: pb.authStore.model.email,
        name: pb.authStore.model.name,
        created: pb.authStore.model.created,
        updated: pb.authStore.model.updated
      })
    } else {
      setUser(null)
    }
  }

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password)
    setUser({
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
      created: authData.record.created,
      updated: authData.record.updated
    })
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const reconnect = async () => {
    await initialCheckConnection()
  }

  useEffect(() => {
    // Check initial auth state
    checkAuth()

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange(() => {
      checkAuth()
    })

    // Initial connection check (with loading state)
    initialCheckConnection()

    // Set up periodic health checks (without loading state)
    const interval = setInterval(checkConnection, 60000) // Check every 60 seconds

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const value: PocketBaseContextType = {
    isConnected,
    isLoading,
    error,
    user,
    isAuthenticated: !!user,
    login,
    logout,
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