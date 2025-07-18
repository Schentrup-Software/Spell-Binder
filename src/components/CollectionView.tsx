import { useState, useEffect, useCallback } from 'react'
import PageHeader from './PageHeader'
import { Link, useSearchParams } from 'react-router-dom'
import { getUserCollection, updateCollectionEntry, removeFromCollection } from '../lib/api'
import { CollectionEntry, CardCondition, CardFilters, SortField, SortDirection } from '../lib/types'

import SkeletonLoader from './SkeletonLoader'
import CardImage from './CardImage'
import Modal from './Modal'
import ErrorBoundary from './ErrorBoundary'
import VirtualScrollList from './VirtualScrollList'
import MemoizedCollectionCard from './MemoizedCollectionCard'
import BulkImportModal from './BulkImportModal'
import BulkExportModal from './BulkExportModal'

import FilterBar from './FilterBar'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'
import { BulkImportResult } from '../lib/bulkOperations'
// Custom debounce implementation
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: number | undefined;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  }) as T;
};

export default function CollectionView() {
  // URL search params for filter persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Collection state
  const [collection, setCollection] = useState<CollectionEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  // Hooks for error handling and loading states
  const { handleError, handleSuccess } = useErrorHandler({ context: 'Collection' })
  const { isLoading, withLoading } = useLoadingState()

  // Modal state
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showBulkExportModal, setShowBulkExportModal] = useState(false)

  // Form state for editing
  const [editQuantity, setEditQuantity] = useState(1)
  const [editCondition, setEditCondition] = useState<CardCondition>(CardCondition.NEAR_MINT)
  const [editFoil, setEditFoil] = useState(false)
  const [editNotes, setEditNotes] = useState('')

  // Filter and sort state
  const [filters, setFilters] = useState<CardFilters>({})
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [numberOfFailures, setNumberOfFailures] = useState(0);



  // Parse filters from URL on component mount
  useEffect(() => {
    const set = searchParams.get('set');
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');
    const colors = searchParams.getAll('color');
    const condition = searchParams.get('condition') as CardCondition | null;
    const foil = searchParams.get('foil') === 'true';
    const sort = searchParams.get('sort') as SortField || 'name';
    const direction = searchParams.get('direction') as SortDirection || 'asc';
    const query = searchParams.get('q') || '';

    // Set initial filter state from URL
    setFilters({
      set: set || undefined,
      type: type || undefined,
      rarity: rarity || undefined,
      color: colors.length > 0 ? colors : undefined,
      condition: condition || undefined,
      foil: foil || undefined
    });

    setSortField(sort);
    setSortDirection(direction);
    setSearchQuery(query);
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = useCallback((
    newFilters: CardFilters,
    newSortField: SortField,
    newSortDirection: SortDirection,
    newSearchQuery: string
  ) => {
    const params = new URLSearchParams();

    // Add filters to URL
    if (newFilters.set) params.set('set', newFilters.set);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.rarity) params.set('rarity', newFilters.rarity);
    if (newFilters.condition) params.set('condition', newFilters.condition);
    if (newFilters.foil) params.set('foil', 'true');
    if (newFilters.color && newFilters.color.length > 0) {
      newFilters.color.forEach(color => params.append('color', color));
    }

    // Add sort and search to URL
    params.set('sort', newSortField);
    params.set('direction', newSortDirection);
    if (newSearchQuery) params.set('q', newSearchQuery);

    setSearchParams(params);
  }, [setSearchParams]);

  // Debounced version of updateUrlParams
  const debouncedUpdateUrlParams = useCallback(
    debounce(updateUrlParams, 300),
    [updateUrlParams]
  );

  // Load collection with filters
  const loadCollection = useCallback(async () => {
    if (numberOfFailures >= 3) {
      setError('Failed to load your collection after multiple attempts. Please try again later.');
      return;
    }

    try {
      const data = await withLoading('collection', () =>
        getUserCollection(filters, sortField, sortDirection, searchQuery)
      );
      setCollection(data);
      setError(null);
      setNumberOfFailures(0); // Reset failures on successful load
    } catch (err) {
      handleError(err, 'Failed to load collection');
      setError('Failed to load your collection. Please try again.');
      setNumberOfFailures(prev => prev + 1);
    }
  }, [filters, sortField, sortDirection, searchQuery, withLoading, handleError, numberOfFailures]);

  // Load collection when filters or sort changes
  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Handle filter changes
  const handleFilterChange = (newFilters: CardFilters) => {
    setFilters(newFilters);
    debouncedUpdateUrlParams(newFilters, sortField, sortDirection, searchQuery);
  };

  // Handle sort changes
  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    debouncedUpdateUrlParams(filters, field, direction, searchQuery);
  };

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedUpdateUrlParams(filters, sortField, sortDirection, query);
  };

  // Handle opening the edit modal
  const handleEditClick = (entry: CollectionEntry) => {
    setSelectedEntry(entry);
    setEditQuantity(entry.quantity);
    setEditCondition(entry.condition);
    setEditFoil(entry.foil);
    setEditNotes(entry.notes || '');
    setShowEditModal(true);
  };

  // Handle opening the delete confirmation modal
  const handleDeleteClick = (entry: CollectionEntry) => {
    setSelectedEntry(entry);
    setShowDeleteModal(true);
  };

  // Handle saving edited entry
  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    try {
      await updateCollectionEntry(
        selectedEntry.id,
        editQuantity,
        editCondition,
        editFoil,
        editNotes
      );

      // Update the collection in state
      setCollection(prevCollection =>
        prevCollection.map(entry =>
          entry.id === selectedEntry.id
            ? {
              ...entry,
              quantity: editQuantity,
              condition: editCondition,
              foil: editFoil,
              notes: editNotes
            }
            : entry
        )
      );

      // Show success message
      handleSuccess(`Updated ${selectedEntry.card?.name || 'card'} in your collection`);

      // Close the modal
      setShowEditModal(false);
    } catch (err) {
      handleError(err, 'Failed to update card');
    }
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    if (!selectedEntry) return;

    try {
      await removeFromCollection(selectedEntry.id);

      // Show success message
      handleSuccess(`Removed ${selectedEntry.card?.name || 'card'} from your collection`);

      // Remove the entry from state
      setCollection(prevCollection =>
        prevCollection.filter(entry => entry.id !== selectedEntry.id)
      );

      // Close the modal
      setShowDeleteModal(false);
    } catch (err) {
      handleError(err, 'Failed to remove card');
    }
  };

  // Handle bulk import completion
  const handleBulkImportComplete = (result: BulkImportResult) => {
    if (result.successful > 0) {
      // Reload collection to show imported cards
      loadCollection();
    }
  };

  // Memoized callbacks for collection card actions
  const memoizedHandleEditClick = useCallback((entry: CollectionEntry) => {
    handleEditClick(entry);
  }, []);

  const memoizedHandleDeleteClick = useCallback((entry: CollectionEntry) => {
    handleDeleteClick(entry);
  }, []);

  // Determine if we should use virtual scrolling (for collections > 50 items)
  const useVirtualScrolling = collection.length > 50;
  const CARD_HEIGHT = 280; // Approximate height of each card in pixels
  const CONTAINER_HEIGHT = 600; // Height of the virtual scroll container

  // Render a collection entry card
  // @ts-ignore - Keeping for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderCollectionCard = (entry: CollectionEntry) => {
    if (!entry.card) return null;

    // CardImage component will handle all image source logic internally

    // Format price with dollar sign and two decimal places
    const formattedPrice = entry.card.price_usd
      ? `$${entry.card.price_usd.toFixed(2)}`
      : 'N/A';

    // Format acquisition date
    const formattedDate = entry.acquired_date
      ? new Date(entry.acquired_date).toLocaleDateString()
      : 'Unknown';

    return (
      <div key={entry.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 active:scale-95 active:shadow-sm touch-manipulation">
        <div className="flex flex-col sm:flex-row">
          {/* Card image */}
          <div className="sm:w-36 flex-shrink-0">
            <CardImage
              card={entry.card}
              cardName={entry.card.name}
              size="medium"
              quality="medium"
              className="w-full h-48 sm:h-48 object-contain"
            />
          </div>

          {/* Card details */}
          <div className="p-3 md:p-4 flex-grow">
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
              {entry.card.name}
            </h3>

            <div className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-1">
              {entry.card.type_line}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-1">
              <span className="text-xs md:text-sm">
                {entry.card.set_name} ({entry.card.set_code})
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {entry.card.rarity}
              </span>
            </div>

            {/* Collection details - Mobile optimized grid */}
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs md:text-sm">
              <div>
                <span className="font-medium text-gray-700">Qty:</span>
                <span className="ml-1">{entry.quantity}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Condition:</span>
                <span className="ml-1">{entry.condition}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Price:</span>
                <span className="ml-1">{formattedPrice}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Added:</span>
                <span className="ml-1">{formattedDate}</span>
              </div>

              {entry.foil && (
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ✨ Foil
                  </span>
                </div>
              )}

              {entry.notes && (
                <div className="col-span-2 mt-1">
                  <span className="font-medium text-gray-700">Notes:</span>
                  <span className="ml-1 text-gray-600 line-clamp-2">{entry.notes}</span>
                </div>
              )}
            </div>

            {/* Action buttons - Mobile optimized */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleEditClick(entry)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(entry)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 active:bg-red-800 transition-colors touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="My Collection"
          description="Browse and manage your Magic: The Gathering cards"
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Import
                </button>
                <button
                  onClick={() => setShowBulkExportModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export
                </button>
              </div>
              <Link
                to="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Cards
              </Link>
            </div>
          }
        />

        {/* Filter bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          isCollectionView={true}
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
              <div className="text-sm text-gray-500">
                {collection.length > 0
                  ? `${collection.length} ${collection.length === 1 ? 'card' : 'cards'} in your collection`
                  : 'No cards match your current filters'}
              </div>
            </div>
          </div>

          {isLoading('collection') ? (
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-500">
                Loading your collection...
              </div>
              <SkeletonLoader variant="card" count={3} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">{error}</div>
              <p className="text-gray-500">
                Please try refreshing the page.
              </p>
            </div>
          ) : collection.length > 0 ? (
            <div className="p-4">
              {useVirtualScrolling ? (
                <VirtualScrollList
                  items={collection}
                  itemHeight={CARD_HEIGHT}
                  containerHeight={CONTAINER_HEIGHT}
                  renderItem={(entry) => (
                    <MemoizedCollectionCard
                      key={entry.id}
                      entry={entry}
                      onEdit={memoizedHandleEditClick}
                      onDelete={memoizedHandleDeleteClick}
                    />
                  )}
                  className="border border-gray-200 rounded-lg"
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {collection.map(entry => (
                    <MemoizedCollectionCard
                      key={entry.id}
                      entry={entry}
                      onEdit={memoizedHandleEditClick}
                      onDelete={memoizedHandleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              {Object.keys(filters).length > 0 || searchQuery ? (
                <>
                  <p className="text-gray-500 text-lg mb-4">
                    No cards match your current filters.
                  </p>
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchQuery('');
                      setSearchParams({});
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-lg mb-4">
                    Your collection is empty. Start by adding some cards!
                  </p>
                  <Link
                    to="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search for Cards
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit card modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit ${selectedEntry?.card?.name || 'Card'}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Quantity */}
            <div>
              <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="edit-quantity"
                min="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="edit-condition" className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                id="edit-condition"
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value as CardCondition)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={CardCondition.NEAR_MINT}>Near Mint (NM)</option>
                <option value={CardCondition.LIGHTLY_PLAYED}>Lightly Played (LP)</option>
                <option value={CardCondition.MODERATELY_PLAYED}>Moderately Played (MP)</option>
                <option value={CardCondition.HEAVILY_PLAYED}>Heavily Played (HP)</option>
                <option value={CardCondition.DAMAGED}>Damaged (DMG)</option>
              </select>
            </div>

            {/* Foil */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-foil"
                  checked={editFoil}
                  onChange={(e) => setEditFoil(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-foil" className="ml-2 block text-sm text-gray-700">
                  Foil
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete confirmation modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Remove Card"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove {selectedEntry?.card?.name} from your collection?
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        </Modal>

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onImportComplete={handleBulkImportComplete}
        />

        {/* Bulk Export Modal */}
        <BulkExportModal
          isOpen={showBulkExportModal}
          onClose={() => setShowBulkExportModal(false)}
        />
      </div>
    </ErrorBoundary>
  );
}