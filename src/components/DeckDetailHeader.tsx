import { Link } from 'react-router-dom'
import PageHeader from './PageHeader'
import { Deck } from '../lib/types'

interface DeckDetailHeaderProps {
    deck: Deck | null
    onAddCard: () => void
}

export default function DeckDetailHeader({ deck, onAddCard }: DeckDetailHeaderProps) {
    return (
        <PageHeader
            title={deck?.name || 'Loading...'}
            description={deck?.description || 'Deck details'}
            action={
                <div className="flex space-x-3">
                    <Link
                        to="/decks"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ← Back to Decks
                    </Link>
                    <button
                        onClick={onAddCard}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Cards
                    </button>
                </div>
            }
        />
    )
}
