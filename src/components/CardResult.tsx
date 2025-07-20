import { Card } from '../lib/types';
import CardImage from './CardImage';

interface CardResultProps {
  card: Card;
  onClick: (card: Card) => void;
}

export default function CardResult({ card, onClick }: CardResultProps) {
  // Format price with dollar sign and two decimal places
  const formattedPrice = card.price_usd
    ? `$${card.price_usd.toFixed(2)}`
    : 'N/A';

  // Get color indicators for display
  const colorIndicators = {
    W: '⚪',
    U: '🔵',
    B: '⚫',
    R: '🔴',
    G: '🟢',
    C: '⚙️'
  };

  // Map rarity to display text and color
  const rarityDisplay = {
    common: { text: 'Common', color: 'text-gray-600' },
    uncommon: { text: 'Uncommon', color: 'text-gray-500' },
    rare: { text: 'Rare', color: 'text-yellow-600' },
    mythic: { text: 'Mythic', color: 'text-orange-600' },
    special: { text: 'Special', color: 'text-purple-600' },
    bonus: { text: 'Bonus', color: 'text-blue-600' }
  };

  // Get rarity display info
  const rarity = rarityDisplay[card.rarity as keyof typeof rarityDisplay] || rarityDisplay.common;

  // CardImage component will handle all image source logic internally

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 active:shadow-sm touch-manipulation"
      onClick={() => onClick(card)}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Card image */}
        <div className="sm:w-36 flex-shrink-0">
          <CardImage
            card={card}
            cardName={card.name}
            size="medium"
            quality="medium"
            className="w-full h-48 sm:h-48 object-contain"
          />
        </div>

        {/* Card details */}
        <div className="p-3 md:p-4 flex-grow">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
            {card.name}
          </h3>

          <div className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-1">
            {card.type_line}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-1">
            <span className="text-xs md:text-sm">
              {card.set_name} ({card.set_code})
            </span>
            <span className={`text-xs ${rarity.color} capitalize`}>
              {rarity.text}
            </span>
          </div>

          {/* Colors */}
          {card.colors && card.colors.length > 0 && (
            <div className="mb-2 flex items-center">
              <span className="text-xs md:text-sm font-medium text-gray-700 mr-2">Colors:</span>
              <div className="flex space-x-1">
                {card.colors.map((color) => (
                  <span key={color} title={color} className="text-sm">
                    {colorIndicators[color as keyof typeof colorIndicators] || color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mt-2">
            <span className="text-xs md:text-sm font-medium text-gray-700">Price:</span>
            <span className="ml-1 text-xs md:text-sm text-gray-900 font-semibold">${formattedPrice}</span>
          </div>

          {/* Add to collection button */}
          <button
            className="mt-3 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-blue-800 transition-colors touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onClick(card);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  );
}