import { Card, CardFilters, CollectionEntry, CardCondition, Deck, DeckCard, DeckFormat, DeckCardType, EDHRECRequest, EDHRECResponse } from './types';
import { createAppError, logError } from './errorHandling';
import { COLLECTIONS } from './pocketbase';
import pb from './pocketbase';
import { RecordModel } from 'pocketbase';

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
  pageSize: number = 20,
  page: number = 1
): Promise<Card[]> {
  try {
    // Build filter string
    let filterString = `searchText=${encodeURIComponent(query.trim())}`;
    
    // Add set filter if provided
    if (filters.set) {
      filterString += `&setCode=${filters.set}`;
    }
    
    // Add type filter if provided
    if (filters.type) {
      filterString += `&typeLine=${filters.type}`;
    }
    
    // Add rarity filter if provided
    if (filters.rarity) {
      filterString += `&rarity=${filters.rarity}`;
    }
    
    // Add color filter if provided
    if (filters.color && filters.color.length > 0) {
      filterString += `&colors=${filters.color.join(",")}`;
    }
    
    // Execute the search
    const result = await fetch(`${pb.baseUrl}/api/cards?${filterString}&pageSize=${pageSize}&page=${page}`);
    
    if (!result.ok) {
      throw new Error(`Failed to fetch cards: ${result.statusText}`);
    }

    const data = await result.json();

    return data.items.map((item: RecordModel) => createCardFromRecord(item));
  } catch (error) {
    const appError = createAppError(error, 'Card search');
    logError(appError, 'searchCards');
    throw appError;
  }
}

/**
 * Get card details by ID
 * @param id The card ID
 * @returns Promise with card details
 */
export async function getCardById(id: string): Promise<Card> {
  try {
    const card = await pb.collection(COLLECTIONS.CARDS).getOne(id);
    return card as unknown as Card;
  } catch (error) {
    const appError = createAppError(error, 'Get card details');
    logError(appError, 'getCardById');
    throw appError;
  }
}

/**
 * Get users available card sets for filtering
 * @returns Promise with array of unique set objects
 */
export async function getCardSets(isCollectionView: boolean): Promise<{code: string, name: string}[]> {
  try {
    const collectionName = isCollectionView ? COLLECTIONS.CARD_SETS : COLLECTIONS.ALL_CARD_SETS;
    const result = await pb.collection(collectionName).getList(1, 500, {
      sort: isCollectionView ? 'name' : 'set_name'
    });

    // Extract unique sets
    const sets = result.items.map((item: any) => ({
      code: isCollectionView ? item.id.toUpperCase() : item.set_code.toUpperCase(),
      name: isCollectionView ? item.name : item.set_name,
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
  try {      
    // Start with base filter
    let filterString = "";
    
    // Add search query if provided
    if (filters.searchQuery && filters.searchQuery.trim()) {
      filterString += `name ~ "${filters.searchQuery.trim()}" || oracle_text ~ "${filters.searchQuery.trim()}"`;
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
      extends: 'card_prices_via_card',
    });
    
    return result.items.map(item => createCardFromRecord(item));
  } catch (error) {
    const appError = createAppError(error, 'Load collection');
    logError(appError, 'getUserCollection');
    throw appError;
  }
}

function createCardFromRecord(item: RecordModel): Card {
  let price_usd = 0;

  if (item.price_usd || item.price_usd === 0) {
    price_usd = item.price_usd;
  } else if (item.card_prices_via_card && item.card_prices_via_card.length > 0) {
    price_usd = item.card_prices_via_card[0]?.price_usd || 0;
  }

  return {
    id: item.card_id || item.id,
    scryfall_id: item.scryfall_id,
    name: item.name,
    oracle_text: item.oracle_text,
    set_code: item.set_code.toUpperCase(),
    set_name: item.set_name,
    rarity: item.rarity,
    mana_cost: item.mana_cost,
    type_line: item.type_line,
    colors: item.colors,
    image_uri: item.image_uri 
      ?? item.image_uris?.normal
      ?? item.image_uris?.png
      ?? item.image_uris?.art_crop
      ?? item.image_uris?.border_crop
      ?? item.image_uris?.large
      ?? item.image_uris?.small,
    image_uri_small: item.image_uris?.small,
    image_file: item.image_file,
    price_usd: price_usd,
    last_updated: item.last_updated,
    collection: item.collection_id ? {
      id: item.collection_id,
      quantity: item.collection_quantity,
      condition: item.collection_condition,
      foil: item.collection_foil,
      acquired_date: item.collection_acquired_date,
      notes: item.collection_notes || "",
    } as CollectionEntry : undefined
  };
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
}

/**
 * Remove a card from the collection
 * @param entryId The collection entry ID to remove
 * @returns Promise that resolves when the card is removed
 */
export async function removeFromCollection(entryId: string): Promise<void> {
  try {
    await pb.collection(COLLECTIONS.COLLECTIONS).delete(entryId);
  } catch (error) {
    const appError = createAppError(error, 'Remove card from collection');
    logError(appError, 'removeFromCollection');
    throw appError;
  }
}

/**
 * Get all decks for the authenticated user
 * @returns Promise with array of decks
 */
export async function getUserDecks(): Promise<Deck[]> {
  try {
    const result = await pb.collection(COLLECTIONS.DECKS).getList(1, 50, {
      sort: '-updated',
      filter: `user.id = "${pb.authStore.model?.id}"`
    });
    
    return result.items as unknown as Deck[];
  } catch (error) {
    const appError = createAppError(error, 'Get user decks');
    logError(appError, 'getUserDecks');
    throw appError;
  }
}

/**
 * Create a new deck
 * @param name Deck name
 * @param description Optional deck description
 * @param format Optional deck format
 * @returns Promise with the created deck
 */
export async function createDeck(
  name: string,
  description?: string,
  format?: DeckFormat
): Promise<Deck> {
  try {
    const data = {
      user: pb.authStore.model?.id,
      name,
      description: description || "",
      format: format || undefined
    };
    
    const record = await pb.collection(COLLECTIONS.DECKS).create(data);
    return record as unknown as Deck;
  } catch (error) {
    const appError = createAppError(error, 'Create deck');
    logError(appError, 'createDeck');
    throw appError;
  }
}

/**
 * Update a deck
 * @param deckId Deck ID
 * @param name New deck name
 * @param description New deck description
 * @param format New deck format
 * @returns Promise with the updated deck
 */
export async function updateDeck(
  deckId: string,
  name: string,
  description?: string,
  format?: DeckFormat
): Promise<Deck> {
  try {
    const data = {
      name,
      description: description || "",
      format: format || undefined
    };
    
    const record = await pb.collection(COLLECTIONS.DECKS).update(deckId, data);
    return record as unknown as Deck;
  } catch (error) {
    const appError = createAppError(error, 'Update deck');
    logError(appError, 'updateDeck');
    throw appError;
  }
}

/**
 * Delete a deck
 * @param deckId Deck ID to delete
 * @returns Promise that resolves when the deck is deleted
 */
export async function deleteDeck(deckId: string): Promise<void> {
  try {
    await pb.collection(COLLECTIONS.DECKS).delete(deckId);
  } catch (error) {
    const appError = createAppError(error, 'Delete deck');
    logError(appError, 'deleteDeck');
    throw appError;
  }
}

/**
 * Get all cards in a deck
 * @param deckId Deck ID
 * @returns Promise with array of deck cards with expanded card details
 */
export async function getDeckCards(deckId: string): Promise<DeckCard[]> {
  try {
    const result = await pb.collection(COLLECTIONS.DECK_CARDS).getList(1, 500, {
      sort: 'type,created',
      filter: `deck.id = "${deckId}"`,
      expand: 'card,collection'
    });

    return result.items.map(item => ({
      ...item,
      expand: {
        card: createCardFromRecord(item.expand?.card),
        collection: item.expand?.collection
      }
    })) as unknown as DeckCard[];
  } catch (error) {
    const appError = createAppError(error, 'Get deck cards');
    logError(appError, 'getDeckCards');
    throw appError;
  }
}

/**
 * Add a card to a deck
 * @param deckId Deck ID
 * @param cardId Card ID
 * @param quantity Number of copies
 * @param type Type of card (library, commander, etc.)
 * @param collectionId Optional collection entry ID
 * @returns Promise with the created deck card entry
 */
export async function addCardToDeck(
  deckId: string,
  cardId: string,
  quantity: number,
  type: DeckCardType = 'library',
  collectionId?: string
): Promise<DeckCard> {
  try {
    const data = {
      deck: deckId,
      card: cardId,
      quantity,
      type,
      collection: collectionId || undefined
    };
    
    const record = await pb.collection(COLLECTIONS.DECK_CARDS).create(data);
    return record as unknown as DeckCard;
  } catch (error) {
    const appError = createAppError(error, 'Add card to deck');
    logError(appError, 'addCardToDeck');
    throw appError;
  }
}

/**
 * Update a deck card
 * @param deckCardId Deck card ID
 * @param quantity New quantity
 * @param type New card type
 * @returns Promise with the updated deck card
 */
export async function updateDeckCard(
  deckCardId: string,
  quantity: number,
  type: DeckCardType
): Promise<DeckCard> {
  try {
    const data = { quantity, type };
    const record = await pb.collection(COLLECTIONS.DECK_CARDS).update(deckCardId, data);
    return record as unknown as DeckCard;
  } catch (error) {
    const appError = createAppError(error, 'Update deck card');
    logError(appError, 'updateDeckCard');
    throw appError;
  }
}

/**
 * Remove a card from a deck
 * @param deckCardId Deck card entry ID to remove
 * @returns Promise that resolves when the card is removed
 */
export async function removeCardFromDeck(deckCardId: string): Promise<void> {
  try {
    await pb.collection(COLLECTIONS.DECK_CARDS).delete(deckCardId);
  } catch (error) {
    const appError = createAppError(error, 'Remove card from deck');
    logError(appError, 'removeCardFromDeck');
    throw appError;
  }
}

/**
 * Fetch EDHREC recommendations for a deck
 * @param deckCards Array of deck cards
 * @param commanders Array of commander names
 * @param excludeLands Whether to exclude land recommendations
 * @param offset Offset for pagination
 * @returns Promise with EDHREC recommendations
 */
export async function getEDHRECRecommendations(
  deckCards: DeckCard[],
  commanders: string[],
  excludeLands: boolean = false,
  filterToCollection: boolean = false,
  page: number = 0,
  pageLimit: number = 20
): Promise<Card[]> {
  try {
    // Format deck cards for EDHREC API
    const cardsInDeck = deckCards
      .filter(deckCard => deckCard.expand?.card?.name) // Ensure card names are available
      .map(deckCard => 
        `${deckCard.quantity} ${deckCard.expand?.card?.name}`
      );

    const request: EDHRECRequest = {
      cards: cardsInDeck,
      commanders,
      name: "",
      options: {
        excludeLands,
        offset: page * pageLimit,
      }
    };

    const response = await fetch('https://edhrec.com/api/recs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`EDHREC API error: ${response.statusText}`);
    }

    const data: EDHRECResponse = await response.json();

    if (!data || !data.inRecs || !Array.isArray(data.inRecs)) {
      console.warn('Invalid EDHREC response format', data);
      return [];
    }
    
    let cards = [];
    if (filterToCollection) {
      const collection = await pb.collection(COLLECTIONS.COLLECTIONS).getList(0, 20, {
        filter: data.inRecs.map(rec => `card.name = "${rec.name}"`).join(' || '),
        expand: 'card',
        perPage: data.inRecs.length
      });
      cards = collection.items
        .filter(item => item.expand?.card)
        .map(item => item.expand?.card);
    } else {
      cards = (await pb.collection(COLLECTIONS.CARDS).getList(0, 20, {
        filter: data.inRecs.map(rec => `name = "${rec.name}"`).join(' || '),
      })).items;
    }
    

    return cards.map(item => createCardFromRecord(item));
  } catch (error) {
    const appError = createAppError(
      error instanceof Error ? error.message : 'Failed to fetch EDHREC recommendations',
      'EDHREC_ERROR'
    );
    logError(appError, 'getEDHRECRecommendations');
    throw appError;
  }
}
