import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import CollectionView from './components/CollectionView'
import CardSearch from './components/CardSearch'
import NotFound from './components/NotFound'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { PocketBaseProvider } from './contexts/PocketBaseContext'
import { ToastProvider } from './components/ToastProvider'

function App() {
  return (
    <ErrorBoundary>
      <PocketBaseProvider>
        <ToastProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/collection" element={<CollectionView />} />
                <Route path="/search" element={<CardSearch />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </ToastProvider>
      </PocketBaseProvider>
    </ErrorBoundary>
  )
}

export default App