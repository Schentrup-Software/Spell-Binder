import { CardCondition } from './types';
import { addCardToCollection, getUserCollection, searchCards } from './api';
import { createAppError, logError } from './errorHandling';

// Interface for bulk import data
export interface BulkImportEntry {
  cardName: string;
  setCode?: string;
  quantity: number;
  condition: CardCondition;
  foil: boolean;
  notes?: string;
}

// Interface for bulk import result
export interface BulkImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    entry: BulkImportEntry;
    error: string;
  }>;
}

// Interface for export data
export interface ExportData {
  exportDate: string;
  totalCards: number;
  uniqueCards: number;
  collection: Array<{
    cardName: string;
    setName: string;
    setCode: string;
    quantity: number;
    condition: CardCondition;
    foil: boolean;
    acquiredDate?: string;
    notes?: string;
    estimatedValue?: number;
  }>;
}

/**
 * Parse CSV content into bulk import entries
 * @param csvContent The CSV content as a string
 * @returns Array of bulk import entries
 */
export function parseBulkImportCSV(csvContent: string): BulkImportEntry[] {
  const lines = csvContent.trim().split('\n');
  const entries: BulkImportEntry[] = [];
  
  if (lines.length === 0) return entries;
  
  // Check if first line is a header by looking for common header terms
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('card') || firstLine.includes('quantity');
  
  let columnMapping: { [key: string]: number } = {};
  let startIndex = 0;
  
  if (hasHeader) {
    // Parse header to create column mapping
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    columnMapping = createColumnMapping(headers);
    startIndex = 1;
  } else {
    // Use default column order if no header
    columnMapping = {
      cardName: 0,
      setCode: 1,
      quantity: 2,
      condition: 3,
      foil: 4,
      notes: 5
    };
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < 1) {
        console.warn(`Skipping line ${i + 1}: no data`);
        continue;
      }
      
      const entry: BulkImportEntry = {
        cardName: getColumnValue(values, columnMapping.cardName, '').trim(),
        setCode: getColumnValue(values, columnMapping.setCode, '').trim() || undefined,
        quantity: parseInt(getColumnValue(values, columnMapping.quantity, '1')) || 1,
        condition: (getColumnValue(values, columnMapping.condition, CardCondition.NEAR_MINT).trim() as CardCondition) || CardCondition.NEAR_MINT,
        foil: ['true', '1', 'yes', 'y'].includes(getColumnValue(values, columnMapping.foil, 'false').trim().toLowerCase()),
        notes: getColumnValue(values, columnMapping.notes, '').trim() || undefined
      };
      
      if (entry.cardName) {
        entries.push(entry);
      } else {
        console.warn(`Skipping line ${i + 1}: missing card name`);
      }
    } catch (error) {
      console.warn(`Error parsing line ${i + 1}:`, error);
    }
  }
  
  return entries;
}

/**
 * Create column mapping from headers
 * @param headers Array of header strings (lowercase)
 * @returns Mapping object with column indices
 */
function createColumnMapping(headers: string[]): { [key: string]: number } {
  const mapping: { [key: string]: number } = {
    cardName: -1,
    setCode: -1,
    quantity: -1,
    condition: -1,
    foil: -1,
    notes: -1
  };
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    
    // Card name variations
    if (header.includes('card') && header.includes('name') || 
        header === 'name' || 
        header === 'card') {
      mapping.cardName = i;
    }
    // Set code variations
    else if (header.includes('set') && (header.includes('code') || header.includes('id')) ||
             header === 'set' ||
             header === 'setcode') {
      mapping.setCode = i;
    }
    // Quantity variations
    else if (header === 'quantity' || 
             header === 'qty' || 
             header === 'count' ||
             header === 'amount') {
      mapping.quantity = i;
    }
    // Condition variations
    else if (header === 'condition' || 
             header === 'cond' ||
             header === 'grade') {
      mapping.condition = i;
    }
    // Foil variations
    else if (header === 'foil' || 
             header === 'premium' ||
             header === 'shiny') {
      mapping.foil = i;
    }
    // Notes variations
    else if (header === 'notes' || 
             header === 'note' ||
             header === 'comment' ||
             header === 'comments' ||
             header === 'description') {
      mapping.notes = i;
    }
  }
  
  return mapping;
}

/**
 * Get value from array at given index, with fallback
 * @param values Array of values
 * @param index Column index (-1 means not found)
 * @param defaultValue Default value if index is invalid
 * @returns Value or default
 */
function getColumnValue(values: string[], index: number, defaultValue: string): string {
  if (index === -1 || index >= values.length) {
    return defaultValue;
  }
  return values[index] || defaultValue;
}

/**
 * Parse a single CSV line handling quoted values
 * @param line The CSV line to parse
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Import cards in bulk from parsed entries
 * @param entries Array of bulk import entries
 * @param onProgress Optional progress callback
 * @returns Promise with import result
 */
export async function importCardsInBulk(
  entries: BulkImportEntry[],
  onProgress?: (processed: number, total: number) => void
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    try {
      // Search for the card
      const searchResults = await searchCards(entry.cardName, {
        set: entry.setCode
      }, 1);
      
      if (searchResults.length === 0) {
        result.failed++;
        result.errors.push({
          entry,
          error: `Card "${entry.cardName}" not found${entry.setCode ? ` in set ${entry.setCode}` : ''}`
        });
        continue;
      }
      
      const card = searchResults[0];
      
      // Add to collection
      await addCardToCollection(
        card.id,
        entry.quantity,
        entry.condition,
        entry.foil,
        entry.notes
      );
      
      result.successful++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        entry,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      logError(createAppError(error, 'Bulk import'), 'importCardsInBulk');
    }
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress(i + 1, entries.length);
    }
    
    // Add small delay to prevent overwhelming the API
    if (i < entries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return result;
}

/**
 * Export collection data to various formats
 * @param format The export format ('csv' | 'json')
 * @returns Promise with export data as string
 */
export async function exportCollection(format: 'csv' | 'json' = 'csv'): Promise<string> {
  try {
    const collection = await getUserCollection();
    
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      totalCards: collection.reduce((sum, card) => sum + (card.collection?.quantity || 0), 0),
      uniqueCards: collection.length,
      collection: collection.map(card => ({
        cardName: card.name || 'Unknown',
        setName: card.set_name || 'Unknown',
        setCode: card.set_code || 'Unknown',
        quantity: card.collection?.quantity || 0,
        condition: card.collection?.condition || CardCondition.NEAR_MINT,
        foil: card.collection?.foil || false,
        acquiredDate: card.collection?.acquired_date,
        notes: card.collection?.notes,
        estimatedValue: card.price_usd
      }))
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      return exportToCSV(exportData);
    }
  } catch (error) {
    const appError = createAppError(error, 'Export collection');
    logError(appError, 'exportCollection');
    throw appError;
  }
}

/**
 * Convert export data to CSV format
 * @param data The export data
 * @returns CSV string
 */
function exportToCSV(data: ExportData): string {
  const headers = [
    'Card Name',
    'Set Name',
    'Set Code',
    'Quantity',
    'Condition',
    'Foil',
    'Acquired Date',
    'Notes',
    'Estimated Value'
  ];
  
  const rows = data.collection.map(entry => [
    escapeCSVValue(entry.cardName),
    escapeCSVValue(entry.setName),
    escapeCSVValue(entry.setCode),
    entry.quantity.toString(),
    entry.condition,
    entry.foil ? 'true' : 'false',
    entry.acquiredDate || '',
    escapeCSVValue(entry.notes || ''),
    entry.estimatedValue?.toFixed(2) || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Escape CSV values that contain commas, quotes, or newlines
 * @param value The value to escape
 * @returns Escaped CSV value
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download data as a file
 * @param data The data to download
 * @param filename The filename
 * @param mimeType The MIME type
 */
export function downloadFile(data: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate sample CSV template for bulk import
 * @returns Sample CSV content
 */
export function generateImportTemplate(): string {
  const headers = [
    'Card Name',      // Required: cardName
    'Set Code',       // Optional: setCode
    'Quantity',       // Optional: quantity (default: 1)
    'Condition',      // Optional: condition (default: Near Mint)
    'Foil',          // Optional: foil (default: false)
    'Notes'          // Optional: notes
  ];
  
  const sampleRows = [
    ['Lightning Bolt', 'M21', '4', 'Near Mint', 'false', 'Great burn spell'],
    ['Black Lotus', 'LEA', '1', 'Lightly Played', 'false', 'Power 9 card'],
    ['Jace, the Mind Sculptor', 'WWK', '2', 'Near Mint', 'true', 'Foil planeswalker']
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');
  
  return csvContent;
}