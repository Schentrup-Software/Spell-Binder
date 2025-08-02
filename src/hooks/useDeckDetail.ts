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
    const [stats, setStats] = useState<DeckStats>({
        totalCards: 0,
        averageCmc: 0,
        totalValue: 0,
        colorDistribution: {}
    })

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
    }, [deckId, withLoading, handleError])

    const loadAvailableCards = useCallback(() => {
        withLoading('cards', async () => {
            try {
                const collection = await getUserCollection()
                setAvailableCards(collection)
            } catch (error) {
                handleError(error, 'Failed to load collection')
            }
        })
    }, [withLoading, handleError])

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
    }, [handleError])

    // Effect for searching all cards when toggle is off and query changes
    useEffect(() => {
        if (!searchInCollection && debouncedSearchQuery.trim()) {
            searchAllCards(debouncedSearchQuery)
        } else if (!searchInCollection) {
            setAllCards([])
        }
    }, [searchInCollection, debouncedSearchQuery, searchAllCards])

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
    }, [deckId, handleSuccess, handleError])

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
    }, [handleSuccess, handleError])

    // Handle removing card from deck
    const handleRemoveCard = useCallback(async (deckCard: DeckCard) => {
        try {
            await removeCardFromDeck(deckCard.id)
            setDeckCards(prev => prev.filter(dc => dc.id !== deckCard.id))
            handleSuccess(`Removed ${deckCard.expand?.card?.name || 'card'} from deck`)
        } catch (error) {
            handleError(error, 'Failed to remove card from deck')
        }
    }, [handleSuccess, handleError])

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
        stats,

        // Loading states
        isLoading,

        // Actions
        handleAddCard,
        handleEditCard,
        handleRemoveCard,
        getValidationStatus,
        loadDeckData
    }
}
