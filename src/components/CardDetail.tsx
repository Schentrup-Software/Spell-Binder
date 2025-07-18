import { useState } from 'react';
import { Card, CardCondition } from '../lib/types';
import CardImage from './CardImage';
import FormField from './FormField';
import { useFormValidation } from '../hooks/useFormValidation';
import LoadingSpinner from './LoadingSpinner';

interface CardDetailProps {
  card: Card;
  onAddToCollection: (quantity: number, condition: CardCondition, foil: boolean, notes: string) => Promise<void>;
  onClose: () => void;
}

export default function CardDetail({ card, onAddToCollection, onClose }: CardDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form validation setup
  const {
    values,
    errors,
    isValid,
    setValue,
    validateAll,
    touch
  } = useFormValidation(
    {
      quantity: 1,
      condition: CardCondition.NEAR_MINT,
      foil: false,
      notes: ''
    },
    {
      quantity: {
        required: true,
        min: 1,
        max: 999,
        custom: (value) => {
          if (!Number.isInteger(value)) {
            return 'Quantity must be a whole number';
          }
          return null;
        }
      },
      condition: {
        required: true
      },
      notes: {
        maxLength: 500
      }
    }
  );
  
  // Format price with dollar sign and two decimal places
  const formattedPrice = card.price_usd 
    ? `${card.price_usd.toFixed(2)}` 
    : 'N/A';
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onAddToCollection(
        values.quantity,
        values.condition,
        values.foil,
        values.notes
      );
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Card image and info */}
      <div className="flex flex-col items-center">
        <CardImage 
          card={card}
          cardName={card.name} 
          size="large"
          quality="high"
          priority={true}
          className="mb-4 max-w-full h-auto"
        />
        
        <div className="w-full">
          <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
            {card.name}
          </h3>
          
          <div className="text-xs md:text-sm text-gray-600 mb-2">
            {card.type_line}
          </div>
          
          <div className="mb-2">
            <span className="text-xs md:text-sm font-medium">Set:</span>
            <span className="ml-1 text-xs md:text-sm">{card.set_name} ({card.set_code})</span>
          </div>
          
          <div className="mb-2">
            <span className="text-xs md:text-sm font-medium">Rarity:</span>
            <span className="ml-1 text-xs md:text-sm capitalize">{card.rarity}</span>
          </div>
          
          {card.mana_cost && (
            <div className="mb-2">
              <span className="text-xs md:text-sm font-medium">Mana Cost:</span>
              <span className="ml-1 text-xs md:text-sm">{card.mana_cost}</span>
            </div>
          )}
          
          <div className="mb-2">
            <span className="text-xs md:text-sm font-medium">Price:</span>
            <span className="ml-1 text-xs md:text-sm font-semibold">${formattedPrice}</span>
          </div>
        </div>
      </div>
      
      {/* Add to collection form */}
      <div>
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
          Add to Collection
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Quantity */}
          <FormField
            label="Quantity"
            error={errors.quantity}
            required
            helpText="Number of copies to add (1-999)"
          >
            <input
              type="number"
              min="1"
              max="999"
              value={values.quantity}
              onChange={(e) => setValue('quantity', parseInt(e.target.value) || 1)}
              onBlur={() => touch('quantity')}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.quantity ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
          </FormField>
          
          {/* Condition */}
          <FormField
            label="Condition"
            error={errors.condition}
            required
            helpText="Physical condition of the card"
          >
            <select
              value={values.condition}
              onChange={(e) => setValue('condition', e.target.value as CardCondition)}
              onBlur={() => touch('condition')}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.condition ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value={CardCondition.NEAR_MINT}>Near Mint (NM)</option>
              <option value={CardCondition.LIGHTLY_PLAYED}>Lightly Played (LP)</option>
              <option value={CardCondition.MODERATELY_PLAYED}>Moderately Played (MP)</option>
              <option value={CardCondition.HEAVILY_PLAYED}>Heavily Played (HP)</option>
              <option value={CardCondition.DAMAGED}>Damaged (DMG)</option>
            </select>
          </FormField>
          
          {/* Foil */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="foil"
                checked={values.foil}
                onChange={(e) => setValue('foil', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="foil" className="ml-2 block text-sm text-gray-700">
                Foil
              </label>
            </div>
          </div>
          
          {/* Notes */}
          <FormField
            label="Notes"
            error={errors.notes}
            helpText="Optional notes about this card (max 500 characters)"
          >
            <textarea
              value={values.notes}
              onChange={(e) => setValue('notes', e.target.value)}
              onBlur={() => touch('notes')}
              rows={3}
              maxLength={500}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.notes ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {values.notes.length}/500 characters
            </div>
          </FormField>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-gray-100 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-blue-800 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="small" color="white" />
                  <span className="ml-2">Adding...</span>
                </div>
              ) : (
                'Add to Collection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}