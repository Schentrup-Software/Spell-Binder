import { DeckCard } from '../lib/types'

export interface DeckStats {
    totalCards: number
    averageCmc: number
    totalValue: number
    colorDistribution: Record<string, number>
}

export const calculateDeckStats = (deckCards: DeckCard[]): DeckStats => {
    const stats: DeckStats = {
        totalCards: 0,
        averageCmc: 0,
        totalValue: 0,
        colorDistribution: {}
    }

    let totalCmc = 0
    let cardsWithCmc = 0

    deckCards.forEach(deckCard => {
        const card = deckCard.expand?.card
        if (!card) return

        stats.totalCards += deckCard.quantity

        // Calculate CMC
        if (card.mana_cost) {
            // Parse mana cost string like "{1}{B}" or "{2}{B}{U}"
            const manaSymbols = card.mana_cost.match(/\{[^}]+\}/g) || []
            const cmc = manaSymbols.reduce((total, symbol) => {
                // Remove braces and get the content
                const content = symbol.slice(1, -1)

                // If it's a number, add it to total
                if (/^\d+$/.test(content)) {
                    return total + parseInt(content, 10)
                }

                // If it's a colored mana symbol (W, U, B, R, G) or other symbols, count as 1
                // This includes symbols like X, which should be counted as 0 in most cases
                if (content === 'X') {
                    return total // X typically counts as 0 for CMC calculation
                }

                return total + 1 // Colored mana symbols count as 1 each
            }, 0)

            totalCmc += cmc * deckCard.quantity
            cardsWithCmc += deckCard.quantity
        }

        // Calculate total value
        if (card.price_usd) {
            stats.totalValue += card.price_usd
        }

        // Color distribution
        if (card.colors && card.colors.length > 0) {
            card.colors.forEach(color => {
                stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + deckCard.quantity
            })
        } else {
            stats.colorDistribution['C'] = (stats.colorDistribution['C'] || 0) + deckCard.quantity
        }
    })

    stats.averageCmc = cardsWithCmc > 0 ? totalCmc / cardsWithCmc : 0

    return stats
}
