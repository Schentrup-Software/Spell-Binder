/**
 * Interface for a Magic: The Gathering card
 */
export interface Card {
  id: string;
  scryfall_id: string;
  name: string;
  set_code: string;
  set_name: string;
  rarity: string;
  mana_cost?: string;
  type_line: string;
  colors: string[];
  image_uri?: string;
  image_uri_small?: string;
  image_file?: string;
  price_usd?: number;
  last_updated?: string;
}

/**
 * Enum for card condition
 */
export enum CardCondition {
  NEAR_MINT = 'NM',
  LIGHTLY_PLAYED = 'LP',
  MODERATELY_PLAYED = 'MP',
  HEAVILY_PLAYED = 'HP',
  DAMAGED = 'DMG'
}

/**
 * Interface for a collection entry
 */
export interface CollectionEntry {
  id: string;
  user_id: string;
  card_id: string;
  quantity: number;
  condition: CardCondition;
  foil: boolean;
  acquired_date?: string;
  notes?: string;
  card?: Card;
}

/**
 * Interface for search filters
 */
export interface CardFilters {
  set?: string;
  color?: string[];
  type?: string;
  rarity?: string;
  foil?: boolean;
  condition?: CardCondition;
}

/**
 * Sort options for collection view
 */
export type SortField = 'name' | 'set' | 'rarity' | 'price' | 'acquired_date' | 'quantity';
export type SortDirection = 'asc' | 'desc';