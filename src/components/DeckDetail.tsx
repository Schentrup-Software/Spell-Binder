import { useParams, Link } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import DeckDetailHeader from './DeckDetailHeader'
import DeckDetailContent from './DeckDetailContent'
import DeckDetailModals from './DeckDetailModals'
import { useDeckDetail } from '../hooks/useDeckDetail'
import { useDeckDetailModals } from '../hooks/useDeckDetailModals'
import { DeckCardType } from '../lib/types'

export default function DeckDetail() {
    const { deckId } = useParams<{ deckId: string }>()

    // Deck data and operations
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
        isLoadingCollectionCards,
        hasMoreCollectionCards,
        stats,
        isLoading,
        handleAddCard,
        handleEditCard,
        handleRemoveCard,
        getValidationStatus,
        loadMoreCollectionCards
    } = useDeckDetail(deckId)

    // Modal state and operations
    const {
        showAddCardModal,
        showEditCardModal,
        selectedDeckCard,
        openAddCardModal,
        closeAddCardModal,
        openEditCardModal,
        closeEditCardModal
    } = useDeckDetailModals()

    // Handle adding card to deck with modal management
    const handleAddCardWithModal = async (card: any, quantity: number, type: DeckCardType) => {
        await handleAddCard(card, quantity, type)
        closeAddCardModal()
    }

    // Handle editing card with modal management
    const handleEditCardWithModal = async (quantity: number, type: DeckCardType) => {
        if (!selectedDeckCard) return
        await handleEditCard(selectedDeckCard, quantity, type)
        closeEditCardModal()
    }

    // Handle deck not found
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
                <DeckDetailHeader
                    deck={deck}
                    onAddCard={openAddCardModal}
                />

                <DeckDetailContent
                    deck={deck}
                    deckCards={deckCards}
                    stats={stats}
                    validation={getValidationStatus()}
                    isLoading={isLoading('deck')}
                    onEditCard={openEditCardModal}
                    onRemoveCard={handleRemoveCard}
                    onAddCard={openAddCardModal}
                />

                <DeckDetailModals
                    showAddCardModal={showAddCardModal}
                    onCloseAddCardModal={closeAddCardModal}
                    onAddCard={handleAddCardWithModal}
                    showEditCardModal={showEditCardModal}
                    onCloseEditCardModal={closeEditCardModal}
                    onUpdateCard={handleEditCardWithModal}
                    selectedDeckCard={selectedDeckCard}
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
                    isLoadingCollectionCards={isLoadingCollectionCards}
                    hasMoreCollectionCards={hasMoreCollectionCards}
                    loadMoreCollectionCards={loadMoreCollectionCards}
                />
            </div>
        </ErrorBoundary>
    )
}
