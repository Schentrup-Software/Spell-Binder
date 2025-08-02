import { DeckCard, Deck } from './types'

export interface DeckConstraints {
    maxQuantityPerCard: number
    minTotalCards?: number
    requiredTotalCards?: number
    allowsCommander: boolean
    allowsCoCommander: boolean
}

export interface DeckValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export const getDeckConstraints = (format?: string): DeckConstraints => {
    switch (format) {
        case 'commander':
        case 'brawl':
        case 'oathbreaker':
        case 'paupercommander':
            return {
                maxQuantityPerCard: 1,
                requiredTotalCards: 100,
                allowsCommander: true,
                allowsCoCommander: format === 'commander'
            }
        case 'standard':
        case 'pioneer':
        case 'modern':
        case 'legacy':
        case 'vintage':
        case 'historic':
        case 'alchemy':
        case 'timeless':
            return {
                maxQuantityPerCard: 4,
                minTotalCards: 60,
                allowsCommander: false,
                allowsCoCommander: false
            }
        default:
            return {
                maxQuantityPerCard: 4,
                minTotalCards: 60,
                allowsCommander: false,
                allowsCoCommander: false
            }
    }
}

export const getDeckValidationStatus = (deck: Deck | null, deckCards: DeckCard[]): DeckValidationResult => {
    if (!deck || !deckCards.length) {
        return { isValid: false, errors: ['Deck is empty'], warnings: [] }
    }

    const errors: string[] = []
    const warnings: string[] = []
    const constraints = getDeckConstraints(deck.format)
    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0)
    const deckTypeName = (deck.format?.charAt(0).toUpperCase() ?? '') + (deck.format?.slice(1) ?? '')

    // Check deck size
    if (constraints.requiredTotalCards && totalCards !== constraints.requiredTotalCards) {
        errors.push(`${deckTypeName} decks must have exactly ${constraints.requiredTotalCards} cards (currently ${totalCards})`)
    } else if (constraints.minTotalCards && totalCards < constraints.minTotalCards) {
        errors.push(`${deckTypeName} decks must have at least ${constraints.minTotalCards} cards (currently ${totalCards})`)
    }

    // Check for commander requirements
    if (constraints.allowsCommander) {
        const commander = deckCards.find(dc => dc.type === 'commander')
        if (!commander) {
            errors.push('Commander deck must have a commander')
        }
    }

    // Check quantity limits
    for (const deckCard of deckCards) {
        const cardName = deckCard.expand?.card?.name || 'Unknown Card'
        if (deckCard.quantity > constraints.maxQuantityPerCard) {
            // Check if it's a basic land (usually unlimited)
            const isBasicLand = cardName.match(/^(Plains|Island|Swamp|Mountain|Forest)$/)
            if (!isBasicLand) {
                errors.push(`${cardName}: ${deckCard.quantity} copies (max ${constraints.maxQuantityPerCard})`)
            }
        }
    }

    return { isValid: errors.length === 0, errors, warnings }
}

export const getMaxQuantityForCard = (cardName: string, deckCards: DeckCard[], format?: string): number => {
    const constraints = getDeckConstraints(format)

    // Check if card already exists in deck
    const existingCard = deckCards.find(dc => dc.expand?.card?.name === cardName)
    if (existingCard) {
        return Math.max(0, constraints.maxQuantityPerCard - existingCard.quantity)
    }

    return constraints.maxQuantityPerCard
}

export const isCommanderSlotAvailable = (type: 'commander' | 'co-commander', deckCards: DeckCard[]): boolean => {
    if (type === 'commander') {
        return !deckCards.some(dc => dc.type === 'commander')
    }
    if (type === 'co-commander') {
        return !deckCards.some(dc => dc.type === 'co-commander')
    }
    return true
}
