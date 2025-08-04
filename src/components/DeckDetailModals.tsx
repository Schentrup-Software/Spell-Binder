import AddCardModal from './AddCardModal'
import EditCardModal from './EditCardModal'
import { Deck, DeckCard, DeckCardType, Card } from '../lib/types'

interface DeckDetailModalsProps {
    // Add Card Modal Props
    showAddCardModal: boolean
    onCloseAddCardModal: () => void
    onAddCard: (card: any, quantity: number, type: DeckCardType) => Promise<void>

    // Edit Card Modal Props
    showEditCardModal: boolean
    onCloseEditCardModal: () => void
    onUpdateCard: (quantity: number, type: DeckCardType) => Promise<void>
    selectedDeckCard: DeckCard | null

    // Shared Props
    deck: Deck | null
    deckCards: DeckCard[]

    // Search Props for Add Modal
    availableCards: Card[]
    allCards: Card[]
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchInCollection: boolean
    setSearchInCollection: (searchInCollection: boolean) => void
    isSearchingAllCards: boolean
    isLoadingCards: boolean
    isLoadingCollectionCards: boolean
    hasMoreCollectionCards: boolean
    loadMoreCollectionCards: () => void
}export default function DeckDetailModals({
    showAddCardModal,
    onCloseAddCardModal,
    onAddCard,
    showEditCardModal,
    onCloseEditCardModal,
    onUpdateCard,
    selectedDeckCard,
    deck,
    deckCards,
    availableCards,
    allCards,
    searchQuery,
    setSearchQuery,
    searchInCollection,
    setSearchInCollection,
    isSearchingAllCards,
    isLoadingCards,
    isLoadingCollectionCards,
    hasMoreCollectionCards,
    loadMoreCollectionCards
}: DeckDetailModalsProps) {
    return (
        <>
            {/* Add Card Modal */}
            <AddCardModal
                isOpen={showAddCardModal}
                onClose={onCloseAddCardModal}
                onAddCard={onAddCard}
                deck={deck}
                deckCards={deckCards}
                availableCards={availableCards}
                allCards={allCards}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInCollection={searchInCollection}
                setSearchInCollection={setSearchInCollection}
                isSearchingAllCards={isSearchingAllCards}
                isLoadingCards={isLoadingCards}
                isLoadingCollectionCards={isLoadingCollectionCards}
                hasMoreCollectionCards={hasMoreCollectionCards}
                loadMoreCollectionCards={loadMoreCollectionCards}
            />

            {/* Edit Card Modal */}
            <EditCardModal
                isOpen={showEditCardModal}
                onClose={onCloseEditCardModal}
                onUpdateCard={onUpdateCard}
                selectedDeckCard={selectedDeckCard}
                deck={deck}
                deckCards={deckCards}
            />
        </>
    )
}
