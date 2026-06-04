import { useEffect, useState } from 'react'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { Card, Deck } from '../lib/types'
import { addCardToDeck, getUserDecks } from '../lib/api'

interface AddToDeckFromCardModalProps {
  isOpen: boolean
  onClose: () => void
  card: Card | null
  onAdded?: (deckName: string) => void
}

export default function AddToDeckFromCardModal({
  isOpen,
  onClose,
  card,
  onAdded
}: AddToDeckFromCardModalProps) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [isLoadingDecks, setIsLoadingDecks] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadDecks = async () => {
      setIsLoadingDecks(true)
      setError(null)
      setQuantity(1)

      try {
        const userDecks = await getUserDecks()
        setDecks(userDecks)
        setSelectedDeckId(userDecks[0]?.id || '')
      } catch (err) {
        setError('Failed to load your decks. Please try again.')
      } finally {
        setIsLoadingDecks(false)
      }
    }

    loadDecks()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card || !selectedDeckId) return

    setIsSubmitting(true)
    setError(null)

    try {
      await addCardToDeck(
        selectedDeckId,
        card.id,
        Math.max(1, quantity),
        'library',
        card.collection?.id
      )
      const selectedDeck = decks.find((d) => d.id === selectedDeckId)
      onAdded?.(selectedDeck?.name || 'deck')
      onClose()
    } catch (err) {
      setError('Failed to add card to deck. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={card ? `Add ${card.name} to Deck` : 'Add Card to Deck'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoadingDecks ? (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner size="small" />
            <span className="ml-2 text-sm text-gray-500">Loading decks...</span>
          </div>
        ) : decks.length === 0 ? (
          <div className="text-sm text-gray-600">
            You do not have any decks yet. Create a deck first, then add this card.
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="deck-select" className="block text-sm font-medium text-gray-700 mb-1">
                Deck
              </label>
              <select
                id="deck-select"
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deck-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="deck-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingDecks || decks.length === 0 || !selectedDeckId || !card}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add to Deck'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
