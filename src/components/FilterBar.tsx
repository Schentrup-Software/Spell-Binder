import { useState, useEffect } from 'react';
import { CardFilters, CardCondition, SortField, SortDirection } from '../lib/types';
import { getCardSets } from '../lib/api';

interface FilterBarProps {
  filters: CardFilters;
  onFilterChange: (filters: CardFilters) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isCollectionView?: boolean;
}

export default function FilterBar({
  filters,
  onFilterChange,
  sortField = 'name',
  sortDirection = 'asc',
  onSortChange,
  searchQuery = '',
  onSearchChange,
  isCollectionView = false
}: FilterBarProps) {
  const [sets, setSets] = useState<{ code: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Available rarities
  const rarities = [
    { value: 'common', label: 'Common' },
    { value: 'uncommon', label: 'Uncommon' },
    { value: 'rare', label: 'Rare' },
    { value: 'mythic', label: 'Mythic' },
    { value: 'special', label: 'Special' },
    { value: 'bonus', label: 'Bonus' }
  ];

  // Available colors
  const colors = [
    { value: 'W', label: 'White', bgColor: 'bg-yellow-100' },
    { value: 'U', label: 'Blue', bgColor: 'bg-blue-100' },
    { value: 'B', label: 'Black', bgColor: 'bg-gray-700 text-white' },
    { value: 'R', label: 'Red', bgColor: 'bg-red-100' },
    { value: 'G', label: 'Green', bgColor: 'bg-green-100' },
    { value: 'C', label: 'Colorless', bgColor: 'bg-gray-200' }
  ];

  // Available conditions
  const conditions = [
    { value: CardCondition.NEAR_MINT, label: 'Near Mint (NM)' },
    { value: CardCondition.LIGHTLY_PLAYED, label: 'Lightly Played (LP)' },
    { value: CardCondition.MODERATELY_PLAYED, label: 'Moderately Played (MP)' },
    { value: CardCondition.HEAVILY_PLAYED, label: 'Heavily Played (HP)' },
    { value: CardCondition.DAMAGED, label: 'Damaged (DMG)' }
  ];

  // Available sort options
  const sortOptions = [
    { value: 'name', label: 'Card Name' },
    { value: 'set', label: 'Set Name' },
    { value: 'rarity', label: 'Rarity' },
    { value: 'price', label: 'Price' }
  ];

  // Add collection-specific sort options
  const collectionSortOptions = [
    { value: 'acquired_date', label: 'Date Acquired' },
    { value: 'quantity', label: 'Quantity' }
  ];

  const types = [
    'Land',
    'Creature',
    'Artifact',
    'Enchantment',
    'Planeswalker',
    'Battle',
    'Instant',
    'Sorcery',
    'Kindred'
  ];

  // Load filter options on component mount
  useEffect(() => {
    async function loadFilterOptions() {
      setIsLoading(true);
      try {
        const setsData = await getCardSets();

        setSets(setsData);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFilterOptions();
  }, []);

  // Update local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle set change
  const handleSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      set: e.target.value || undefined
    });
  };

  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      type: e.target.value || undefined
    });
  };

  // Handle rarity change
  const handleRarityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      rarity: e.target.value || undefined
    });
  };

  // Handle color toggle
  const handleColorToggle = (color: string) => {
    const currentColors = filters.color || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];

    onFilterChange({
      ...filters,
      color: newColors.length > 0 ? newColors : undefined
    });
  };

  // Handle condition change
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      condition: e.target.value as CardCondition || undefined
    });
  };

  // Handle foil toggle
  const handleFoilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      foil: e.target.checked || undefined
    });
  };

  // Handle sort field change
  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSortChange) {
      onSortChange(e.target.value as SortField, sortDirection);
    }
  };

  // Handle sort direction change
  const handleSortDirectionChange = () => {
    if (onSortChange) {
      onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearchQuery);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onFilterChange({});
    if (onSearchChange) {
      onSearchChange('');
    }
    setLocalSearchQuery('');
  };

  // Toggle advanced filters
  const toggleAdvancedFilters = () => {
    setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen);
  };

  // Check if any filters are active
  const hasActiveFilters = !!(
    filters.set ||
    filters.type ||
    filters.rarity ||
    filters.color?.length ||
    filters.condition ||
    filters.foil ||
    searchQuery
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">Filters</h3>
        <div className="flex space-x-2">
          <button
            onClick={toggleAdvancedFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isAdvancedFiltersOpen ? 'Hide advanced filters' : 'Show advanced filters'}
          </button>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={!hasActiveFilters}
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Search input */}
      {onSearchChange && (
        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              value={localSearchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search in collection..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Basic filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Set filter */}
        <div>
          <label htmlFor="set-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Set
          </label>
          <select
            id="set-filter"
            value={filters.set || ''}
            onChange={handleSetChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">All Sets</option>
            {sets.map(set => (
              <option key={set.code} value={set.code}>
                {set.name} ({set.code})
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="type-filter"
            value={filters.type || ''}
            onChange={handleTypeChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity filter */}
        <div>
          <label htmlFor="rarity-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Rarity
          </label>
          <select
            id="rarity-filter"
            value={filters.rarity || ''}
            onChange={handleRarityChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Rarities</option>
            {rarities.map(rarity => (
              <option key={rarity.value} value={rarity.value}>
                {rarity.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort options */}
        {onSortChange && (
          <div>
            <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex">
              <select
                id="sort-filter"
                value={sortField}
                onChange={handleSortFieldChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                {isCollectionView && collectionSortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSortDirectionChange}
                className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md bg-white hover:bg-gray-50"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Color filter */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Colors
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map(color => {
            const isSelected = (filters.color || []).includes(color.value);
            return (
              <button
                key={color.value}
                onClick={() => handleColorToggle(color.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${isSelected
                  ? `${color.bgColor} border-2 border-blue-500`
                  : `${color.bgColor} border border-gray-300`
                  }`}
                title={color.label}
              >
                {color.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced filters */}
      {isAdvancedFiltersOpen && isCollectionView && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condition filter */}
            <div>
              <label htmlFor="condition-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                id="condition-filter"
                value={filters.condition || ''}
                onChange={handleConditionChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Condition</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Foil filter */}
            <div className="flex items-center h-full pt-6">
              <input
                type="checkbox"
                id="foil-filter"
                checked={!!filters.foil}
                onChange={handleFoilChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="foil-filter" className="ml-2 block text-sm text-gray-700">
                Foil cards only
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}