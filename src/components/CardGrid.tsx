import { Card as CardType } from '../lib/pocketbase'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'

interface CardGridProps {
  cards: CardType[]
  isLoading?: boolean
  onCardClick?: (card: CardType) => void
  emptyMessage?: string
}

export default function CardGrid({ 
  cards, 
  isLoading = false, 
  onCardClick,
  emptyMessage = "No cards found"
}: CardGridProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="large" color="blue" />
        <p className="mt-4 text-gray-500">Loading cards...</p>
      </div>
    )
  }
  
  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {cards.map(card => (
        <Card 
          key={card.id} 
          card={card} 
          onClick={onCardClick ? () => onCardClick(card) : undefined}
        />
      ))}
    </div>
  )
}