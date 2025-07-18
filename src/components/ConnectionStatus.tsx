import { usePocketBase } from '../contexts/PocketBaseContext'

export default function ConnectionStatus() {
  const { isConnected, isLoading, error, reconnect } = usePocketBase()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span>Connecting...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-red-600">Disconnected</span>
        <button
          onClick={reconnect}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
        {error && (
          <span className="text-xs text-gray-500" title={error}>
            ({error.substring(0, 20)}...)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span>Connected</span>
    </div>
  )
}