import PocketBase from 'pocketbase'

// PocketBase client configuration
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090')

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false)

export default pb

// Type definitions for our collections
export interface Card {
  id: string
  name: string
  set_code: string
  set_name: string
  rarity: string
  mana_cost: string
  type_line: string
  colors: string[]
  image_file?: string
  price_usd?: number
  last_updated: string
}

export interface CollectionEntry {
  id: string
  card_id: string
  quantity: number
  condition: CardCondition
  foil: boolean
  acquired_date: string
  notes?: string,
  expand?: {
    card: Card
  }
}

export interface SyncStatus {
  id: string
  data_type: string
  last_sync: string
  status: 'success' | 'failed' | 'in_progress'
  records_processed: number
  error_message?: string
}

export interface Deck {
  id: string
  user: string
  name: string
  description?: string
  format?: DeckFormat
  created: string
  updated: string
}

export interface DeckCard {
  id: string
  deck: string
  card: string
  collection?: string
  type: DeckCardType
  quantity: number
  created: string
  updated: string
}

export enum CardCondition {
  MINT = 'Mint',
  NEAR_MINT = 'Near Mint',
  LIGHTLY_PLAYED = 'Lightly Played',
  MODERATELY_PLAYED = 'Moderately Played',
  HEAVILY_PLAYED = 'Heavily Played',
  DAMAGED = 'Damaged'
}

export type DeckFormat = 
  | 'alchemy'
  | 'brawl'
  | 'commander'
  | 'duel'
  | 'future'
  | 'gladiator'
  | 'historic'
  | 'legacy'
  | 'modern'
  | 'oathbreaker'
  | 'oldschool'
  | 'pauper'
  | 'paupercommander'
  | 'penny'
  | 'pioneer'
  | 'predh'
  | 'premodern'
  | 'standard'
  | 'standardbrawl'
  | 'timeless'
  | 'vintage'

export type DeckCardType = 'library' | 'commander' | 'co-commander'

// Collection names
export const COLLECTIONS = {
  CARDS: 'cards',
  COLLECTIONS: 'collections',
  SYNC_STATUS: 'sync_status',
  CARD_SETS: 'card_sets',
  ALL_CARD_SETS: 'all_card_sets',
  CARD_COLLECTION: 'card_collection',
  USERS: 'users',
  DECKS: 'decks',
  DECK_CARDS: 'deck_cards'
} as const