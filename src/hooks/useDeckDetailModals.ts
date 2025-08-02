import { useState } from 'react'
import { DeckCard } from '../lib/types'

export function useDeckDetailModals() {
    const [showAddCardModal, setShowAddCardModal] = useState(false)
    const [showEditCardModal, setShowEditCardModal] = useState(false)
    const [selectedDeckCard, setSelectedDeckCard] = useState<DeckCard | null>(null)

    const openAddCardModal = () => {
        setShowAddCardModal(true)
    }

    const closeAddCardModal = () => {
        setShowAddCardModal(false)
    }

    const openEditCardModal = (deckCard: DeckCard) => {
        setSelectedDeckCard(deckCard)
        setShowEditCardModal(true)
    }

    const closeEditCardModal = () => {
        setShowEditCardModal(false)
        setSelectedDeckCard(null)
    }

    return {
        // State
        showAddCardModal,
        showEditCardModal,
        selectedDeckCard,
        // Actions
        openAddCardModal,
        closeAddCardModal,
        openEditCardModal,
        closeEditCardModal
    }
}
