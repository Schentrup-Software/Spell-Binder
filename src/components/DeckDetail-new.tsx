import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from './PageHeader'
import ErrorBoundary from './ErrorBoundary'
import DeckValidationDisplay from './DeckValidationDisplay'
import DeckStatsDisplay from './DeckStatsDisplay'
import DeckCardList from './DeckCardList'
import AddCardModal from './AddCardModal'
import EditCardModal from './EditCardModal'
import { useDeckDetail } from '../hooks/useDeckDetail'
import { DeckCard, DeckCardType } from '../lib/types'

export default function DeckDetail() {
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()

    // Modal state
    const [showAddCardModal, setShowAddCardModal] = useState(false)
    const [showEditCardModal, setShowEditCardModal] = useState(false)
    const [selectedDeckCard, setSelectedDeckCard] = useState<DeckCard | null>(null)

    // Use the custom hook for deck management
    const {
        deck,
        deckCards,
        availableCards,
        allCards,
        searchQuery,
        setSearchQuery,
        searchInCollection,
        setSearchInCollection,
        isSearchingAllCards,
        stats,
        isLoading,
        handleAddCard,
        handleEditCard,
        handleRemoveCard,
        getValidationStatus
    } = useDeckDetail(deckId)

    // Handle adding card to deck with modal management
    const handleAddCardWithModal = async (card: any, quantity: number, type: DeckCardType) => {
        await handleAddCard(card, quantity, type)
        setShowAddCardModal(false)
    }

    // Handle editing card with modal management
    const handleEditCardWithModal = async (quantity: number, type: DeckCardType) => {
        if (!selectedDeckCard) return
        await handleEditCard(selectedDeckCard, quantity, type)
        setShowEditCardModal(false)
        setSelectedDeckCard(null)
    }

    // Open add card modal
    const openAddCardModal = () => {
        setShowAddCardModal(true)
    }

    // Open edit card modal
    const openEditCardModal = (deckCard: DeckCard) => {
        setSelectedDeckCard(deckCard)
        setShowEditCardModal(true)
    }

    // Close modals
    const closeAddCardModal = () => {
        setShowAddCardModal(false)
    }

    const closeEditCardModal = () => {
        setShowEditCardModal(false)
        setSelectedDeckCard(null)
    }

    if (!deck && !isLoading('deck')) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Deck not found</p>
                <Link to="/decks" className="text-blue-600 hover:text-blue-800">
                    Return to decks
                </Link>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <PageHeader
                    title={deck?.name || 'Loading...'}
                    description={deck?.description || 'Deck details'}
                    action={
                        <div className="flex space-x-3">
                            <Link
                                to="/decks"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                ← Back to Decks
                            </Link>
                            <button
                                onClick={openAddCardModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Cards
                            </button>
                        </div>
                    }
                />

                {/* Deck Validation Status */}
                {deck && deckCards.length > 0 && (
                    <DeckValidationDisplay validation={getValidationStatus()} />
                )}

                {/* Deck Stats */}
                <DeckStatsDisplay stats={stats} />

                {/* Deck Cards */}
                <DeckCardList
                    deckCards={deckCards}
                    onEdit={openEditCardModal}
                    onRemove={handleRemoveCard}
                    isLoading={isLoading('deck')}
                    onAddCard={openAddCardModal}
                />

                {/* Add Card Modal */}
                <AddCardModal
                    isOpen={showAddCardModal}
                    onClose={closeAddCardModal}
                    onAddCard={handleAddCardWithModal}
                    deck={deck}
                    deckCards={deckCards}
                    availableCards={availableCards}
                    allCards={allCards}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchInCollection={searchInCollection}
                    setSearchInCollection={setSearchInCollection}
                    isSearchingAllCards={isSearchingAllCards}
                    isLoadingCards={isLoading('cards')}
                />

                {/* Edit Card Modal */}
                <EditCardModal
                    isOpen={showEditCardModal}
                    onClose={closeEditCardModal}
                    onUpdateCard={handleEditCardWithModal}
                    selectedDeckCard={selectedDeckCard}
                    deck={deck}
                    deckCards={deckCards}
                />
            </div>
        </ErrorBoundary>
    )
}
