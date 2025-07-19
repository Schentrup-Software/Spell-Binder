import { useState, useEffect } from 'react'
import PageHeader from './PageHeader'
import { Link } from 'react-router-dom'
import pb, { COLLECTIONS } from '../lib/pocketbase'
import { getUserCollection } from '../lib/api'
import { Card } from '../lib/types'
import { usePocketBase } from '../contexts/PocketBaseContext'
import CardImage from './CardImage'
import SkeletonLoader from './SkeletonLoader'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'

// Type for collection statistics
interface CollectionStats {
  totalCards: number
  uniqueCards: number
  setsRepresented: number
  totalValue: number
  colorDistribution: Record<string, number>
  typeDistribution: Record<string, number>
  rarityDistribution: Record<string, number>
  recentlyAdded: Card[]
}

// Color mapping for charts
const COLOR_MAP: Record<string, { name: string, color: string }> = {
  W: { name: 'White', color: 'bg-yellow-100' },
  U: { name: 'Blue', color: 'bg-blue-500' },
  B: { name: 'Black', color: 'bg-gray-800' },
  R: { name: 'Red', color: 'bg-red-600' },
  G: { name: 'Green', color: 'bg-green-600' },
  C: { name: 'Colorless', color: 'bg-gray-400' },
  M: { name: 'Multicolor', color: 'bg-yellow-600' }
}

// Rarity mapping for display
const RARITY_MAP: Record<string, { name: string, color: string }> = {
  common: { name: 'Common', color: 'bg-gray-400' },
  uncommon: { name: 'Uncommon', color: 'bg-blue-400' },
  rare: { name: 'Rare', color: 'bg-yellow-500' },
  mythic: { name: 'Mythic', color: 'bg-orange-600' },
  special: { name: 'Special', color: 'bg-purple-500' }
}

export default function Dashboard() {
  const [stats, setStats] = useState<CollectionStats>({
    totalCards: 0,
    uniqueCards: 0,
    setsRepresented: 0,
    totalValue: 0,
    colorDistribution: {},
    typeDistribution: {},
    rarityDistribution: {},
    recentlyAdded: []
  })
  const { isConnected } = usePocketBase()
  const { handleError } = useErrorHandler({ context: 'Dashboard' })
  const { isLoading, withLoading } = useLoadingState()

  // Function to calculate collection statistics
  const calculateStats = async () => {
    try {
      // Get all collection entries
      const collectionEntries = await withLoading('dashboard', () => getUserCollection())

      if (collectionEntries.length === 0) {
        setStats({
          totalCards: 0,
          uniqueCards: 0,
          setsRepresented: 0,
          totalValue: 0,
          colorDistribution: {},
          typeDistribution: {},
          rarityDistribution: {},
          recentlyAdded: []
        })
        return
      }

      // Calculate total cards (sum of quantities)
      const totalCards = collectionEntries.reduce((sum, entry) => sum + entry.collection.quantity, 0)

      // Count unique cards
      const uniqueCards = collectionEntries.length

      // Count unique sets
      const uniqueSets = new Set(collectionEntries.map(entry => entry.set_code).filter(Boolean))
      const setsRepresented = uniqueSets.size

      // Calculate total value
      const totalValue = collectionEntries.reduce((sum, entry) => {
        const cardPrice = entry.price_usd || 0
        return sum + (cardPrice * entry.collection.quantity)
      }, 0)

      // Calculate color distribution
      const colorDistribution: Record<string, number> = {}

      collectionEntries.forEach(entry => {
        if (!entry) return

        // Handle colorless cards
        if (!entry.colors || entry.colors.length === 0) {
          colorDistribution['C'] = (colorDistribution['C'] || 0) + entry.collection.quantity
          return
        }

        // Handle multicolor cards
        if (entry.colors.length > 1) {
          colorDistribution['M'] = (colorDistribution['M'] || 0) + entry.collection.quantity
          return
        }

        // Handle single color cards
        const color = entry.colors[0]
        colorDistribution[color] = (colorDistribution[color] || 0) + entry.collection.quantity
      })

      // Calculate type distribution
      const typeDistribution: Record<string, number> = {}

      collectionEntries.forEach(entry => {
        if (!entry) return

        // Extract primary type (before the dash)
        const typeLine = entry.type_line
        const primaryType = typeLine.split('—')[0].trim().split(' ').pop() || 'Unknown'

        typeDistribution[primaryType] = (typeDistribution[primaryType] || 0) + entry.collection.quantity
      })

      // Calculate rarity distribution
      const rarityDistribution: Record<string, number> = {}

      collectionEntries.forEach(entry => {
        if (!entry) return

        const rarity = entry.rarity
        rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + entry.collection.quantity
      })

      // Get recently added cards (last 5)
      const recentlyAdded = [...collectionEntries]
        .sort((a, b) => {
          const dateA = a.collection.acquired_date ? new Date(a.collection.acquired_date).getTime() : 0
          const dateB = b.collection.acquired_date ? new Date(b.collection.acquired_date).getTime() : 0
          return dateB - dateA
        })
        .slice(0, 5)

      // Update stats state
      setStats({
        totalCards,
        uniqueCards,
        setsRepresented,
        totalValue,
        colorDistribution,
        typeDistribution,
        rarityDistribution,
        recentlyAdded
      })
    } catch (error) {
      handleError(error, 'Failed to load collection statistics')
    }
  }

  // Initial load of statistics
  useEffect(() => {
    if (isConnected) {
      calculateStats()
    }
  }, [isConnected])

  // Set up real-time subscription for collection changes
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to collection changes
    const unsubscribePromise = pb.collection(COLLECTIONS.COLLECTIONS).subscribe('*', () => {
      calculateStats()
    })

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe())
    }
  }, [isConnected])

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Dashboard"
        description="Welcome to your Spell Binder"
        action={
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Cards
          </Link>
        }
      />

      {isLoading('dashboard') ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <SkeletonLoader variant="dashboard" count={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <SkeletonLoader variant="dashboard" count={4} />
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="h-4 bg-gray-300 rounded mb-4 w-1/3"></div>
            <SkeletonLoader variant="list" count={3} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Total Cards
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalCards}</p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Unique Cards
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.uniqueCards}</p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Sets Represented
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.setsRepresented}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Collection Value */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                Estimated Collection Value
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">Based on current market prices</p>
            </div>

            {/* Color Distribution */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                Color Distribution
              </h3>
              {Object.keys(stats.colorDistribution).length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {Object.entries(stats.colorDistribution).map(([color, count]) => (
                    <div key={color} className="flex items-center">
                      <div className="w-16 md:w-24 text-xs md:text-sm">{COLOR_MAP[color]?.name || color}</div>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-200 rounded-full h-3 md:h-4">
                          <div
                            className={`${COLOR_MAP[color]?.color || 'bg-gray-500'} h-3 md:h-4 rounded-full transition-all duration-300`}
                            style={{ width: `${(count / stats.totalCards) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-8 md:w-12 text-right text-xs md:text-sm font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No color data available</p>
              )}
            </div>

            {/* Rarity Distribution */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                Rarity Distribution
              </h3>
              {Object.keys(stats.rarityDistribution).length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {Object.entries(stats.rarityDistribution).map(([rarity, count]) => (
                    <div key={rarity} className="flex items-center">
                      <div className="w-16 md:w-24 text-xs md:text-sm capitalize">{rarity}</div>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-200 rounded-full h-3 md:h-4">
                          <div
                            className={`${RARITY_MAP[rarity]?.color || 'bg-gray-500'} h-3 md:h-4 rounded-full transition-all duration-300`}
                            style={{ width: `${(count / stats.totalCards) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-8 md:w-12 text-right text-xs md:text-sm font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No rarity data available</p>
              )}
            </div>

            {/* Type Distribution */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                Card Type Distribution
              </h3>
              {Object.keys(stats.typeDistribution).length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {Object.entries(stats.typeDistribution)
                    .sort((a, b) => b[1] - a[1]) // Sort by count descending
                    .slice(0, 5) // Show top 5 types
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center">
                        <div className="w-16 md:w-24 text-xs md:text-sm">{type}</div>
                        <div className="flex-1 mx-2">
                          <div className="w-full bg-gray-200 rounded-full h-3 md:h-4">
                            <div
                              className="bg-indigo-500 h-3 md:h-4 rounded-full transition-all duration-300"
                              style={{ width: `${(count / stats.totalCards) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-8 md:w-12 text-right text-xs md:text-sm font-medium">{count}</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No type data available</p>
              )}
            </div>
          </div>

          {/* Recently Added Cards */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              Recently Added Cards
            </h3>
            {stats.recentlyAdded.length > 0 ? (
              <>
                {/* Mobile card layout */}
                <div className="block md:hidden space-y-3">
                  {stats.recentlyAdded.map(entry => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <CardImage
                            card={entry}
                            cardName={entry.name || 'Unknown Card'}
                            size="small"
                            quality="low"
                            className="h-12 w-12 rounded object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {entry.name || 'Unknown Card'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.set_name || 'Unknown'} ({entry.set_code || ''})
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Qty: {entry.collection.quantity}</span>
                            <span>{entry.collection.condition} {entry.collection.foil ? '(Foil)' : ''}</span>
                            <span>{formatDate(entry.collection.acquired_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Card
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Set
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentlyAdded.map(entry => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 mr-4">
                                <CardImage
                                  card={entry}
                                  cardName={entry.name || 'Unknown Card'}
                                  size="small"
                                  quality="low"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {entry.name || 'Unknown Card'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{entry.set_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{entry.set_code || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.collection.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.collection.condition} {entry.collection.foil ? '(Foil)' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(entry.collection.acquired_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No cards in your collection yet
              </div>
            )}

            {stats.uniqueCards > 0 && (
              <div className="mt-4 text-center md:text-right">
                <Link
                  to="/collection"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Full Collection
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}