import { useState, useEffect } from 'react'
import Modal from './Modal'
import { DeckCard, DeckCardType, Deck } from '../lib/types'
import { getDeckConstraints, isCommanderSlotAvailable } from '../lib/deckConstraints'

interface EditCardModalProps {
    isOpen: boolean
    onClose: () => void
    onUpdateCard: (quantity: number, type: DeckCardType) => void
    selectedDeckCard: DeckCard | null
    deck: Deck | null
    deckCards: DeckCard[]
}

export default function EditCardModal({
    isOpen,
    onClose,
    onUpdateCard,
    selectedDeckCard,
    deck,
    deckCards
}: EditCardModalProps) {
    const [cardQuantity, setCardQuantity] = useState(1)
    const [cardType, setCardType] = useState<DeckCardType>('library')

    // Set initial values when modal opens
    useEffect(() => {
        if (isOpen && selectedDeckCard) {
            setCardQuantity(selectedDeckCard.quantity)
            setCardType(selectedDeckCard.type)
        }
    }, [isOpen, selectedDeckCard])

    const handleUpdateCard = () => {
        onUpdateCard(cardQuantity, cardType)
    }

    const constraints = getDeckConstraints(deck?.format)
    const isSingleton = constraints.maxQuantityPerCard === 1

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${selectedDeckCard?.expand?.card?.name || 'Card'}`}
            size="md"
        >
            <div className="space-y-4">
                {/* Quantity - only show if changeable */}
                {!isSingleton && (
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
                )}

                {/* Card Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Type
                    </label>
                    <p className="text-sm text-gray-500 mb-2">Check an option to assign a special role, or leave unchecked for main deck.</p>
                    <div className="space-y-2">
                        {/* Commander - only show for commander formats */}
                        {constraints.allowsCommander && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={cardType === 'commander'}
                                    onChange={(e) => setCardType(e.target.checked ? 'commander' : 'library')}
                                    disabled={!isCommanderSlotAvailable('commander', deckCards) && selectedDeckCard?.type !== 'commander'}
                                    className="mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className={`text-sm ${(!isCommanderSlotAvailable('commander', deckCards) && selectedDeckCard?.type !== 'commander') ? 'text-gray-400' : 'text-gray-700'}`}>
                                    Commander
                                    {!isCommanderSlotAvailable('commander', deckCards) && selectedDeckCard?.type !== 'commander' && (
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
                                    disabled={!isCommanderSlotAvailable('co-commander', deckCards) && selectedDeckCard?.type !== 'co-commander'}
                                    className="mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className={`text-sm ${(!isCommanderSlotAvailable('co-commander', deckCards) && selectedDeckCard?.type !== 'co-commander') ? 'text-gray-400' : 'text-gray-700'}`}>
                                    Co-Commander
                                    {!isCommanderSlotAvailable('co-commander', deckCards) && selectedDeckCard?.type !== 'co-commander' && (
                                        <span className="ml-1 text-xs text-amber-600">(slot filled)</span>
                                    )}
                                </span>
                            </label>
                        )}

                        {/* Show current card type info */}
                        {cardType === 'library' && (
                            <p className="text-sm text-gray-600">
                                This card is in the main deck.
                            </p>
                        )}

                        {/* Show message when no special types are available */}
                        {(!constraints.allowsCommander && !constraints.allowsCoCommander) && (
                            <p className="text-sm text-gray-500 italic">
                                This deck format only supports regular library cards.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpdateCard}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Changes
                </button>
            </div>
        </Modal>
    )
}
