import { DeckCard } from '../lib/types'
import CardImage from './CardImage'

interface DeckCardListProps {
    deckCards: DeckCard[]
    onEdit: (deckCard: DeckCard) => void
    onRemove: (deckCard: DeckCard) => void
    isLoading?: boolean
    onAddCard?: () => void
}

export default function DeckCardList({ deckCards, onEdit, onRemove, isLoading, onAddCard }: DeckCardListProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded mb-4 w-1/3"></div>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (deckCards.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <div className="text-sm text-gray-500">No cards in deck yet</div>
                </div>
                <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg mb-4">
                        No cards in this deck yet
                    </p>
                    {onAddCard && (
                        <button
                            onClick={onAddCard}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Add Your First Card
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <div className="text-sm text-gray-500">
                    {deckCards.length > 0
                        ? `${deckCards.length} unique cards`
                        : 'No cards in deck yet'}
                </div>
            </div>

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
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {card.name}
                                                    </div>
                                                    {!deckCard.expand?.collection && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                            Proxy
                                                        </span>
                                                    )}
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
                                                    onClick={() => onEdit(deckCard)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="Edit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onRemove(deckCard)}
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
        </div>
    )
}
