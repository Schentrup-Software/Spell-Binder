import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import CollectionView from './components/CollectionView'
import CardSearch from './components/CardSearch'
import CardScanner from './components/CardScanner'
import DeckView from './components/DeckView'
import DeckDetail from './components/DeckDetail'
import NotFound from './components/NotFound'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import AuthForm from './components/AuthForm'
import { PocketBaseProvider, usePocketBase } from './contexts/PocketBaseContext'
import { ToastProvider } from './components/ToastProvider'
import LoadingSpinner from './components/LoadingSpinner'
import pb from './lib/pocketbase'

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, isConnected, error } = usePocketBase()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Connecting to Spell Binder...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to connect to the server'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/collection" element={<CollectionView />} />
          <Route path="/decks" element={<DeckView />} />
          <Route path="/decks/:deckId" element={<DeckDetail />} />
          <Route path="/search" element={<CardSearch />} />
          <Route path="/scanner" element={<CardScanner />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function App() {
  if (!pb.authStore.isValid) {
    pb.authStore.clear()
  }

  return (
    <ErrorBoundary>
      <PocketBaseProvider>
        <ToastProvider>
          <AuthenticatedApp />
        </ToastProvider>
      </PocketBaseProvider>
    </ErrorBoundary>
  )
}

export default App