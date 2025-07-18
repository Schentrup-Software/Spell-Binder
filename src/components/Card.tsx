import { Card as CardType } from '../lib/pocketbase'

interface CardProps {
  card: CardType
  onClick?: () => void
  isCompact?: boolean
}

export default function Card({ card, onClick, isCompact = false }: CardProps) {
  // Placeholder image URL for when card image is not available
  const placeholderImage = 'https://via.placeholder.com/265x370?text=Card+Image'
  
  return (
    <div 
      className={`bg-white rounded-lg shadow overflow-hidden ${onClick ? 'cursor-pointer transform transition hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="relative pb-[140%]">
        <img
          src={card.image_file || placeholderImage}
          alt={card.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {!isCompact && (
        <div className="p-3">
          <h3 className="font-medium text-gray-900 truncate" title={card.name}>
            {card.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {card.set_name} ({card.set_code.toUpperCase()})
          </p>
          {card.price_usd && (
            <p className="text-sm font-medium text-green-600 mt-1">
              ${card.price_usd.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}