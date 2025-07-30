import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [hasSearched, setHasSearched] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Ref for infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Hooks for error handling and loading states
  const { handleError, handleSuccess } = useErrorHandler({ context: 'Card Search' })
  const { isLoading, withLoading } = useLoadingState()

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Load more cards function
  const loadMoreCards = useCallback(async (currentPage: number, isNewSearch: boolean = false) => {
    if (!debouncedSearchQuery.trim()) return

    try {
      if (isNewSearch) {
        const results = await withLoading('search', () =>
          searchCards(debouncedSearchQuery, filters, 20, 1)
        )
        setSearchResults(results)
        setHasMore(results.length === 20)
        setPage(2)
        setHasSearched(true)
      } else {
        setIsLoadingMore(true)
        const results = await searchCards(debouncedSearchQuery, filters, 20, currentPage)

        if (results.length === 0) {
          setHasMore(false)
        } else {
          // Filter out any duplicates that might exist
          setSearchResults(prev => {
            const existingIds = new Set(prev.map(card => card.id))
            const newCards = results.filter(card => !existingIds.has(card.id))
            return [...prev, ...newCards]
          })
          setHasMore(results.length === 20)
          setPage(currentPage + 1)
        }
        setIsLoadingMore(false)
      }
      setError(null)
    } catch (err) {
      if (isNewSearch) {
        handleError(err, 'Search failed')
        setError('An error occurred while searching. Please try again.')
        setSearchResults([])
      } else {
        setIsLoadingMore(false)
        handleError(err, 'Failed to load more results')
      }
    }
  }, [debouncedSearchQuery, filters, withLoading, handleError])

  // Perform search when debounced query or filters change
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      setHasMore(true)
      setPage(1)
      return
    }

    // Reset pagination for new search
    setPage(1)
    setHasMore(true)
    loadMoreCards(1, true)
  }, [debouncedSearchQuery, filters, loadMoreCards])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore && !isLoading('search') && hasSearched) {
          loadMoreCards(page)
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, isLoading, hasSearched, page, loadMoreCards])

  // Keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search input on "/" key (like GitHub)
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target as HTMLElement
        // Don't trigger if user is typing in an input or textarea
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle manual search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is already triggered by the useEffect hook
    // This is just to handle the form submission event
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: CardFilters) => {
    setFilters(newFilters)
    // Reset pagination when filters change
    setPage(1)
    setHasMore(true)
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
                      ref={searchInputRef}
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by card name... (Press '/' to focus)"
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
              {hasSearched && searchResults.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  💡 Scroll down or click "Load More" to see additional results
                </div>
              )}
            </div>
          </div>

          {/* Show filters if there are search results */}
          {hasSearched && (
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
                  {hasMore && ' (showing partial results)'}
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

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="mt-6 flex flex-col items-center space-y-4">
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="small" />
                        <span className="ml-2 text-sm text-gray-500">Loading more cards...</span>
                      </div>
                    ) : (
                      <>
                        <div className="h-4" />
                        <button
                          onClick={() => loadMoreCards(page)}
                          disabled={isLoadingMore}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Load More Cards
                        </button>
                      </>
                    )}
                  </div>
                )}

                {!hasMore && searchResults.length > 20 && (
                  <div className="mt-6 text-center text-sm text-gray-500">
                    End of results
                  </div>
                )}
              </div>
            ) : hasSearched && searchResults.length === 0 && searchQuery.trim() ? (
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