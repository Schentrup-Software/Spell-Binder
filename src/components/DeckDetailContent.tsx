import DeckValidationDisplay from './DeckValidationDisplay'
import DeckStatsDisplay from './DeckStatsDisplay'
import DeckCardList from './DeckCardList'
import { Deck, DeckCard } from '../lib/types'
import { DeckStats } from '../lib/deckStats'
import { DeckValidationResult } from '../lib/deckConstraints'

interface DeckDetailContentProps {
    deck: Deck | null
    deckCards: DeckCard[]
    stats: DeckStats
    validation: DeckValidationResult
    isLoading: boolean
    onEditCard: (deckCard: DeckCard) => void
    onRemoveCard: (deckCard: DeckCard) => Promise<void>
    onAddCard: () => void
}

export default function DeckDetailContent({
    deck,
    deckCards,
    stats,
    validation,
    isLoading,
    onEditCard,
    onRemoveCard,
    onAddCard
}: DeckDetailContentProps) {
    return (
        <>
            {/* Deck Validation Status */}
            {deck && deckCards.length > 0 && (
                <DeckValidationDisplay validation={validation} />
            )}

            {/* Deck Stats */}
            <DeckStatsDisplay stats={stats} />

            {/* Deck Cards */}
            <DeckCardList
                deckCards={deckCards}
                onEdit={onEditCard}
                onRemove={onRemoveCard}
                isLoading={isLoading}
                onAddCard={onAddCard}
            />
        </>
    )
}
