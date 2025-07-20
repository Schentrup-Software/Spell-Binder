import { Card, CardFilters, CollectionEntry, CardCondition } from './types';
import { createAppError, withRetry, logError } from './errorHandling';
import { COLLECTIONS } from './pocketbase';
import pb from './pocketbase';

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
      const result = await pb.collection(COLLECTIONS.CARDS).getList(1, limit, {
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
      const card = await pb.collection(COLLECTIONS.CARDS).getOne(id);
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
    const result = await pb.collection(COLLECTIONS.CARD_SETS).getList();

    // Extract unique sets
    const sets = result.items.map((item: any) => ({
      code: item.id.toUpperCase(),
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
        user: pb.authStore.model?.id,
        card: cardId,
        quantity,
        condition,
        foil,
        notes: notes || "",
        acquired_date: new Date().toISOString(),
      };
      
      const record = await pb.collection(COLLECTIONS.COLLECTIONS).create(data);
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
  limit?: number,
  page?: number
): Promise<Card[]> {
  return withRetry(async () => {
    try {      
      // Start with base filter
      let filterString = "";
      
      // Add search query if provided
      if (filters.searchQuery && filters.searchQuery.trim()) {
        filterString += `name ~ "${filters.searchQuery.trim()}"`;
      }

      if (filters) {
        // Filter by set
        if (filters.set) {
          filterString += (filterString ? ' && ' : '') + `set_code = "${filters.set.toLocaleLowerCase()}"`;
        }
        
        // Filter by type
        if (filters.type) {
          filterString += (filterString ? ' && ' : '') + `type_line ~ "${filters.type}"`;
        }
        
        // Filter by rarity
        if (filters.rarity) {
          filterString += (filterString ? ' && ' : '') + `rarity = "${filters.rarity}"`;
        }
        
        // Filter by color
        if (filters.color && filters.color.length > 0) {
          const colorFilters = filters.color.map(color => `colors ?~ "${color}"`);
          filterString += (filterString ? ' && ' : '') + `(${colorFilters.join(' || ')})`;
        }
      }
      
      // Build sort string
      let sortString = '';
      
      // Handle special sort cases that need to use expanded card fields
      if (filters.sort === 'name') {
        sortString = 'name';
      } else if (filters.sort === 'set') {
        sortString = 'set_name';
      } else if (filters.sort === 'rarity') {
        sortString = 'rarity';
      } else if (filters.sort === 'price') {
        sortString = 'price_usd';
      }

      // Add sort direction
      sortString = sortString ? `${filters.sortDirection === 'asc' ? '+' : '-'}${sortString}` : '';

      const result = await pb.collection(COLLECTIONS.CARD_COLLECTION).getList(page, limit, {
        filter: filterString,
        sort: sortString,
      });
      
      // Map the expanded card_id to the card property
      let entries = result.items
        .map(item => {
          const card = {
            id: item.id,
            scryfall_id: item.scryfall_id,
            name: item.name,
            set_code: item.set_code.toUpperCase(),
            set_name: item.set_name,
            rarity: item.rarity,
            mana_cost: item.mana_cost,
            type_line: item.type_line,
            colors: item.colors,
            image_uri: item.image_uris?.normal 
              ?? item.image_uris?.png 
              ?? item.image_uris?.art_crop
              ?? item.image_uris?.border_crop
              ?? item.image_uris?.large
              ?? item.image_uris?.small,
            image_uri_small: item.image_uris?.small,
            image_file: item.image_file,
            price_usd: item.price_usd,
            last_updated: item.last_updated,
            collection: {
              id: item.collection_id,
              quantity: item.collection_quantity,
              condition: item.collection_condition,
              foil: item.collection_foil,
              acquired_date: item.collection_acquired_date,
              notes: item.collection_notes || "",
            } as CollectionEntry
          } as Card;

          return card as Card;
        });
      
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

      const record = await pb.collection(COLLECTIONS.COLLECTIONS).update(entryId, data);
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
      await pb.collection(COLLECTIONS.COLLECTIONS).delete(entryId);
    } catch (error) {
      const appError = createAppError(error, 'Remove card from collection');
      logError(appError, 'removeFromCollection');
      throw appError;
    }
  });
}