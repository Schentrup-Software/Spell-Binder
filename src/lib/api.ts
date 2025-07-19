import PocketBase from 'pocketbase';
import { Card, CardFilters, CollectionEntry, CardCondition } from './types';
import { createAppError, withRetry, logError } from './errorHandling';

// Create a PocketBase client instance
const pb = new PocketBase('http://localhost:8090');

/**
 * Search for cards by name and optional filters
 * @param query The search query
 * @param filters Optional filters to apply
 * @param limit Maximum number of results to return
 * @returns Promise with array of matching cards
 */
export async function searchCards(
  query: string, 
  filters: CardFilters = {}, 
  limit: number = 20
): Promise<Card[]> {
  return withRetry(async () => {
    try {
      // Build filter string
      let filterString = `name ~ "${query}"`;
      
      // Add set filter if provided
      if (filters.set) {
        filterString += ` && set_code = "${filters.set}"`;
      }
      
      // Add type filter if provided
      if (filters.type) {
        filterString += ` && type_line ~ "${filters.type}"`;
      }
      
      // Add rarity filter if provided
      if (filters.rarity) {
        filterString += ` && rarity = "${filters.rarity}"`;
      }
      
      // Add color filter if provided
      if (filters.color && filters.color.length > 0) {
        // For each color, check if it's in the colors array
        const colorFilters = filters.color.map(color => `colors ?~ "${color}"`);
        filterString += ` && (${colorFilters.join(' || ')})`;
      }
      
      // Execute the search
      const result = await pb.collection('cards').getList(1, limit, {
        filter: filterString,
        sort: 'name',
      });
      
      return result.items as unknown as Card[];
    } catch (error) {
      const appError = createAppError(error, 'Card search');
      logError(appError, 'searchCards');
      throw appError;
    }
  });
}

/**
 * Get card details by ID
 * @param id The card ID
 * @returns Promise with card details
 */
export async function getCardById(id: string): Promise<Card> {
  return withRetry(async () => {
    try {
      const card = await pb.collection('cards').getOne(id);
      return card as unknown as Card;
    } catch (error) {
      const appError = createAppError(error, 'Get card details');
      logError(appError, 'getCardById');
      throw appError;
    }
  });
}

/**
 * Get available card sets for filtering
 * @returns Promise with array of unique set objects
 */
export async function getCardSets(): Promise<{code: string, name: string}[]> {
  try {
    const result = await pb.collection('card_sets').getList();

    // Extract unique sets
    const sets = result.items.map((item: any) => ({
      code: item.id,
      name: item.name,
    }));
    
    return sets;
  } catch (error) {
    console.error('Error getting card sets:', error);
    return [];
  }
}

/**
 * Add a card to the user's collection
 * @param cardId The card ID to add
 * @param quantity Number of copies to add
 * @param condition Card condition
 * @param foil Whether the card is foil
 * @param notes Optional notes about the card
 * @returns Promise with the created collection entry
 */
export async function addCardToCollection(
  cardId: string,
  quantity: number,
  condition: CardCondition,
  foil: boolean,
  notes?: string
): Promise<CollectionEntry> {
  return withRetry(async () => {
    try {
      const data = {
        card_id: cardId,
        quantity,
        condition,
        foil,
        notes: notes || "",
        acquired_date: new Date().toISOString(),
      };
      
      const record = await pb.collection('collections').create(data);
      return record as unknown as CollectionEntry;
    } catch (error) {
      const appError = createAppError(error, 'Add card to collection');
      logError(appError, 'addCardToCollection');
      throw appError;
    }
  });
}

/**
 * Get all cards in the user's collection with optional filtering and sorting
 * @param filters Optional filters to apply to the collection
 * @param sortField Field to sort by (default: 'created')
 * @param sortDirection Direction to sort (default: 'desc')
 * @param searchQuery Optional search query for card names
 * @returns Promise with array of collection entries with card details
 */
export async function getUserCollection(
  filters: CardFilters = {},
  sortField: string = '',
  sortDirection: 'asc' | 'desc' = 'desc',
  searchQuery?: string
): Promise<CollectionEntry[]> {
  return withRetry(async () => {
    try {      
      // Start with base filter
      let filterString = "";
      
      // Add search query if provided
      if (searchQuery && searchQuery.trim()) {
        filterString += `name ~ "${searchQuery.trim()}"`;
      }
      
      // Build sort string
      let sortString = '';
      
      // Handle special sort cases that need to use expanded card fields
      if (sortField === 'name') {
        sortString = 'name';
      } else if (sortField === 'set') {
        sortString = 'set_name';
      } else if (sortField === 'rarity') {
        sortString = 'rarity';
      } else if (sortField === 'price') {
        sortString = 'price_usd';
      }

      // Add sort direction
      sortString = sortString ? `${sortDirection === 'asc' ? '+' : '-'}${sortString}` : '';

      const result = await pb.collection('cards').getList(1, 100, {
        filter: filterString,
        sort: sortString,
        expand: 'collections_via_card.card'
      });
      
      // Map the expanded card_id to the card property
      let entries = result.items.map(item => {
        const entry = item as unknown as CollectionEntry;
        if (item.expand && item.expand.card_id) {
          entry.card = item.expand.card_id as unknown as Card;
        }
        return entry;
      });
      
      // Apply client-side filtering for filters that can't be done directly in the query
      if (filters) {
        // Filter by set
        if (filters.set) {
          entries = entries.filter(entry => entry.card?.set_code === filters.set);
        }
        
        // Filter by type
        if (filters.type) {
          entries = entries.filter(entry => entry.card?.type_line.includes(filters.type!));
        }
        
        // Filter by rarity
        if (filters.rarity) {
          entries = entries.filter(entry => entry.card?.rarity === filters.rarity);
        }
        
        // Filter by color
        if (filters.color && filters.color.length > 0) {
          entries = entries.filter(entry => {
            if (!entry.card?.colors) return false;
            return filters.color!.some(color => entry.card!.colors.includes(color));
          });
        }
      }
      
      return entries;
    } catch (error) {
      const appError = createAppError(error, 'Load collection');
      logError(appError, 'getUserCollection');
      throw appError;
    }
  });
}

/**
 * Update a collection entry
 * @param entryId The collection entry ID to update
 * @param quantity New quantity
 * @param condition New condition
 * @param foil New foil status
 * @param notes New notes
 * @returns Promise with the updated collection entry
 */
export async function updateCollectionEntry(
  entryId: string,
  quantity: number,
  condition: CardCondition,
  foil: boolean,
  notes?: string
): Promise<CollectionEntry> {
  return withRetry(async () => {
    try {
      const data = {
        quantity,
        condition,
        foil,
        notes: notes || "",
      };
      
      const record = await pb.collection('collections').update(entryId, data);
      return record as unknown as CollectionEntry;
    } catch (error) {
      const appError = createAppError(error, 'Update collection entry');
      logError(appError, 'updateCollectionEntry');
      throw appError;
    }
  });
}

/**
 * Remove a card from the collection
 * @param entryId The collection entry ID to remove
 * @returns Promise that resolves when the card is removed
 */
export async function removeFromCollection(entryId: string): Promise<void> {
  return withRetry(async () => {
    try {
      await pb.collection('collections').delete(entryId);
    } catch (error) {
      const appError = createAppError(error, 'Remove card from collection');
      logError(appError, 'removeFromCollection');
      throw appError;
    }
  });
}