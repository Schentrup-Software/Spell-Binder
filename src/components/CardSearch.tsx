import { useState, useEffect } from 'react'
import PageHeader from './PageHeader'
import LoadingSpinner from './LoadingSpinner'
import SkeletonLoader from './SkeletonLoader'
import FilterBar from './FilterBar'
import MemoizedCardResult from './MemoizedCardResult'
import CardDetail from './CardDetail'
import Modal from './Modal'
import { Card, CardCondition, CardFilters } from '../lib/types'
import { searchCards, addCardToCollection } from '../lib/api'
import useDebounce from '../hooks/useDebounce'
import ErrorBoundary from './ErrorBoundary'

import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'

export default function CardSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Card[]>([])
  const [filters, setFilters] = useState<CardFilters>({})
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Hooks for error handling and loading states
  const { handleError, handleSuccess } = useErrorHandler({ context: 'Card Search' })
  const { isLoading, withLoading } = useLoadingState()
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // Perform search when debounced query or filters change
  useEffect(() => {
    async function performSearch() {
      // Don't search if query is empty
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([])
        return
      }
      
      try {
        const results = await withLoading('search', () => 
          searchCards(debouncedSearchQuery, filters)
        )
        setSearchResults(results)
        setError(null)
      } catch (err) {
        handleError(err, 'Search failed')
        setError('An error occurred while searching. Please try again.')
        setSearchResults([])
      }
    }
    
    performSearch()
  }, [debouncedSearchQuery, filters, withLoading, handleError])
  
  // Handle manual search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is already triggered by the useEffect hook
    // This is just to handle the form submission event
  }
  
  // Handle filter changes
  const handleFilterChange = (newFilters: CardFilters) => {
    setFilters(newFilters)
  }
  
  // Handle card selection
  const handleCardSelect = (card: Card) => {
    setSelectedCard(card)
    setShowModal(true)
  }
  
  // Handle adding card to collection
  const handleAddToCollection = async (quantity: number, condition: CardCondition, foil: boolean, notes: string) => {
    if (!selectedCard) return;
    
    try {
      await addCardToCollection(
        selectedCard.id,
        quantity,
        condition,
        foil,
        notes
      );
      
      // Show success message
      handleSuccess(`Added ${quantity} ${selectedCard.name} to collection!`);
      
      // Close the modal
      setShowModal(false);
    } catch (err: any) {
      handleError(err, 'Failed to add card to collection');
      throw err; // Re-throw so CardDetail can handle loading state
    }
  }
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader 
          title="Add Cards to Collection" 
          description="Search for Magic: The Gathering cards to add to your collection"
        />
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 md:p-6">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-grow">
                  <label htmlFor="search" className="sr-only">Search cards</label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by card name..."
                      className="block w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      autoComplete="off"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isLoading('search') || !searchQuery.trim()}
                    className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 border border-transparent text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800 transition-colors touch-manipulation"
                  >
                    {isLoading('search') ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="small" color="white" />
                        <span className="ml-2">Searching...</span>
                      </div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
            </form>
            
            <div className="mt-4 md:mt-6">
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">Popular searches:</span>
                <button 
                  onClick={() => setSearchQuery('Black Lotus')}
                  className="text-blue-600 hover:text-blue-800 active:text-blue-900 transition-colors touch-manipulation px-1 py-0.5 rounded hover:bg-blue-50"
                >
                  Black Lotus
                </button>
                <button 
                  onClick={() => setSearchQuery('Lightning Bolt')}
                  className="text-blue-600 hover:text-blue-800 active:text-blue-900 transition-colors touch-manipulation px-1 py-0.5 rounded hover:bg-blue-50"
                >
                  Lightning Bolt
                </button>
                <button 
                  onClick={() => setSearchQuery('Counterspell')}
                  className="text-blue-600 hover:text-blue-800 active:text-blue-900 transition-colors touch-manipulation px-1 py-0.5 rounded hover:bg-blue-50"
                >
                  Counterspell
                </button>
              </div>
            </div>
          </div>
          
          {/* Show filters if there are search results */}
          {searchResults.length > 0 && (
            <div className="border-t border-gray-200">
              <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            </div>
          )}
          
          {/* Search results */}
          <div className="border-t">
            {isLoading('search') ? (
              <div className="p-4">
                <div className="mb-4 text-sm text-gray-500">
                  Searching for cards...
                </div>
                <SkeletonLoader variant="list" count={3} />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">{error}</div>
                <p className="text-gray-500">
                  Please try again or refine your search query.
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-4">
                <div className="mb-4 text-sm text-gray-500">
                  Found {searchResults.length} {searchResults.length === 1 ? 'card' : 'cards'}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map(card => (
                    <MemoizedCardResult 
                      key={card.id} 
                      card={card} 
                      onClick={handleCardSelect} 
                    />
                  ))}
                </div>
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No cards found matching "{searchQuery}".
                </p>
                <p className="text-gray-500 mt-2">
                  Try a different search term or adjust your filters.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Enter a card name to start searching
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Card detail modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title={selectedCard?.name || 'Card Details'}
          size="lg"
        >
          {selectedCard && (
            <CardDetail 
              card={selectedCard}
              onAddToCollection={handleAddToCollection}
              onClose={() => setShowModal(false)}
            />
          )}
        </Modal>
      </div>
    </ErrorBoundary>
  )
}