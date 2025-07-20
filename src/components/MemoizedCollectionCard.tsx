import { memo } from 'react';
import { Card } from '../lib/types';
import CardImage from './CardImage';

interface CollectionCardProps {
  entry: Card;
  onEdit: (entry: Card) => void;
  onDelete: (entry: Card) => void;
}

const MemoizedCollectionCard = memo(function CollectionCard({
  entry,
  onEdit,
  onDelete
}: CollectionCardProps) {
  if (!entry?.collection) return null;

  // Format price with dollar sign and two decimal places
  const formattedPrice = entry.price_usd
    ? `${entry.price_usd.toFixed(2)}`
    : 'N/A';

  // Format acquisition date
  const formattedDate = entry.collection.acquired_date
    ? new Date(entry.collection.acquired_date).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 active:scale-95 active:shadow-sm touch-manipulation">
      <div className="flex flex-col sm:flex-row">
        {/* Card image */}
        <div className="sm:w-36 flex-shrink-0 m-4">
          <CardImage
            card={entry}
            cardName={entry.name}
            size="medium"
            quality="medium"
            className="w-full h-48 sm:h-48 object-contain"
          />
        </div>

        {/* Card details */}
        <div className="p-3 md:p-4 flex-grow">
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
            {entry.name}
          </h3>

          <div className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-1">
            {entry.type_line}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-1">
            <span className="text-xs md:text-sm">
              {entry.set_name} ({entry.set_code})
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {entry.rarity}
            </span>
          </div>

          {/* Collection details - Mobile optimized grid */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs md:text-sm">
            <div>
              <span className="font-medium text-gray-700">Qty:</span>
              <span className="ml-1">{entry.collection.quantity}</span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Condition:</span>
              <span className="ml-1">{entry.collection.condition}</span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Price:</span>
              <span className="ml-1">{formattedPrice}</span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Added:</span>
              <span className="ml-1">{formattedDate}</span>
            </div>

            {entry.collection.foil && (
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ✨ Foil
                </span>
              </div>
            )}

            {entry.collection.notes && (
              <div className="col-span-2 mt-1">
                <span className="font-medium text-gray-700">Notes:</span>
                <span className="ml-1 text-gray-600 line-clamp-2">{entry.collection.notes}</span>
              </div>
            )}
          </div>

          {/* Action buttons - Mobile optimized */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onEdit(entry)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-gray-100 transition-colors touch-manipulation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(entry)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 active:bg-red-800 transition-colors touch-manipulation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry?.collection?.quantity === nextProps.entry?.collection?.quantity &&
    prevProps.entry?.collection?.condition === nextProps.entry?.collection?.condition &&
    prevProps.entry?.collection?.foil === nextProps.entry?.collection?.foil &&
    prevProps.entry?.collection?.notes === nextProps.entry?.collection?.notes &&
    prevProps.entry.price_usd === nextProps.entry.price_usd &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

export default MemoizedCollectionCard;