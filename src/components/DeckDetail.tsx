import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageHeader from './PageHeader'
import ErrorBoundary from './ErrorBoundary'
import LoadingSpinner from './LoadingSpinner'
import Modal from './Modal'
import CardImage from './CardImage'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'
import useDebounce from '../hooks/useDebounce'
import {
    getUserDecks,
    getDeckCards,
    addCardToDeck,
    updateDeckCard,
    removeCardFromDeck,
    getUserCollection,
    searchCards
} from '../lib/api'
import { Deck, DeckCard, DeckCardType, Card } from '../lib/types'

interface DeckStats {
    totalCards: number
    averageCmc: number
    totalValue: number
    colorDistribution: Record<string, number>
}

export default function DeckDetail() {
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()

    const [deck, setDeck] = useState<Deck | null>(null)
    const [deckCards, setDeckCards] = useState<DeckCard[]>([])
    const [availableCards, setAvailableCards] = useState<Card[]>([])
    const [allCards, setAllCards] = useState<Card[]>([])
    const [showAddCardModal, setShowAddCardModal] = useState(false)
    const [showEditCardModal, setShowEditCardModal] = useState(false)
    const [selectedDeckCard, setSelectedDeckCard] = useState<DeckCard | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInCollection, setSearchInCollection] = useState(true)
    const [isSearchingAllCards, setIsSearchingAllCards] = useState(false)
    const [stats, setStats] = useState<DeckStats>({
        totalCards: 0,
        averageCmc: 0,
        totalValue: 0,
        colorDistribution: {}
    })

    // Form state for adding/editing cards
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [cardQuantity, setCardQuantity] = useState(1)
    const [cardType, setCardType] = useState<DeckCardType>('library')

    // Debounced search query for all cards search
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const { handleError, handleSuccess } = useErrorHandler({ context: 'Deck' })
    const { isLoading, withLoading } = useLoadingState()

    // Load deck and cards on component mount
    useEffect(() => {
        if (deckId) {
            loadDeckData()
            loadAvailableCards()
        }
    }, [deckId])

    const loadDeckData = () => {
        if (!deckId) return

        withLoading('deck', async () => {
            try {
                // Load deck info
                const decks = await getUserDecks()
                const currentDeck = decks.find(d => d.id === deckId)

                if (!currentDeck) {
                    handleError(new Error('Deck not found'), 'Deck not found')
                    navigate('/decks')
                    return
                }

                setDeck(currentDeck)

                // Load deck cards
                const cards = await getDeckCards(deckId)
                setDeckCards(cards)
            } catch (error) {
                handleError(error, 'Failed to load deck')
            }
        })
    }

    const loadAvailableCards = () => {
        withLoading('cards', async () => {
            try {
                const collection = await getUserCollection()
                setAvailableCards(collection)
            } catch (error) {
                handleError(error, 'Failed to load collection')
            }
        })
    }

    // Calculate deck statistics with use effect
    useEffect(() => {
        const stats: DeckStats = {
            totalCards: 0,
            averageCmc: 0,
            totalValue: 0,
            colorDistribution: {}
        }

        let totalCmc = 0
        let cardsWithCmc = 0
        console.log('Calculating stats for deck cards:', deckCards)
        deckCards.forEach(deckCard => {
            const card = deckCard.expand?.card
            console.log('Processing deck card:', deckCard)
            if (!card) return

            stats.totalCards += 1

            // Calculate CMC
            if (card.mana_cost) {
                // Simple CMC calculation - count mana symbols
                const cmc = (card.mana_cost.match(/\{[^}]+\}/g) || []).length
                totalCmc += cmc
                cardsWithCmc += 1
            }

            // Calculate total value
            if (card.price_usd) {
                stats.totalValue += card.price_usd
            }

            // Color distribution
            console.log('Card colors:', card.colors)
            if (card.colors && card.colors.length > 0) {
                card.colors.forEach(color => {
                    stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1
                })
            } else {
                stats.colorDistribution['C'] = (stats.colorDistribution['C'] || 0) + 1
            }
        })

        stats.averageCmc = cardsWithCmc > 0 ? totalCmc / cardsWithCmc : 0
        console.log('Deck stats:', stats)


        setStats(stats)
    }, [deckCards])

    // Search all cards function
    const searchAllCards = useCallback(async (query: string) => {
        if (!query.trim()) {
            setAllCards([])
            return
        }

        setIsSearchingAllCards(true)
        try {
            const results = await searchCards(query, {}, 20, 1)
            setAllCards(results)
        } catch (error) {
            handleError(error, 'Failed to search all cards')
            setAllCards([])
        } finally {
            setIsSearchingAllCards(false)
        }
    }, [handleError])

    // Effect for searching all cards when toggle is off and query changes
    useEffect(() => {
        if (!searchInCollection && debouncedSearchQuery.trim()) {
            searchAllCards(debouncedSearchQuery)
        } else if (!searchInCollection) {
            setAllCards([])
        }
    }, [searchInCollection, debouncedSearchQuery, searchAllCards])

    // Filter available cards based on search and source
    const filteredCards = searchInCollection
        ? availableCards.filter(card =>
            card.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allCards

    // Handle adding card to deck
    const handleAddCard = async () => {
        if (!selectedCard || !deckId) return

        try {
            const newDeckCard = await addCardToDeck(
                deckId,
                selectedCard.id,
                cardQuantity,
                cardType,
                selectedCard.collection?.id
            )

            // Add expanded card data
            const expandedDeckCard: DeckCard = {
                ...newDeckCard,
                expand: {
                    card: selectedCard,
                    collection: selectedCard.collection
                }
            }

            setDeckCards(prev => [...prev, expandedDeckCard])
            handleSuccess(`Added ${cardQuantity}x ${selectedCard.name} to deck`)
            setShowAddCardModal(false)
            resetForm()
        } catch (error) {
            handleError(error, 'Failed to add card to deck')
        }
    }

    // Handle editing deck card
    const handleEditCard = async () => {
        if (!selectedDeckCard) return

        try {
            await updateDeckCard(selectedDeckCard.id, cardQuantity, cardType)

            setDeckCards(prev => prev.map(dc =>
                dc.id === selectedDeckCard.id
                    ? { ...dc, quantity: cardQuantity, type: cardType }
                    : dc
            ))

            handleSuccess(`Updated ${selectedDeckCard.expand?.card?.name || 'card'} in deck`)
            setShowEditCardModal(false)
            resetForm()
        } catch (error) {
            handleError(error, 'Failed to update card')
        }
    }

    // Handle removing card from deck
    const handleRemoveCard = async (deckCard: DeckCard) => {
        try {
            await removeCardFromDeck(deckCard.id)
            setDeckCards(prev => prev.filter(dc => dc.id !== deckCard.id))
            handleSuccess(`Removed ${deckCard.expand?.card?.name || 'card'} from deck`)
        } catch (error) {
            handleError(error, 'Failed to remove card from deck')
        }
    }

    // Reset form state
    const resetForm = () => {
        setSelectedCard(null)
        setCardQuantity(1)
        setCardType('library')
        setSelectedDeckCard(null)
        setSearchQuery('')
        setSearchInCollection(true)
        setAllCards([])
    }

    // Open add card modal
    const openAddCardModal = () => {
        resetForm()
        setShowAddCardModal(true)
    }

    // Open edit card modal
    const openEditCardModal = (deckCard: DeckCard) => {
        setSelectedDeckCard(deckCard)
        setCardQuantity(deckCard.quantity)
        setCardType(deckCard.type)
        setShowEditCardModal(true)
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

                {/* Deck Stats */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Deck Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
                                <div className="text-sm text-gray-500">Total Cards</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.averageCmc.toFixed(1)}</div>
                                <div className="text-sm text-gray-500">Avg. CMC</div>
                            </div>
                            <div className="text-center">
                                <div className="flex flex-wrap justify-center gap-3 mb-2">
                                    {Object.entries(stats.colorDistribution).map(([color, count]) => {
                                        const colorClasses = {
                                            'W': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                            'U': 'bg-blue-100 text-blue-800 border-blue-200',
                                            'B': 'bg-gray-800 text-white border-gray-600',
                                            'R': 'bg-red-100 text-red-800 border-red-200',
                                            'G': 'bg-green-100 text-green-800 border-green-200',
                                            'C': 'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                        const manaSymbols = {
                                            'W': (<i className="ms ms-w" />),
                                            'U': (<i className="ms ms-u" />),
                                            'B': (<i className="ms ms-b" />),
                                            'R': (<i className="ms ms-r" />),
                                            'G': (<i className="ms ms-g" />),
                                            'C': (<i className="ms ms-c" />)
                                        }
                                        return (
                                            <div key={color} className="flex items-center gap-1">
                                                <div
                                                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-lg ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                                    title={`${color}: ${count} cards`}
                                                >
                                                    {manaSymbols[color as keyof typeof manaSymbols] || color}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="text-sm text-gray-500">Color Distribution</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">${stats.totalValue.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">Total Value</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deck Cards */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <div className="text-sm text-gray-500">
                            {deckCards.length > 0
                                ? `${deckCards.length} unique cards`
                                : 'No cards in deck yet'}
                        </div>
                    </div>

                    {isLoading('deck') ? (
                        <div className="p-4">
                            <LoadingSpinner size="medium" />
                        </div>
                    ) : deckCards.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {/* Group cards by type */}
                            {['commander', 'co-commander', 'library'].map(type => {
                                const cardsOfType = deckCards.filter(dc => dc.type === type)
                                if (cardsOfType.length === 0) return null

                                return (
                                    <div key={type} className="p-4">
                                        <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                            {type === 'co-commander' ? 'Co-Commander' : type}
                                            {cardsOfType.length > 0 && (
                                                <span className="ml-2 text-sm text-gray-500">
                                                    ({cardsOfType.reduce((sum, dc) => sum + dc.quantity, 0)} cards)
                                                </span>
                                            )}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {cardsOfType.map(deckCard => {
                                                const card = deckCard.expand?.card
                                                if (!card) return null

                                                return (
                                                    <div key={deckCard.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                                        <div className="flex-shrink-0">
                                                            <CardImage
                                                                card={card}
                                                                cardName={card.name}
                                                                size="small"
                                                                quality="low"
                                                                className="h-12 w-8 rounded object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {card.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {card.set_name} • {card.mana_cost || 'No cost'}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-900">
                                                            {deckCard.quantity}x
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                onClick={() => openEditCardModal(deckCard)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                title="Edit"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveCard(deckCard)}
                                                                className="text-gray-400 hover:text-red-600"
                                                                title="Remove"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg mb-4">
                                No cards in this deck yet
                            </p>
                            <button
                                onClick={openAddCardModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Add Your First Card
                            </button>
                        </div>
                    )}
                </div>

                {/* Add Card Modal */}
                <Modal
                    isOpen={showAddCardModal}
                    onClose={() => {
                        setShowAddCardModal(false)
                        resetForm()
                    }}
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
                                {(isLoading('cards') || isSearchingAllCards) ? (
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
                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={cardQuantity}
                                        onChange={(e) => setCardQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Card Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Card Type
                                    </label>
                                    <select
                                        value={cardType}
                                        onChange={(e) => setCardType(e.target.value as DeckCardType)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="library">Library</option>
                                        <option value="commander">Commander</option>
                                        <option value="co-commander">Co-Commander</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setShowAddCardModal(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddCard}
                            disabled={!selectedCard}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add to Deck
                        </button>
                    </div>
                </Modal>

                {/* Edit Card Modal */}
                <Modal
                    isOpen={showEditCardModal}
                    onClose={() => {
                        setShowEditCardModal(false)
                        resetForm()
                    }}
                    title={`Edit ${selectedDeckCard?.expand?.card?.name || 'Card'}`}
                    size="md"
                >
                    <div className="space-y-4">
                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="4"
                                value={cardQuantity}
                                onChange={(e) => setCardQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Card Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Card Type
                            </label>
                            <select
                                value={cardType}
                                onChange={(e) => setCardType(e.target.value as DeckCardType)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="library">Library</option>
                                <option value="commander">Commander</option>
                                <option value="co-commander">Co-Commander</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setShowEditCardModal(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditCard}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </Modal>
            </div>
        </ErrorBoundary>
    )
}
