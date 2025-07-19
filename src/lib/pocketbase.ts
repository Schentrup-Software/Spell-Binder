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

export enum CardCondition {
  NEAR_MINT = 'NM',
  LIGHTLY_PLAYED = 'LP',
  MODERATELY_PLAYED = 'MP',
  HEAVILY_PLAYED = 'HP',
  DAMAGED = 'DMG'
}

// Collection names
export const COLLECTIONS = {
  CARDS: 'cards',
  COLLECTIONS: 'collections',
  SYNC_STATUS: 'sync_status'
} as const