/**
 * Interface for a Magic: The Gathering card
 */
export interface Card {
  id: string;
  scryfall_id: string;
  oracle_text?: string;
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
  collection?: CollectionEntry;
}

/**
 * Enum for card condition
 */
export enum CardCondition {
  MINT = 'Mint',
  NEAR_MINT = 'Near Mint',
  LIGHTLY_PLAYED = 'Lightly Played',
  MODERATELY_PLAYED = 'Moderately Played',
  HEAVILY_PLAYED = 'Heavily Played',
  DAMAGED = 'Damaged'
}

/**
 * Interface for a collection entry
 */
export interface CollectionEntry {
  id: string;
  quantity: number;
  condition: CardCondition;
  foil: boolean;
  acquired_date?: string;
  notes?: string;
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
  sort?: SortField;
  sortDirection?: SortDirection;
  searchQuery?: string;
}

/**
 * Sort options for collection view
 */
export type SortField = 'name' | 'set' | 'rarity' | 'price' | 'acquired_date' | 'quantity';
export type SortDirection = 'asc' | 'desc';