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
  
  // Skip header row if it exists
  const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < 3) {
        console.warn(`Skipping line ${i + 1}: insufficient columns`);
        continue;
      }
      
      const entry: BulkImportEntry = {
        cardName: values[0]?.trim() || '',
        setCode: values[1]?.trim() || undefined,
        quantity: parseInt(values[2]?.trim() || '1') || 1,
        condition: (values[3]?.trim() as CardCondition) || CardCondition.NEAR_MINT,
        foil: values[4]?.trim().toLowerCase() === 'true' || values[4]?.trim() === '1',
        notes: values[5]?.trim() || undefined
      };
      
      if (entry.cardName) {
        entries.push(entry);
      }
    } catch (error) {
      console.warn(`Error parsing line ${i + 1}:`, error);
    }
  }
  
  return entries;
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
      totalCards: collection.reduce((sum, entry) => sum + entry.quantity, 0),
      uniqueCards: collection.length,
      collection: collection.map(entry => ({
        cardName: entry.card?.name || 'Unknown',
        setName: entry.card?.set_name || 'Unknown',
        setCode: entry.card?.set_code || 'Unknown',
        quantity: entry.quantity,
        condition: entry.condition,
        foil: entry.foil,
        acquiredDate: entry.acquired_date,
        notes: entry.notes,
        estimatedValue: entry.card?.price_usd
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
    'Card Name',
    'Set Code',
    'Quantity',
    'Condition',
    'Foil',
    'Notes'
  ];
  
  const sampleRows = [
    ['Lightning Bolt', 'M21', '4', 'NM', 'false', 'Great burn spell'],
    ['Black Lotus', 'LEA', '1', 'LP', 'false', 'Power 9 card'],
    ['Jace, the Mind Sculptor', 'WWK', '2', 'NM', 'true', 'Foil planeswalker']
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');
  
  return csvContent;
}