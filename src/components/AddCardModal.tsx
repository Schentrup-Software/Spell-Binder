import { useState, useEffect } from 'react'
import Modal from './Modal'
import CardImage from './CardImage'
import LoadingSpinner from './LoadingSpinner'
import { Card, DeckCard, DeckCardType, Deck } from '../lib/types'
import { getDeckConstraints, getMaxQuantityForCard, isCommanderSlotAvailable } from '../lib/deckConstraints'

interface AddCardModalProps {
    isOpen: boolean
    onClose: () => void
    onAddCard: (card: Card, quantity: number, type: DeckCardType) => void
    deck: Deck | null
    deckCards: DeckCard[]
    availableCards: Card[]
    allCards: Card[]
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchInCollection: boolean
    setSearchInCollection: (value: boolean) => void
    isSearchingAllCards: boolean
    isLoadingCards: boolean
}

export default function AddCardModal({
    isOpen,
    onClose,
    onAddCard,
    deck,
    deckCards,
    availableCards,
    allCards,
    searchQuery,
    setSearchQuery,
    searchInCollection,
    setSearchInCollection,
    isSearchingAllCards,
    isLoadingCards
}: AddCardModalProps) {
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [cardQuantity, setCardQuantity] = useState(1)
    const [cardType, setCardType] = useState<DeckCardType>('library')

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedCard(null)
            setCardQuantity(1)
            setCardType('library')
            setSearchQuery('')
            setSearchInCollection(true)
        }
    }, [isOpen, setSearchQuery, setSearchInCollection])

    // Effect to automatically set cardType to library when no special options are selected
    useEffect(() => {
        const constraints = getDeckConstraints(deck?.format)

        // If current cardType is not available, reset to library
        if (cardType === 'commander' && (!constraints.allowsCommander || !isCommanderSlotAvailable('commander', deckCards))) {
            setCardType('library')
        }
        if (cardType === 'co-commander' && (!constraints.allowsCoCommander || !isCommanderSlotAvailable('co-commander', deckCards))) {
            setCardType('library')
        }

        // For singleton formats, always set quantity to 1
        if (constraints.maxQuantityPerCard === 1) {
            setCardQuantity(1)
        }
    }, [deck?.format, deckCards, cardType])

    const handleAddCard = () => {
        if (!selectedCard) return

        // Check if the selected card type is still available
        if (cardType === 'commander' && !isCommanderSlotAvailable('commander', deckCards)) {
            return
        }
        if (cardType === 'co-commander' && !isCommanderSlotAvailable('co-commander', deckCards)) {
            return
        }

        onAddCard(selectedCard, cardQuantity, cardType)
    }

    // Filter available cards based on search and source
    const filteredCards = searchInCollection
        ? availableCards.filter(card =>
            card.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allCards

    const constraints = getDeckConstraints(deck?.format)
    const isSingleton = constraints.maxQuantityPerCard === 1

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Card to Deck"
            size="lg"
        >
            <div className="space-y-4">
                {/* Search Source Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Search in:</span>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="searchSource"
                                checked={searchInCollection}
                                onChange={() => setSearchInCollection(true)}
                                className="mr-2 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">My Collection</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="searchSource"
                                checked={!searchInCollection}
                                onChange={() => setSearchInCollection(false)}
                                className="mr-2 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">All Cards</span>
                        </label>
                    </div>
                </div>

                {/* Search Cards */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {searchInCollection ? 'Search Your Collection' : 'Search All Cards'}
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchInCollection ? "Search your collection..." : "Search all Magic cards..."}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Card Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Card
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                        {(isLoadingCards || isSearchingAllCards) ? (
                            <div className="p-4 text-center">
                                <LoadingSpinner size="small" />
                                <p className="mt-2 text-sm text-gray-500">
                                    {searchInCollection ? 'Loading collection...' : 'Searching all cards...'}
                                </p>
                            </div>
                        ) : filteredCards.length > 0 ? (
                            <div className="divide-y">
                                {filteredCards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => setSelectedCard(card)}
                                        className={`w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${selectedCard?.id === card.id ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                    >
                                        <CardImage
                                            card={card}
                                            cardName={card.name}
                                            size="small"
                                            quality="low"
                                            className="h-12 w-8 rounded object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{card.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {card.set_name}
                                                {searchInCollection && card.collection && (
                                                    <span className="ml-2 text-green-600">
                                                        ({card.collection.quantity} owned)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                {searchQuery ? (
                                    searchInCollection ? 'No cards found in your collection' : 'No cards found'
                                ) : (
                                    searchInCollection ? 'Type to search your collection' : 'Type to search all cards'
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedCard && (
                    <>
                        {/* Quantity - only show if changeable */}
                        {!isSingleton && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedCard ? getMaxQuantityForCard(selectedCard.name, deckCards, deck?.format) : 4}
                                    value={cardQuantity}
                                    onChange={(e) => {
                                        const maxAllowed = selectedCard ? getMaxQuantityForCard(selectedCard.name, deckCards, deck?.format) : 4
                                        setCardQuantity(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value) || 1)))
                                    }}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                {selectedCard && getMaxQuantityForCard(selectedCard.name, deckCards, deck?.format) === 0 && (
                                    <p className="mt-1 text-sm text-red-600">This card is already at the maximum allowed quantity for this deck format.</p>
                                )}
                            </div>
                        )}

                        {/* Card Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Card Type
                            </label>
                            <div className="space-y-3">
                                {/* Commander - only show for commander formats */}
                                {constraints.allowsCommander && (
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={cardType === 'commander'}
                                            onChange={(e) => setCardType(e.target.checked ? 'commander' : 'library')}
                                            disabled={!isCommanderSlotAvailable('commander', deckCards)}
                                            className="mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className={`text-sm ${!isCommanderSlotAvailable('commander', deckCards) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Commander
                                            {!isCommanderSlotAvailable('commander', deckCards) && (
                                                <span className="ml-1 text-xs text-amber-600">(slot filled)</span>
                                            )}
                                        </span>
                                    </label>
                                )}

                                {/* Co-Commander - only show for commander format */}
                                {constraints.allowsCoCommander && (
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={cardType === 'co-commander'}
                                            onChange={(e) => setCardType(e.target.checked ? 'co-commander' : 'library')}
                                            disabled={!isCommanderSlotAvailable('co-commander', deckCards)}
                                            className="mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className={`text-sm ${!isCommanderSlotAvailable('co-commander', deckCards) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Co-Commander
                                            {!isCommanderSlotAvailable('co-commander', deckCards) && (
                                                <span className="ml-1 text-xs text-amber-600">(slot filled)</span>
                                            )}
                                        </span>
                                    </label>
                                )}

                                {/* Show message when no special types are available/shown */}
                                {(!constraints.allowsCommander && !constraints.allowsCoCommander) && (
                                    <p className="text-sm text-gray-500 italic">
                                        Cards will be added to the main deck.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAddCard}
                    disabled={
                        !selectedCard ||
                        getMaxQuantityForCard(selectedCard?.name || '', deckCards, deck?.format) === 0 ||
                        (cardType === 'commander' && !isCommanderSlotAvailable('commander', deckCards)) ||
                        (cardType === 'co-commander' && !isCommanderSlotAvailable('co-commander', deckCards))
                    }
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add to Deck
                </button>
            </div>
        </Modal>
    )
}
