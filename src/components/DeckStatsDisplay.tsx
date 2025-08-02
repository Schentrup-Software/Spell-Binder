import { DeckStats } from '../lib/deckStats'

interface DeckStatsDisplayProps {
    stats: DeckStats
}

export default function DeckStatsDisplay({ stats }: DeckStatsDisplayProps) {
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deck Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
                        <div className="text-sm text-gray-500">Total Cards</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.averageCmc.toFixed(1)}</div>
                        <div className="text-sm text-gray-500">Avg. CMC</div>
                    </div>
                    <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-3 mb-2">
                            {Object.entries(stats.colorDistribution).map(([color, count]) => {
                                const colorClasses = {
                                    'W': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                    'U': 'bg-blue-100 text-blue-800 border-blue-200',
                                    'B': 'bg-gray-800 text-white border-gray-600',
                                    'R': 'bg-red-100 text-red-800 border-red-200',
                                    'G': 'bg-green-100 text-green-800 border-green-200',
                                    'C': 'bg-gray-100 text-gray-800 border-gray-200'
                                }
                                const manaSymbols = {
                                    'W': (<i className="ms ms-w" />),
                                    'U': (<i className="ms ms-u" />),
                                    'B': (<i className="ms ms-b" />),
                                    'R': (<i className="ms ms-r" />),
                                    'G': (<i className="ms ms-g" />),
                                    'C': (<i className="ms ms-c" />)
                                }
                                return (
                                    <div key={color} className="flex items-center gap-1">
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-lg ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                            title={`${color}: ${count} cards`}
                                        >
                                            {manaSymbols[color as keyof typeof manaSymbols] || color}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="text-sm text-gray-500">Color Distribution</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">${stats.totalValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Total Value</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
