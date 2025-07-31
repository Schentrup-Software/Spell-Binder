import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from './PageHeader'
import ErrorBoundary from './ErrorBoundary'
import LoadingSpinner from './LoadingSpinner'
import Modal from './Modal'
import FormField from './FormField'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'
import { getUserDecks, createDeck, updateDeck, deleteDeck } from '../lib/api'
import { Deck, DeckFormat } from '../lib/types'

const DECK_FORMATS: { value: DeckFormat; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'pioneer', label: 'Pioneer' },
    { value: 'modern', label: 'Modern' },
    { value: 'legacy', label: 'Legacy' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'commander', label: 'Commander' },
    { value: 'brawl', label: 'Brawl' },
    { value: 'pauper', label: 'Pauper' },
    { value: 'historic', label: 'Historic' },
    { value: 'alchemy', label: 'Alchemy' },
    { value: 'timeless', label: 'Timeless' }
]

export default function DeckView() {
    const [decks, setDecks] = useState<Deck[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)

    // Form state
    const [deckName, setDeckName] = useState('')
    const [deckDescription, setDeckDescription] = useState('')
    const [deckFormat, setDeckFormat] = useState<DeckFormat | ''>('')

    const { handleError, handleSuccess } = useErrorHandler({ context: 'Decks' })
    const { isLoading, withLoading } = useLoadingState()

    // Load decks on component mount
    useEffect(() => {
        loadDecks()
    }, [])

    const loadDecks = () => {
        withLoading('decks', async () => {
            try {
                const userDecks = await getUserDecks()
                setDecks(userDecks)
            } catch (error) {
                handleError(error, 'Failed to load decks')
            }
        })
    }

    // Reset form state
    const resetForm = () => {
        setDeckName('')
        setDeckDescription('')
        setDeckFormat('')
        setSelectedDeck(null)
    }

    // Handle create deck
    const handleCreateDeck = async () => {
        if (!deckName.trim()) {
            handleError(new Error('Deck name is required'), 'Please enter a deck name')
            return
        }

        try {
            const newDeck = await createDeck(
                deckName.trim(),
                deckDescription.trim() || undefined,
                deckFormat || undefined
            )

            setDecks(prev => [newDeck, ...prev])
            handleSuccess(`Created deck "${newDeck.name}"`)
            setShowCreateModal(false)
            resetForm()
        } catch (error) {
            handleError(error, 'Failed to create deck')
        }
    }

    // Handle edit deck
    const handleEditDeck = async () => {
        if (!selectedDeck || !deckName.trim()) {
            handleError(new Error('Deck name is required'), 'Please enter a deck name')
            return
        }

        try {
            const updatedDeck = await updateDeck(
                selectedDeck.id,
                deckName.trim(),
                deckDescription.trim() || undefined,
                deckFormat || undefined
            )

            setDecks(prev => prev.map(deck =>
                deck.id === updatedDeck.id ? updatedDeck : deck
            ))
            handleSuccess(`Updated deck "${updatedDeck.name}"`)
            setShowEditModal(false)
            resetForm()
        } catch (error) {
            handleError(error, 'Failed to update deck')
        }
    }

    // Handle delete deck
    const handleDeleteDeck = async () => {
        if (!selectedDeck) return

        try {
            await deleteDeck(selectedDeck.id)
            setDecks(prev => prev.filter(deck => deck.id !== selectedDeck.id))
            handleSuccess(`Deleted deck "${selectedDeck.name}"`)
            setShowDeleteModal(false)
            resetForm()
        } catch (error) {
            handleError(error, 'Failed to delete deck')
        }
    }

    // Open edit modal
    const openEditModal = (deck: Deck) => {
        setSelectedDeck(deck)
        setDeckName(deck.name)
        setDeckDescription(deck.description || '')
        setDeckFormat(deck.format || '')
        setShowEditModal(true)
    }

    // Open delete modal
    const openDeleteModal = (deck: Deck) => {
        setSelectedDeck(deck)
        setShowDeleteModal(true)
    }

    // Open create modal
    const openCreateModal = () => {
        resetForm()
        setShowCreateModal(true)
    }

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <PageHeader
                    title="My Decks"
                    description="Build and manage your Magic: The Gathering decks"
                    action={
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create Deck
                        </button>
                    }
                />

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <div className="text-sm text-gray-500">
                            {decks.length > 0
                                ? `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`
                                : 'No decks created yet'}
                        </div>
                    </div>

                    {isLoading('decks') ? (
                        <div className="p-4">
                            <div className="mb-4 text-sm text-gray-500">
                                Loading your decks...
                            </div>
                            <LoadingSpinner size="medium" />
                        </div>
                    ) : decks.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {decks.map(deck => (
                                <div key={deck.id} className="hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-blue-200">
                                    <div className="p-4 flex items-center justify-between">
                                        <Link
                                            to={`/decks/${deck.id}`}
                                            className="flex-1 min-w-0 group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline transition-colors cursor-pointer">
                                                    {deck.name}
                                                </span>
                                                {deck.format && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                        {deck.format}
                                                    </span>
                                                )}
                                            </div>
                                            {deck.description && (
                                                <p className="mt-1 text-sm text-gray-600 group-hover:text-gray-800">{deck.description}</p>
                                            )}
                                            <div className="mt-1 text-xs text-gray-500 group-hover:text-gray-600">
                                                Created {new Date(deck.created).toLocaleDateString()}
                                                {deck.updated !== deck.created && (
                                                    <span> • Updated {new Date(deck.updated).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openEditModal(deck);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                                title="Edit deck"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openDeleteModal(deck);
                                                }}
                                                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                title="Delete deck"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg mb-4">
                                No decks created yet
                            </p>
                            <p className="text-gray-400 mb-4">
                                Create your first deck to start building!
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Your First Deck
                            </button>
                        </div>
                    )}
                </div>

                {/* Create Deck Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        resetForm()
                    }}
                    title="Create New Deck"
                    size="md"
                >
                    <div className="space-y-4">
                        <FormField
                            label="Deck Name"
                            error=""
                            required
                        >
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                placeholder="Enter deck name"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                maxLength={100}
                            />
                        </FormField>

                        <FormField label="Description">
                            <textarea
                                value={deckDescription}
                                onChange={(e) => setDeckDescription(e.target.value)}
                                placeholder="Optional deck description"
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                maxLength={500}
                            />
                        </FormField>

                        <FormField label="Format">
                            <select
                                value={deckFormat}
                                onChange={(e) => setDeckFormat(e.target.value as DeckFormat)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select format (optional)</option>
                                {DECK_FORMATS.map(format => (
                                    <option key={format.value} value={format.value}>
                                        {format.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setShowCreateModal(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateDeck}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Create Deck
                        </button>
                    </div>
                </Modal>

                {/* Edit Deck Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false)
                        resetForm()
                    }}
                    title={`Edit ${selectedDeck?.name || 'Deck'}`}
                    size="md"
                >
                    <div className="space-y-4">
                        <FormField
                            label="Deck Name"
                            error=""
                            required
                        >
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                placeholder="Enter deck name"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                maxLength={100}
                            />
                        </FormField>

                        <FormField label="Description">
                            <textarea
                                value={deckDescription}
                                onChange={(e) => setDeckDescription(e.target.value)}
                                placeholder="Optional deck description"
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                maxLength={500}
                            />
                        </FormField>

                        <FormField label="Format">
                            <select
                                value={deckFormat}
                                onChange={(e) => setDeckFormat(e.target.value as DeckFormat)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select format (optional)</option>
                                {DECK_FORMATS.map(format => (
                                    <option key={format.value} value={format.value}>
                                        {format.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setShowEditModal(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditDeck}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </Modal>

                {/* Delete Deck Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false)
                        resetForm()
                    }}
                    title="Delete Deck"
                    size="sm"
                >
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Delete "{selectedDeck?.name}"
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this deck? This action cannot be undone and will remove all cards from the deck.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setShowDeleteModal(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteDeck}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Delete Deck
                        </button>
                    </div>
                </Modal>
            </div>
        </ErrorBoundary>
    )
}
