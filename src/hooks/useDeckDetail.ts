import { useState, useEffect, useCallback } from 'react'
import {
    getUserDecks,
    getDeckCards,
    addCardToDeck,
    updateDeckCard,
    removeCardFromDeck,
    getUserCollection,
    searchCards
} from '../lib/api'
import { Deck, DeckCard, Card, DeckCardType } from '../lib/types'
import { calculateDeckStats, DeckStats } from '../lib/deckStats'
import { getDeckValidationStatus } from '../lib/deckConstraints'
import { useErrorHandler } from './useErrorHandler'
import { useLoadingState } from './useLoadingState'
import useDebounce from './useDebounce'

export function useDeckDetail(deckId: string | undefined) {
    const [deck, setDeck] = useState<Deck | null>(null)
    const [deckCards, setDeckCards] = useState<DeckCard[]>([])
    const [availableCards, setAvailableCards] = useState<Card[]>([])
    const [allCards, setAllCards] = useState<Card[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInCollection, setSearchInCollection] = useState(true)
    const [isSearchingAllCards, setIsSearchingAllCards] = useState(false)
    const [isLoadingCollectionCards, setIsLoadingCollectionCards] = useState(false)
    const [collectionPage, setCollectionPage] = useState(1)
    const [hasMoreCollectionCards, setHasMoreCollectionCards] = useState(true)
    const [stats, setStats] = useState<DeckStats>({
        totalCards: 0,
        averageCmc: 0,
        totalValue: 0,
        colorDistribution: {}
    })

    // Debounced search query for collection and all cards search
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const { handleError, handleSuccess } = useErrorHandler({ context: 'Deck' })
    const { isLoading, withLoading } = useLoadingState()

    const loadDeckData = useCallback(() => {
        if (!deckId) return

        withLoading('deck', async () => {
            try {
                // Load deck info
                const decks = await getUserDecks()
                const currentDeck = decks.find(d => d.id === deckId)

                if (!currentDeck) {
                    handleError(new Error('Deck not found'), 'Deck not found')
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
    }, [deckId])

    const loadAvailableCards = useCallback((query: string = '', page: number = 1, append: boolean = false) => {
        setIsLoadingCollectionCards(true)
        
        withLoading('cards', async () => {
            try {
                const filters = query.trim() ? { searchQuery: query } : {}
                const pageSize = 30
                const result = await getUserCollection(filters, pageSize, page)
                
                if (append) {
                    setAvailableCards(prev => [...prev, ...result])
                } else {
                    setAvailableCards(result)
                }
                
                // Check if there are more cards available
                setHasMoreCollectionCards(result.length === pageSize)
                
            } catch (error) {
                handleError(error, 'Failed to load collection')
            } finally {
                setIsLoadingCollectionCards(false)
            }
        })
    }, [])

    // Load more collection cards (for pagination)
    const loadMoreCollectionCards = useCallback(() => {
        if (hasMoreCollectionCards && !isLoadingCollectionCards) {
            const nextPage = collectionPage + 1
            setCollectionPage(nextPage)
            loadAvailableCards(debouncedSearchQuery, nextPage, true)
        }
    }, [hasMoreCollectionCards, isLoadingCollectionCards, collectionPage, debouncedSearchQuery])

    // Load deck and cards on component mount
    useEffect(() => {
        if (deckId) {
            loadDeckData()
        }
    }, [deckId])

    // Load initial collection when component mounts
    useEffect(() => {
        if (deckId) {
            loadAvailableCards() // Load initial collection without search
        }
    }, [deckId])

    // Search collection when query changes and searching in collection
    useEffect(() => {
        if (searchInCollection && debouncedSearchQuery !== undefined) {
            setCollectionPage(1)
            loadAvailableCards(debouncedSearchQuery, 1, false)
        }
    }, [searchInCollection, debouncedSearchQuery])

    // Reset collection state when switching search modes
    useEffect(() => {
        if (searchInCollection) {
            setCollectionPage(1)
            setAvailableCards([])
            setHasMoreCollectionCards(true)
            loadAvailableCards('', 1, false)
        }
    }, [searchInCollection])

    // Calculate deck statistics
    useEffect(() => {
        const newStats = calculateDeckStats(deckCards)
        setStats(newStats)
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
    }, [])

    // Effect for searching all cards when toggle is off and query changes
    useEffect(() => {
        if (!searchInCollection && debouncedSearchQuery.trim()) {
            searchAllCards(debouncedSearchQuery)
        } else if (!searchInCollection) {
            setAllCards([])
        }
    }, [searchInCollection, debouncedSearchQuery])

    // Handle adding card to deck
    const handleAddCard = useCallback(async (card: Card, quantity: number, type: DeckCardType) => {
        if (!deckId) return

        try {
            const newDeckCard = await addCardToDeck(
                deckId,
                card.id,
                quantity,
                type,
                card.collection?.id
            )

            // Add expanded card data
            const expandedDeckCard: DeckCard = {
                ...newDeckCard,
                expand: {
                    card: card,
                    collection: card.collection
                }
            }

            setDeckCards(prev => [...prev, expandedDeckCard])
            handleSuccess(`Added ${quantity}x ${card.name} to deck`)
        } catch (error) {
            handleError(error, 'Failed to add card to deck')
        }
    }, [deckId])

    // Handle editing deck card
    const handleEditCard = useCallback(async (deckCard: DeckCard, quantity: number, type: DeckCardType) => {
        try {
            await updateDeckCard(deckCard.id, quantity, type)

            setDeckCards(prev => prev.map(dc =>
                dc.id === deckCard.id
                    ? { ...dc, quantity: quantity, type: type }
                    : dc
            ))

            handleSuccess(`Updated ${deckCard.expand?.card?.name || 'card'} in deck`)
        } catch (error) {
            handleError(error, 'Failed to update card')
        }
    }, [])

    // Handle removing card from deck
    const handleRemoveCard = useCallback(async (deckCard: DeckCard) => {
        try {
            await removeCardFromDeck(deckCard.id)
            setDeckCards(prev => prev.filter(dc => dc.id !== deckCard.id))
            handleSuccess(`Removed ${deckCard.expand?.card?.name || 'card'} from deck`)
        } catch (error) {
            handleError(error, 'Failed to remove card from deck')
        }
    }, [])

    // Get deck validation status
    const getValidationStatus = useCallback(() => {
        return getDeckValidationStatus(deck, deckCards)
    }, [deck, deckCards])

    return {
        // State
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

        // Loading states
        isLoading,

        // Actions
        handleAddCard,
        handleEditCard,
        handleRemoveCard,
        getValidationStatus,
        loadDeckData,
        loadMoreCollectionCards
    }
}
